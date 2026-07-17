// generates synthetic Excel test datasets for the experimental evaluation
// usage:
//   node benchmark/gen_dataset.js selftest  -> tiny files, checked against the parser
//   node benchmark/gen_dataset.js A         -> scenarios with 100/300/500/1000 input files
//   node benchmark/gen_dataset.js B         -> single files with 1k/5k/10k/50k rows
//   node benchmark/gen_dataset.js all       -> everything
//
// every dataset gets a manifest.json with the exact number of injected
// duplicates and invalid cells, so the benchmark can verify what the
// system detected against what was really put in
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { carriers } from "../utils/carrierConfig.js";
import { processExcelFile } from "../utils/excelParser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

// small seeded random generator so every run produces the same dataset (reproducible experiments)
const mulberry32 = (seed) => {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];
const int = (rnd, min, max) => min + Math.floor(rnd() * (max - min + 1));

// random date string in a format the app recognizes (M/D/YYYY HH:MM)
const rndDate = (rnd) => {
  const m = int(rnd, 1, 12);
  const d = int(rnd, 1, 28);
  const hh = String(int(rnd, 0, 23)).padStart(2, "0");
  const mm = String(int(rnd, 0, 59)).padStart(2, "0");
  return `${m}/${d}/2026 ${hh}:${mm}`;
};

// value pools for realistic looking data
const COMPANIES = ["Acme GmbH", "Balkan Trade d.o.o.", "TechParts Ltd", "EuroFoods AG", "Nordwind AB", "Adriatic Export", "Pannonia Kft", "Silk Route Co"];
const COUNTRIES = ["Germany", "Serbia", "USA", "China", "France", "Italy", "Netherlands", "Austria"];
const IATA_COUNTRY = ["DE", "RS", "US", "CN", "FR", "IT", "NL", "AT"];
const IATA_CITY = ["BEG", "FRA", "JFK", "PVG", "CDG", "MXP", "AMS", "VIE"];
const PORTS = ["Hamburg", "Belgrade", "New York", "Shanghai", "Le Havre", "Genoa", "Rotterdam", "Vienna"];
const STATUSES = ["In Transit", "Delivered", "Booked", "Departed", "Arrived"];
const INCOTERMS = ["EXW", "FOB", "DAP", "DDP", "CIF"];
const CHECKPOINTS = ["Shipment picked up", "Processed at facility", "Departed facility", "Arrived at facility", "With delivery courier"];

// build a full row (as array of cells) for one carrier, aligned to the column order from the configuration
const buildRow = (carrierCfg, valuesByCol) =>
  carrierCfg.fields.map((col) => (valuesByCol[col] !== undefined ? valuesByCol[col] : ""));

// one realistic DHL row; id keeps the waybill number unique
const dhlRow = (id, rnd) => ({
  "Payer Account Number": String(950000000 + int(rnd, 1, 9999)),
  "Pickup Date": rndDate(rnd),
  "Origin Country/Territory IATA code": pick(rnd, IATA_COUNTRY),
  "Origin City IATA Code": pick(rnd, IATA_CITY),
  "Destination Country/Territory IATA code": pick(rnd, IATA_COUNTRY),
  "Destination City IATA Code": pick(rnd, IATA_CITY),
  "Waybill Number": String(1000000000 + id),
  "Shipper Reference Number": `REF-${100000 + id}`,
  Receiver: pick(rnd, COMPANIES),
  "Receiver Postal Code": String(int(rnd, 10000, 99999)),
  "Product Code": pick(rnd, ["P", "D", "W"]),
  Pieces: int(rnd, 1, 20),
  "Piece ID": `JD${int(rnd, 100000000, 999999999)}`,
  "Manifested Weight": rnd() < 0.2 ? `${(rnd() * 50 + 1).toFixed(1)} lbs` : (rnd() * 120 + 0.5).toFixed(2),
  "Estimated Delivery Date": rndDate(rnd),
  "Last Checkpoint Code": pick(rnd, ["PU", "AR", "DF", "OK"]),
  "Latest Checkpoint Date/Time": rndDate(rnd),
  "Latest Checkpoint": pick(rnd, CHECKPOINTS),
  "Latest Checkpoint's Remarks": "",
  "Location of Scan": pick(rnd, PORTS),
  "Customer Uploaded Comments": "",
  Comments: "",
});

