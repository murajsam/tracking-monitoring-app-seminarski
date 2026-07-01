import XLSX from "xlsx";
import { convertWeight, isPotentialDate } from "./dataConverters.js";

// expected column names in the excel file for each carrier (DHL, Hellman, Logwin)
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

// time zones for each carrier (in minutes)
const carrierOffsets = {
  DHL: 60, // GMT+0100
  Hellman: 120, // GMT+0200
  Logwin: 120, // GMT+0200
};

// clean a string (strip line breaks and double spaces) so it compares nicely to column names
const cleanString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll(/\r|\n/g, " ")
    .replaceAll("  ", " ");
};

// checks whether the given row is actually a carrier's "header" row
// (a header row is one whose names all appear in that carrier's field list)
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

// if the value is a date, adjust it to the carrier's time zone; if not a valid date, return null
const adjustDateForCarrier = (value, carrierName) => {
  const date = new Date(value);
  const offsetMinutes = carrierOffsets[carrierName] || 0;
  const adjustedDate = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  if (isNaN(adjustedDate.getTime())) {
    return null;
  }
  return adjustedDate;
};

// converts a single excel value into a value ready for the database
// - if it's a date -> adjust the time zone
// - if it's empty ("") -> null
// - otherwise -> the value as is
const convertValue = (value, carrierName) => {
  if (isPotentialDate(value)) {
    return adjustDateForCarrier(value, carrierName);
  }
  if (value === "") {
    return null;
  }
  return value;
};

// weight helper: convert to kg, and if 0 or less return null
const weightOrNull = (value) => {
  const kg = convertWeight(value);
  return kg <= 0 ? null : kg;
};

// returns only the row fields that are NOT already used in the main mapping
// (these extra, carrier-specific fields are kept in "Additional Info")
const getAdditionalInfo = (row, usedKeys) => {
  const additionalInfo = {};
  Object.keys(row).forEach((key) => {
    if (!usedKeys.includes(key)) {
      additionalInfo[key] = row[key];
    }
  });
  return additionalInfo;
};

// main function: read the excel, detect the carrier and return data mapped for the database
export const processExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: "buffer", // read from the buffer
    cellDates: true, // dates are parsed as Date objects
    sheetStubs: true, // empty rows/columns are created too
  });

  // prolazimo kroz svaki list (sheet) u fajlu
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // find the row that holds a carrier's column names
    let headerRowIndex = -1;
    let matchingCarrier = null;

    for (let i = 0; i < rows.length; i++) {
      const carrier = findCarrier(rows[i]);
      if (carrier) {
        matchingCarrier = carrier;
        headerRowIndex = i;
        break; // found the carrier, break the loop
      }
    }

    // if we didn't find a carrier in this sheet, move to the next
    if (!matchingCarrier) {
      continue;
    }

    // read the data rows (after the header row; Logwin has a different layout so it starts from the same row)
    const startIndex =
      headerRowIndex + (matchingCarrier.name === "Logwin" ? 0 : 1);
    const retrievedTrackingData = [];

    for (let i = startIndex; i < rows.length; i++) {
      const rowItem = rows[i];
      if (!rowItem) continue;

      // map each column of the row to the carrier's matching field
      const mappedRow = {};
      matchingCarrier.fields.forEach((field, index) => {
        const value = Object.values(rowItem)[index];
        mappedRow[field] = convertValue(value, matchingCarrier.name);
      });

      // add the row only if it isn't completely empty
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

    // now translate each row into the unified database format (mapping rules)
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

    // return the finished data and the name of the detected carrier
    return { trackingData, carrier: matchingCarrier.name };
  }

  // if no sheet had a recognized carrier
  return { trackingData: [], carrier: "Unknown" };
};
