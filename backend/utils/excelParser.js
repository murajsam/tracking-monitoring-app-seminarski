import XLSX from "xlsx";
import { convertWeight, isPotentialDate } from "./dataConverters.js";

// nazivi kolona koje ocekujemo u excel fajlu za svakog dostavljaca (DHL, Hellman, Logwin)
const carriers = [
  {
    name: "DHL",
    fields: [
      "Payer Account Number",
      "Pickup Date",
      "Origin Country/Territory IATA code",
      "Origin City IATA Code",
      "Destination Country/Territory IATA code",
      "Destination City IATA Code",
      "Waybill Number",
      "Shipper Reference Number",
      "Receiver",
      "Receiver Postal Code",
      "Product Code",
      "Pieces",
      "Piece ID",
      "Manifested Weight",
      "Estimated Delivery Date",
      "Last Checkpoint Code",
      "Latest Checkpoint Date/Time",
      "Latest Checkpoint",
      "Latest Checkpoint's Remarks",
      "Location of Scan",
      "Customer Uploaded Comments",
      "Comments",
    ],
  },
  {
    name: "Hellman",
    fields: [
      "Status",
      "House AWB",
      "Shipper Name",
      "Shipper Country",
      "Consignee Name",
      "Consignee Country",
      "Departure Country",
      "Departure Port",
      "Destination Country",
      "Destination Port",
      "Incoterm",
      "Flight No",
      "No of Packages",
      "Gross Weight (Kg)",
      "Chargeable Weight (Kg)",
      "Act. Pick Up",
      "Flight ETD",
      "Flight ATD",
      "Flight ETA",
      "Flight ATA",
      "Act. Delivery",
    ],
  },
  {
    name: "Logwin",
    fields: [
      "Status",
      "MOT",
      "Port of Origin",
      "Port of Destination",
      "Shipment No.",
      "House",
      "Master",
      "Shipper",
      "Consignee",
      "PO Number",
      "Shipper Ref.",
      "ETD",
      "ETA",
      "ATD",
      "ATA",
      "Vessel",
      "Voyage / Flight",
      "Carrier",
      "Container",
      "Packages",
      "Weight",
      "Volume",
    ],
  },
];

// vremenske zone za svakog dostavljaca (u minutima)
const carrierOffsets = {
  DHL: 60, // GMT+0100
  Hellman: 120, // GMT+0200
  Logwin: 120, // GMT+0200
};

// ocisti string (izbaci prelome reda i duple razmake) da bismo ga lepo uporedili sa nazivima kolona
const cleanString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll(/\r|\n/g, " ")
    .replaceAll("  ", " ");
};

// proverava da li je dati red zapravo "header" red nekog dostavljaca
// (header red je onaj ciji se svi nazivi nalaze u listi polja tog dostavljaca)
const findCarrier = (row) => {
  const keys = Object.keys(row).filter(
    (key) => row[key] !== null && row[key] !== undefined
  );
  const values = Object.values(row).filter(
    (value) => value !== null && value !== undefined
  );

  return carriers.find(
    (carrier) =>
      values.every((value) => carrier.fields.includes(cleanString(value))) ||
      keys.every((key) => carrier.fields.includes(cleanString(key)))
  );
};

// ako je vrednost datum, podesi je za vremensku zonu dostavljaca; ako nije validan datum, vrati null
const adjustDateForCarrier = (value, carrierName) => {
  const date = new Date(value);
  const offsetMinutes = carrierOffsets[carrierName] || 0;
  const adjustedDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  if (isNaN(adjustedDate.getTime())) {
    return null;
  }
  return adjustedDate;
};

// pretvara jednu vrednost iz excela u vrednost spremnu za bazu
// - ako je datum -> podesi vremensku zonu
// - ako je prazno ("") -> null
// - inace -> vrednost kakva jeste
const convertValue = (value, carrierName) => {
  if (isPotentialDate(value)) {
    return adjustDateForCarrier(value, carrierName);
  }
  if (value === "") {
    return null;
  }
  return value;
};

// pomocna funkcija za tezinu: pretvori u kg, a ako je 0 ili manje vrati null
const weightOrNull = (value) => {
  const kg = convertWeight(value);
  return kg <= 0 ? null : kg;
};

// vraca samo ona polja iz reda koja NISU vec iskoriscena u glavnom mapiranju
// (ta dodatna, specificna polja cuvamo u "Additional Info")
const getAdditionalInfo = (row, usedKeys) => {
  const additionalInfo = {};
  Object.keys(row).forEach((key) => {
    if (!usedKeys.includes(key)) {
      additionalInfo[key] = row[key];
    }
  });
  return additionalInfo;
};

