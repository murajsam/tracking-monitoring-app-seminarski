import Tracking from "../models/tracking.model.js";

// fields to check for duplicates
export const fieldsToCheck = [
  "Status",
  "PO Number",
  "ETD",
  "ETA",
  "ATD",
  "ATA",
  "Packages",
  "Weight",
  "Volume",
  "Shipper",
  "Shipper Country",
  "Receiver",
  "Receiver Country",
  "House AWB",
  "Shipper Ref. No",
  "Carrier",
  "Inco Term",
  "Flight No",
  "Pick-up Date",
  "Latest Checkpoint",
];

// import mapped tracking rows into the database
// if tracking data is duplicated, skip it (duplicated rows will be counted in duplicatedRows)
// if tracking data is not duplicated, save it to database (importedRows will be counted)
// (shared between the upload controller and the benchmark scripts,
// so measurements are done on the exact same production code)
export const importTrackingData = async (trackingData, fileRecord) => {
  let importedRows = 0;
  let duplicatedRows = 0;

  for (const row of trackingData) {
    try {
      const query = {};
      fieldsToCheck.forEach((field) => {
        // only check fields for duplicates which are not empty, not null, not undefined and not 0
        if (
          row[field] !== undefined &&
          row[field] !== 0 &&
          row[field] !== null &&
          row[field] !== "" &&
          (typeof row[field] !== "string" || row[field].trim() !== "")
        ) {
          query[`data.${field}`] = row[field];
        }
      });

      // check if tracking data is already imported
      const existingData = await Tracking.findOne(query);

      // if tracking data is not imported, save it to database
      if (!existingData) {
        const trackingRecord = new Tracking({
          data: row,
          fileId: fileRecord._id,
          fileName: fileRecord.fileName,
        });
        await trackingRecord.save();
        importedRows++;
      } else {
        duplicatedRows++;
      }
    } catch (error) {
      console.error(`Failed to process row: ${row}`, error.message);
    }
  }

  return { importedRows, duplicatedRows };
};