// one realistic Hellman row
const hellmanRow = (id, rnd) => ({
  Status: pick(rnd, STATUSES),
  "House AWB": `HLM-${200000 + id}`,
  "Shipper Name": pick(rnd, COMPANIES),
  "Shipper Country": pick(rnd, COUNTRIES),
  "Consignee Name": pick(rnd, COMPANIES),
  "Consignee Country": pick(rnd, COUNTRIES),
  "Departure Country": pick(rnd, COUNTRIES),
  "Departure Port": pick(rnd, PORTS),
  "Destination Country": pick(rnd, COUNTRIES),
  "Destination Port": pick(rnd, PORTS),
  Incoterm: pick(rnd, INCOTERMS),
  "Flight No": `LH${int(rnd, 100, 999)}`,
  "No of Packages": int(rnd, 1, 40),
  "Gross Weight (Kg)": (rnd() * 500 + 1).toFixed(1),
  "Chargeable Weight (Kg)": (rnd() * 500 + 1).toFixed(1),
  "Act. Pick Up": rndDate(rnd),
  "Flight ETD": rndDate(rnd),
  "Flight ATD": rndDate(rnd),
  "Flight ETA": rndDate(rnd),
  "Flight ATA": rnd() < 0.5 ? rndDate(rnd) : "",
  "Act. Delivery": rnd() < 0.3 ? rndDate(rnd) : "",
});

// one realistic Logwin row
const logwinRow = (id, rnd) => ({
  Status: pick(rnd, STATUSES),
  MOT: pick(rnd, ["AIR", "SEA"]),
  "Port of Origin": pick(rnd, PORTS),
  "Port of Destination": pick(rnd, PORTS),
  "Shipment No.": `LGW-S${300000 + id}`,
  House: `LGW-${300000 + id}`,
  Master: `M${int(rnd, 100000, 999999)}`,
  Shipper: pick(rnd, COMPANIES),
  Consignee: pick(rnd, COMPANIES),
  "PO Number": `PO-${400000 + id}`,
  "Shipper Ref.": `SR-${500000 + id}`,
  ETD: rndDate(rnd),
  ETA: rndDate(rnd),
  ATD: rnd() < 0.6 ? rndDate(rnd) : "",
  ATA: rnd() < 0.4 ? rndDate(rnd) : "",
  Vessel: pick(rnd, ["MSC Aurora", "Maersk Elba", "CMA CGM Lyra", ""]),
  "Voyage / Flight": `V${int(rnd, 100, 999)}`,
  Carrier: pick(rnd, ["Lufthansa", "Maersk", "MSC", "Turkish Cargo"]),
  Container: `CONT${int(rnd, 1000000, 9999999)}`,
  Packages: int(rnd, 1, 30),
  Weight: (rnd() * 800 + 1).toFixed(1),
  Volume: (rnd() * 20 + 0.1).toFixed(2),
});

const ROW_BUILDERS = { DHL: dhlRow, Hellman: hellmanRow, Logwin: logwinRow };

// which columns get the injected invalid values, per carrier
// (both kinds are cleaned up by the parser itself, before the duplicate check)
const INVALID_TARGETS = {
  DHL: [
    { column: "Estimated Delivery Date", value: "31/31/2026", unifiedField: "ETA" },
    { column: "Manifested Weight", value: "invalid", unifiedField: "Weight" },
  ],
  Hellman: [
    { column: "Flight ETA", value: "31/31/2026", unifiedField: "ETA" },
    { column: "Gross Weight (Kg)", value: "invalid", unifiedField: "Weight" },
  ],
  Logwin: [
    { column: "ETA", value: "31/31/2026", unifiedField: "ETA" },
    { column: "Weight", value: "invalid", unifiedField: "Weight" },
  ],
};

// sheet layouts: DHL and Hellman exports have a report header above the column names,
// Logwin exports have the column names as the very first row
const sheetRows = (carrierCfg, dataRows) => {
  if (carrierCfg.name === "Logwin") {
    return [carrierCfg.fields, ...dataRows];
  }
  return [["Shipment Report", "Generated", "7/1/2026"], carrierCfg.fields, ...dataRows];
};