// glavna funkcija: ucita excel, prepozna dostavljaca i vrati mapirane podatke za bazu
export const processExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: "buffer", // ucitavamo iz buffera
    cellDates: true, // datumi se parsiraju kao Date objekti
    sheetStubs: true, // prave se i prazni redovi/kolone
  });

  // prolazimo kroz svaki list (sheet) u fajlu
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // trazimo red u kom se nalaze nazivi kolona nekog dostavljaca
    let headerRowIndex = -1;
    let matchingCarrier = null;

    for (let i = 0; i < rows.length; i++) {
      const carrier = findCarrier(rows[i]);
      if (carrier) {
        matchingCarrier = carrier;
        headerRowIndex = i;
        break; // nasli smo dostavljaca, prekidamo petlju
      }
    }

    // ako nismo nasli dostavljaca u ovom listu, idemo na sledeci
    if (!matchingCarrier) {
      continue;
    }

    // citamo redove sa podacima (posle header reda; Logwin ima drugaciji raspored pa krece od istog reda)
    const startIndex =
      headerRowIndex + (matchingCarrier.name === "Logwin" ? 0 : 1);
    const retrievedTrackingData = [];

    for (let i = startIndex; i < rows.length; i++) {
      const rowItem = rows[i];
      if (!rowItem) continue;

      // svaku kolonu iz reda mapiramo na odgovarajuce polje dostavljaca
      const mappedRow = {};
      matchingCarrier.fields.forEach((field, index) => {
        const value = Object.values(rowItem)[index];
        mappedRow[field] = convertValue(value, matchingCarrier.name);
      });

      // dodajemo red samo ako nije potpuno prazan
      const hasSomeValue = Object.values(mappedRow).some(
        (value) =>
          value !== null &&
          value !== "" &&
          (typeof value !== "string" || value.trim() !== "")
      );
      if (hasSomeValue) {
        retrievedTrackingData.push(mappedRow);
      }
    }

    // sada svaki red prevodimo u jedinstveni format baze (mapiranje po pravilima iz mapping.csv)
    let trackingData = [];

    if (matchingCarrier.name === "DHL") {
      trackingData = retrievedTrackingData.map((row) => ({
        Status: null,
        "House AWB": row["Waybill Number"],
        Shipper: null,
        Receiver: row["Receiver"],
        "PO Number": null,
        "Shipper Ref. No": row["Shipper Reference Number"],
        ETD: null,
        ETA: row["Estimated Delivery Date"],
        ATD: null,
        ATA: null,
        Carrier: matchingCarrier.name,
        Packages: row["Pieces"],
        Weight: weightOrNull(row["Manifested Weight"]),
        Volume: null,
        "Shipper Country": null,
        "Receiver Country": null,
        "Inco Term": null,
        "Flight No": null,
        "Pick-up Date": null,
        "Latest Checkpoint": null,
        "Additional Info": getAdditionalInfo(row, [
          "Waybill Number",
          "Shipper Reference Number",
          "Receiver",
          "Pieces",
          "Manifested Weight",
          "Estimated Delivery Date",
        ]),
      }));
    } else if (matchingCarrier.name === "Hellman") {
      trackingData = retrievedTrackingData.map((row) => ({
        Status: row["Status"],
        "House AWB": row["House AWB"],
        Shipper: row["Shipper Name"],
        Receiver: row["Consignee Name"],
        "PO Number": null,
        "Shipper Ref. No": null,
        ETD: row["Flight ETD"],
        ETA: row["Flight ETA"],
        ATD: row["Flight ATD"],
        ATA: row["Flight ATA"],
        Carrier: matchingCarrier.name,
        Packages: row["No of Packages"],
        Weight: weightOrNull(row["Gross Weight (Kg)"]),
        Volume: null,
        "Shipper Country": row["Shipper Country"],
        "Receiver Country": row["Consignee Country"],
        "Inco Term": null,
        "Flight No": null,
        "Pick-up Date": null,
        "Latest Checkpoint": null,
        "Additional Info": getAdditionalInfo(row, [
          "Status",
          "House AWB",
          "Shipper Name",
          "Shipper Country",
          "Consignee Name",
          "Consignee Country",
          "Flight ETD",
          "Flight ETA",
          "Flight ATD",
          "Flight ATA",
          "No of Packages",
          "Gross Weight (Kg)",
        ]),
      }));
    } else if (matchingCarrier.name === "Logwin") {
      trackingData = retrievedTrackingData.map((row) => ({
        Status: row["Status"],
        "House AWB": row["House"],
        Shipper: row["Shipper"],
        Receiver: row["Consignee"],
        "PO Number": row["PO Number"],
        "Shipper Ref. No": row["Shipper Ref."],
        ETD: row["ETD"],
        ETA: row["ETA"],
        ATD: row["ATD"],
        ATA: row["ATA"],
        Carrier: matchingCarrier.name,
        Packages: row["Packages"],
        Weight: weightOrNull(row["Weight"]),
        Volume: row["Volume"],
        "Shipper Country": null,
        "Receiver Country": null,
        "Inco Term": null,
        "Flight No": null,
        "Pick-up Date": null,
        "Latest Checkpoint": null,
        "Additional Info": getAdditionalInfo(row, [
          "Status",
          "House",
          "Shipper",
          "Consignee",
          "PO Number",
          "Shipper Ref.",
          "ETD",
          "ETA",
          "ATD",
          "ATA",
          "Carrier",
          "Packages",
          "Weight",
          "Volume",
        ]),
      }));
    }

    // vracamo gotove podatke i ime prepoznatog dostavljaca
    return { trackingData, carrier: matchingCarrier.name };
  }

  // ako nijedan list nije imao prepoznatog dostavljaca
  return { trackingData: [], carrier: "Unknown" };
};
