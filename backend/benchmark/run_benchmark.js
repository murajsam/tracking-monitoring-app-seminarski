// runs one benchmark scenario over a generated dataset and writes results/<scenario>.json
// usage:
//   node benchmark/run_benchmark.js A_100              -> full pipeline (parse + import into MongoDB)
//   node benchmark/run_benchmark.js B_hellman_5000 --parse-only
//      -> no database, measures the parsing/mapping split (XLSX read vs carrier detection + mapping)
//
// requires a running MongoDB (default mongodb://127.0.0.1:27017/, override with MONGO_URI)
// measurements use the exact same production modules the app itself uses
// (utils/excelParser.js and utils/importTracking.js)
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";
import { exec } from "child_process";
import XLSX from "xlsx";
import mongoose from "mongoose";
import File from "../models/file.model.js";
import { processExcelFile } from "../utils/excelParser.js";
import { importTrackingData } from "../utils/importTracking.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scenario = process.argv[2];
const parseOnly = process.argv.includes("--parse-only");
if (!scenario) {
  console.error("Usage: node benchmark/run_benchmark.js <scenario> [--parse-only]");
  process.exit(1);
}

const dataDir = path.join(__dirname, "data", scenario);
const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, "manifest.json"), "utf-8"));
const resultsDir = path.join(__dirname, "results");
fs.mkdirSync(resultsDir, { recursive: true });

// ---------- samplers (memory + cpu) ----------

// peak memory of this Node process, sampled every 250 ms
const memPeak = { rss: 0, heapUsed: 0 };
const memTimer = setInterval(() => {
  const m = process.memoryUsage();
  if (m.rss > memPeak.rss) memPeak.rss = m.rss;
  if (m.heapUsed > memPeak.heapUsed) memPeak.heapUsed = m.heapUsed;
}, 250);
memTimer.unref();

// system-wide cpu usage from os.cpus() tick counters
const cpuTicks = () => {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const t of Object.values(cpu.times)) total += t;
    idle += cpu.times.idle;
  }
  return { idle, total };
};

// mongod process stats via wmic (memory in bytes, cpu times in 100ns units)
const mongodStats = () =>
  new Promise((resolve) => {
    exec(
      'wmic process where "name like \'mongod%\'" get WorkingSetSize,UserModeTime,KernelModeTime /format:csv',
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const line = stdout.trim().split("\n").filter((l) => l.includes(",")).pop();
        if (!line || line.includes("KernelModeTime,")) return resolve(null);
        const parts = line.trim().split(",");
        if (parts.length < 4) return resolve(null);
        const [, kernel, user, ws] = parts;
        resolve({ cpuMs: (Number(kernel) + Number(user)) / 10000, wsBytes: Number(ws) });
      }
    );
  });

const mongodPeak = { wsBytes: 0 };
let mongodTimer = null;

// ---------- main ----------