// a file that looks like a DHL export but has renamed columns -> the system must report it as an error
const unknownFileRows = (rnd, rowCount) => {
  const dhlCfg = carriers.find((c) => c.name === "DHL");
  const badHeader = dhlCfg.fields.map((f) =>
    f === "Waybill Number" ? "Waybill No." : f === "Pieces" ? "Pcs" : f === "Receiver" ? "Recipient" : f
  );
  const rows = [];
  for (let i = 0; i < rowCount; i++) {
    rows.push(Object.values(dhlRow(900000 + i, rnd)));
  }
  return [["Shipment Report", "Generated", "7/1/2026"], badHeader, ...rows];
};

const writeXlsx = (filePath, rows) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filePath);
};

// generates one carrier file and returns its manifest entry + the raw rows (for whole-file copies)
// pool = rows from earlier files that duplicates can be copied from
const makeCarrierFile = (opts) => {
  const { carrierCfg, fileName, rowCount, rnd, idCounter, pool, dupRate, invalidRate } = opts;
  const dataRows = [];
  const invalidCells = [];
  let expectedDuplicates = 0;

  for (let i = 0; i < rowCount; i++) {
    // sometimes copy an already emitted row -> the system must detect it as a duplicate
    if (pool.length > 0 && rnd() < dupRate) {
      const original = pick(rnd, pool);
      dataRows.push(original.slice());
      expectedDuplicates++;
      continue;
    }

    const valuesByCol = ROW_BUILDERS[carrierCfg.name](idCounter.next++, rnd);

    // sometimes damage one cell -> the system must clean it to null
    let injected = null;
    if (rnd() < invalidRate) {
      injected = pick(rnd, INVALID_TARGETS[carrierCfg.name]);
      valuesByCol[injected.column] = injected.value;
    }

    const row = buildRow(carrierCfg, valuesByCol);
    dataRows.push(row);
    if (injected) {
      invalidCells.push({ row: dataRows.length - 1, field: injected.unifiedField });
    } else {
      // only clean rows go into the duplicate pool, so expected counts stay exact
      pool.push(row);
    }
  }

  return {
    entry: { name: fileName, type: carrierCfg.name, rows: rowCount, expectedDuplicates, invalidCells },
    sheet: sheetRows(carrierCfg, dataRows),
  };
};

// experiment A: many input files (mixed carriers + unknown files + whole-file copies)
const generateScenarioA = (fileCount) => {
  const scenario = `A_${fileCount}`;
  const dir = path.join(DATA_DIR, scenario);
  fs.mkdirSync(dir, { recursive: true });

  const rnd = mulberry32(1000 + fileCount);
  const idCounter = { next: 1 };
  const pools = { DHL: [], Hellman: [], Logwin: [] };
  const manifest = { scenario, files: [] };
  const savedSheets = []; // valid files, candidates for whole-file copies

  for (let f = 0; f < fileCount; f++) {
    const num = String(f + 1).padStart(4, "0");

    // ~4%: the same file uploaded again (every row must be reported as a duplicate)
    if (savedSheets.length > 5 && f % 25 === 24) {
      const source = pick(rnd, savedSheets);
      const fileName = `copy_of_${source.entry.name.replace(".xlsx", "")}_${num}.xlsx`;
      writeXlsx(path.join(dir, fileName), source.sheet);
      manifest.files.push({
        name: fileName,
        type: source.entry.type,
        rows: source.entry.rows,
        expectedDuplicates: source.entry.rows,
        invalidCells: source.entry.invalidCells.map((c) => ({ ...c })),
        copyOfFile: source.entry.name,
      });
      continue;
    }

    const r = rnd();
    // ~10%: a file whose carrier can't be recognized (error case)
    if (r < 0.1) {
      const rowCount = int(rnd, 30, 60);
      const fileName = `unknown_${num}.xlsx`;
      writeXlsx(path.join(dir, fileName), unknownFileRows(rnd, rowCount));
      manifest.files.push({ name: fileName, type: "Unknown", rows: rowCount, expectedDuplicates: 0, invalidCells: [] });
      continue;
    }

    // the rest: valid carrier files (DHL 35%, Hellman 30%, Logwin 25%)
    const carrierName = r < 0.45 ? "DHL" : r < 0.75 ? "Hellman" : "Logwin";
    const carrierCfg = carriers.find((c) => c.name === carrierName);
    const fileName = `${carrierName.toLowerCase()}_${num}.xlsx`;
    const { entry, sheet } = makeCarrierFile({
      carrierCfg,
      fileName,
      rowCount: int(rnd, 30, 60),
      rnd,
      idCounter,
      pool: pools[carrierName],
      dupRate: 0.08,
      invalidRate: 0.02,
    });
    writeXlsx(path.join(dir, fileName), sheet);
    manifest.files.push(entry);
    savedSheets.push({ entry, sheet });
  }

  // totals for a quick overview
  manifest.totals = {
    files: manifest.files.length,
    rows: manifest.files.reduce((s, x) => s + x.rows, 0),
    unknownFiles: manifest.files.filter((x) => x.type === "Unknown").length,
    expectedDuplicates: manifest.files.reduce((s, x) => s + x.expectedDuplicates, 0),
    invalidCells: manifest.files.reduce((s, x) => s + x.invalidCells.length, 0),
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`${scenario}: ${manifest.totals.files} files, ${manifest.totals.rows} rows, ` +
    `${manifest.totals.unknownFiles} unknown, ${manifest.totals.expectedDuplicates} dups, ${manifest.totals.invalidCells} invalid cells`);
};

