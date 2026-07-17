import XLSX from "xlsx";
import { convertWeight, isPotentialDate } from "./dataConverters.js";
import { carriers } from "./carrierConfig.js";

// carrier definitions (expected column names, mapping rules, header offset, time zone)
// come from config/carriers.json, so a new carrier can be added
// by editing the configuration only - without changing this code

// unified database fields - every carrier's row is translated into this structure
const UNIFIED_FIELDS = [
  "Status",
  "House AWB",
  "Shipper",
  "Receiver",
  "PO Number",
  "Shipper Ref. No",
  "ETD",
  "ETA",
  "ATD",
  "ATA",
  "Carrier",
  "Packages",
  "Weight",
  "Volume",
  "Shipper Country",
  "Receiver Country",
  "Inco Term",
  "Flight No",
  "Pick-up Date",
  "Latest Checkpoint",
];

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
const adjustDateForCarrier = (value, carrier) => {
  const date = new Date(value);
  const offsetMinutes = carrier.timezoneOffsetMinutes || 0;
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
const convertValue = (value, carrier) => {
  if (isPotentialDate(value)) {
    return adjustDateForCarrier(value, carrier);
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

// translates one carrier row into the unified database format
// using the "mapping" rules from the configuration:
// - "Carrier" is always the detected carrier's name
// - "Weight" goes through the kg conversion
// - fields without a mapping rule stay null
// - leftover columns are kept in "Additional Info"
const mapToUnified = (row, carrier) => {
  const unifiedRow = {};
  UNIFIED_FIELDS.forEach((field) => {
    const sourceColumn = carrier.mapping[field];
    if (field === "Carrier") {
      unifiedRow[field] = carrier.name;
    } else if (!sourceColumn) {
      unifiedRow[field] = null;
    } else if (field === "Weight") {
      unifiedRow[field] = weightOrNull(row[sourceColumn]);
    } else {
      unifiedRow[field] = row[sourceColumn];
    }
  });

  // columns already used by the mapping (plus explicitly excluded ones) don't go to Additional Info
  const usedKeys = Object.values(carrier.mapping).concat(
    carrier.additionalInfoExclude || []
  );
  unifiedRow["Additional Info"] = getAdditionalInfo(row, usedKeys);

  return unifiedRow;
};

// main function: read the excel, detect the carrier and return data mapped for the database
export const processExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, {
    type: "buffer", // read from the buffer
    cellDates: true, // dates are parsed as Date objects
    sheetStubs: true, // empty rows/columns are created too
  });

  // go through every sheet in the file
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

    // read the data rows (offset after the header row comes from the configuration,
    // because some carriers like Logwin have a different layout)
    const startIndex = headerRowIndex + matchingCarrier.headerRowOffset;
    const retrievedTrackingData = [];

    for (let i = startIndex; i < rows.length; i++) {
      const rowItem = rows[i];
      if (!rowItem) continue;

      // map each column of the row to the carrier's matching field
      const mappedRow = {};
      matchingCarrier.fields.forEach((field, index) => {
        const value = Object.values(rowItem)[index];
        mappedRow[field] = convertValue(value, matchingCarrier);
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

    // now translate each row into the unified database format (mapping rules from config)
    const trackingData = retrievedTrackingData.map((row) =>
      mapToUnified(row, matchingCarrier)
    );

    // return the finished data and the name of the detected carrier
    return { trackingData, carrier: matchingCarrier.name };
  }

  // if no sheet had a recognized carrier
  return { trackingData: [], carrier: "Unknown" };
};