(async () => {
  const uriBase = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/";
  const dbName = "bench_" + scenario.toLowerCase();

  if (!parseOnly) {
    await mongoose.connect(uriBase + dbName);
    await mongoose.connection.dropDatabase();
    mongodTimer = setInterval(async () => {
      const s = await mongodStats();
      if (s && s.wsBytes > mongodPeak.wsBytes) mongodPeak.wsBytes = s.wsBytes;
    }, 2000);
    mongodTimer.unref();
  }

  const mongodStart = parseOnly ? null : await mongodStats();
  const ticksStart = cpuTicks();
  const cpuStart = process.cpuUsage();
  const wallStart = performance.now();

  const perFile = [];
  const totals = {
    files: 0,
    rows: 0,
    imported: 0,
    duplicates: 0,
    failedFiles: 0,
    invalidInjected: 0,
    invalidDetected: 0,
    loadParseMs: 0,
    importMs: 0,
    xlsxReadMs: 0,
    detectMapMs: 0,
  };

  for (const fileEntry of manifest.files) {
    const filePath = path.join(dataDir, fileEntry.name);
    const record = { name: fileEntry.name, type: fileEntry.type, rows: fileEntry.rows };

    if (parseOnly) {
      // split measurement: how long the raw XLSX read takes vs the whole parser
      // (whole parser - raw read = carrier detection + mapping to the unified structure)
      const buffer = fs.readFileSync(filePath);
      const tA = performance.now();
      XLSX.read(buffer, { type: "buffer", cellDates: true, sheetStubs: true });
      const tB = performance.now();
      const { trackingData, carrier } = processExcelFile(buffer);
      const tC = performance.now();
      record.xlsxReadMs = tB - tA;
      record.totalParseMs = tC - tB;
      record.detectMapMs = record.totalParseMs - record.xlsxReadMs;
      record.carrier = carrier;
      record.mappedRows = trackingData.length;
      totals.xlsxReadMs += record.xlsxReadMs;
      totals.detectMapMs += record.detectMapMs;
      totals.loadParseMs += record.totalParseMs;
    } else {
      // phase 1: load the file and run the full parser (read + detect + map)
      const t0 = performance.now();
      const buffer = fs.readFileSync(filePath);
      const { trackingData, carrier } = processExcelFile(buffer);
      const t1 = performance.now();
      record.loadParseMs = t1 - t0;
      record.carrier = carrier;

      // same flow as the upload controller
      const fileRecord = new File({
        fileName: fileEntry.name,
        carrier: carrier || "Unknown",
        totalRows: trackingData.length,
        status: "N/A",
      });

      if (!fileRecord.carrier || fileRecord.carrier === "Unknown") {
        fileRecord.status = "Failed";
        fileRecord.failureReason = "Carrier is not recognized or is missing.";
        await fileRecord.save();
        record.status = "Failed";
        totals.failedFiles++;
      } else {
        // phase 2: import into the database with duplicate detection
        const t2 = performance.now();
        const { importedRows, duplicatedRows } = await importTrackingData(trackingData, fileRecord);
        record.importMs = performance.now() - t2;

        fileRecord.importedRows = importedRows;
        fileRecord.duplicatedRows = duplicatedRows;
        fileRecord.calculateSuccessRate();
        fileRecord.status = importedRows > 0 ? "Validated" : "Failed";
        await fileRecord.save();

        record.status = fileRecord.status;
        record.imported = importedRows;
        record.duplicates = duplicatedRows;
        totals.imported += importedRows;
        totals.duplicates += duplicatedRows;
        totals.importMs += record.importMs;
      }
      totals.loadParseMs += record.loadParseMs;

      // check that injected invalid cells were really cleaned to null by the parser
      for (const cell of fileEntry.invalidCells) {
        totals.invalidInjected++;
        const row = trackingData[cell.row];
        if (row && row[cell.field] === null) totals.invalidDetected++;
      }
    }

    totals.files++;
    totals.rows += fileEntry.rows;
    perFile.push(record);
  }

  const wallMs = performance.now() - wallStart;
  const cpuEnd = process.cpuUsage(cpuStart);
  const ticksEnd = cpuTicks();
  const mongodEnd = parseOnly ? null : await mongodStats();

  clearInterval(memTimer);
  if (mongodTimer) clearInterval(mongodTimer);

  const sysTotal = ticksEnd.total - ticksStart.total;
  const sysIdle = ticksEnd.idle - ticksStart.idle;

  const result = {
    scenario,
    mode: parseOnly ? "parse-only" : "full",
    date: new Date().toISOString(),
    environment: {
      node: process.version,
      os: `${os.type()} ${os.release()}`,
      cpu: os.cpus()[0].model.trim(),
      logicalCores: os.cpus().length,
      totalRamGB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
      db: parseOnly ? null : "MongoDB (local)",
    },
    expected: manifest.totals,
    totals,
    timing: {
      wallMs: Number(wallMs.toFixed(0)),
      avgPerFileMs: Number((wallMs / totals.files).toFixed(1)),
      rowsPerSecond: Number((totals.rows / (wallMs / 1000)).toFixed(1)),
    },
    memory: {
      nodePeakRssMB: Number((memPeak.rss / 1024 ** 2).toFixed(1)),
      nodePeakHeapMB: Number((memPeak.heapUsed / 1024 ** 2).toFixed(1)),
      mongodPeakWsMB: mongodPeak.wsBytes ? Number((mongodPeak.wsBytes / 1024 ** 2).toFixed(1)) : null,
    },
    cpu: {
      nodeUserMs: Number((cpuEnd.user / 1000).toFixed(0)),
      nodeSystemMs: Number((cpuEnd.system / 1000).toFixed(0)),
      nodeCpuPercentOfOneCore: Number((((cpuEnd.user + cpuEnd.system) / 1000 / wallMs) * 100).toFixed(1)),
      systemCpuPercent: sysTotal > 0 ? Number((((sysTotal - sysIdle) / sysTotal) * 100).toFixed(1)) : null,
      mongodCpuMs: mongodStart && mongodEnd ? Number((mongodEnd.cpuMs - mongodStart.cpuMs).toFixed(0)) : null,
    },
    perFile,
  };

  const outName = (parseOnly ? "split_" : "") + scenario + ".json";
  fs.writeFileSync(path.join(resultsDir, outName), JSON.stringify(result, null, 2));

  console.log(`--- ${scenario} (${result.mode}) ---`);
  console.log(`files: ${totals.files}, rows: ${totals.rows}, wall: ${(wallMs / 1000).toFixed(1)}s`);
  if (!parseOnly) {
    const unknownRows = manifest.files
      .filter((f) => f.type === "Unknown")
      .reduce((s, f) => s + f.rows, 0);
    console.log(`imported: ${totals.imported} (expected ${manifest.totals.rows - manifest.totals.expectedDuplicates - unknownRows})`);
    console.log(`duplicates: ${totals.duplicates} (expected ${manifest.totals.expectedDuplicates})`);
    console.log(`failed files: ${totals.failedFiles} (expected ${manifest.totals.unknownFiles})`);
    console.log(`invalid cells detected: ${totals.invalidDetected}/${totals.invalidInjected}`);
    console.log(`loadParse: ${(totals.loadParseMs / 1000).toFixed(1)}s, import: ${(totals.importMs / 1000).toFixed(1)}s`);
  } else {
    console.log(`xlsxRead: ${(totals.xlsxReadMs / 1000).toFixed(2)}s, detect+map: ${(totals.detectMapMs / 1000).toFixed(2)}s`);
  }
  console.log(`node peak RSS: ${result.memory.nodePeakRssMB} MB, mongod peak WS: ${result.memory.mongodPeakWsMB} MB`);
  console.log(`node CPU: ${result.cpu.nodeCpuPercentOfOneCore}% of one core, system: ${result.cpu.systemCpuPercent}%`);
  console.log(`saved -> results/${outName}`);

  if (!parseOnly) await mongoose.disconnect();
  process.exit(0);
})().catch(async (e) => {
  console.error("BENCHMARK ERROR:", e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