// experiment B: one big file with N rows for one carrier
const generateScenarioB = (carrierName, rowCount) => {
  const scenario = `B_${carrierName.toLowerCase()}_${rowCount}`;
  const dir = path.join(DATA_DIR, scenario);
  fs.mkdirSync(dir, { recursive: true });

  const rnd = mulberry32(2000 + rowCount + carrierName.length);
  const idCounter = { next: 1 };
  const carrierCfg = carriers.find((c) => c.name === carrierName);
  const fileName = `${carrierName.toLowerCase()}_${rowCount}.xlsx`;
  const { entry, sheet } = makeCarrierFile({
    carrierCfg,
    fileName,
    rowCount,
    rnd,
    idCounter,
    pool: [],
    dupRate: 0.05,
    invalidRate: 0.01,
  });
  writeXlsx(path.join(dir, fileName), sheet);

  const manifest = { scenario, files: [entry] };
  manifest.totals = {
    files: 1,
    rows: entry.rows,
    unknownFiles: 0,
    expectedDuplicates: entry.expectedDuplicates,
    invalidCells: entry.invalidCells.length,
  };
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`${scenario}: ${entry.rows} rows, ${entry.expectedDuplicates} dups, ${entry.invalidCells.length} invalid cells`);
};

// quick check that generated files are really recognized by the parser
const selftest = () => {
  const rnd = mulberry32(42);
  const idCounter = { next: 1 };
  let ok = true;

  for (const carrierCfg of carriers) {
    const { entry, sheet } = makeCarrierFile({
      carrierCfg, fileName: "t.xlsx", rowCount: 10, rnd, idCounter, pool: [], dupRate: 0, invalidRate: 0,
    });
    const ws = XLSX.utils.aoa_to_sheet(sheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const result = processExcelFile(buffer);
    const pass = result.carrier === carrierCfg.name && result.trackingData.length === entry.rows;
    console.log(`${carrierCfg.name}: detected=${result.carrier}, rows=${result.trackingData.length}/${entry.rows} -> ${pass ? "OK" : "FAIL"}`);
    if (!pass) ok = false;
  }

  // the unknown file must NOT be recognized
  const unknownSheet = unknownFileRows(rnd, 10);
  const ws = XLSX.utils.aoa_to_sheet(unknownSheet);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const result = processExcelFile(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  const pass = result.carrier === "Unknown";
  console.log(`Unknown: detected=${result.carrier} -> ${pass ? "OK" : "FAIL"}`);
  if (!pass) ok = false;

  console.log(ok ? "SELFTEST PASS" : "SELFTEST FAIL");
  process.exit(ok ? 0 : 1);
};

const mode = process.argv[2] || "all";
if (mode === "selftest") {
  selftest();
} else {
  if (mode === "A" || mode === "all") {
    [100, 300, 500, 1000].forEach(generateScenarioA);
  }
  if (mode === "B" || mode === "all") {
    [1000, 5000, 10000, 50000].forEach((n) => generateScenarioB("Hellman", n));
    generateScenarioB("DHL", 10000);
    generateScenarioB("Logwin", 10000);
  }
  console.log("DONE");
}
