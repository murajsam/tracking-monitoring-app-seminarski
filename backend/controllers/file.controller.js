import fs from "fs";
import path from "path";
import File from "../models/file.model.js";
import Tracking from "../models/tracking.model.js";
import { processExcelFile } from "../utils/excelParser.js";

// upload file and import its tracking data into database
export const uploadFile = async (req, res) => {
  try {
    const { file } = req;
    if (!file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const filePath = path.resolve(file.path);
    const buffer = fs.readFileSync(filePath);
    // get final mapped tracking data and matching carrier name from Excel file (predefined fields rules mapping from .csv file)
    const { trackingData, carrier } = processExcelFile(buffer);

    // create file object to store in database
    const fileRecord = new File({
      fileName: file.originalname,
      carrier: carrier || "Unknown",
      totalRows: trackingData.length,
      status: "N/A",
    });

    // check if carrier is recognized or is missing
    // if it's not recognized, save file object to database with failure reason and skip importing tracking data
    if (!fileRecord.carrier || fileRecord.carrier === "Unknown") {
      fileRecord.status = "Failed";
      fileRecord.failureReason = "Carrier is not recognized or is missing.";
      await fileRecord.save();

      fs.unlinkSync(filePath); // delete uploaded file after importing tracking data

      return res.status(200).json({
        message: "File upload completed with failures.",
        file: fileRecord,
      });
    }

    let importedRows = 0;
    let duplicatedRows = 0;

    // fields to check for duplicates
    const fieldsToCheck = [
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

    // import tracking data from file
    // if tracking data is duplicated, skip it (duplicated rows will be counted in duplicatedRows variable)
    // if tracking data is not duplicated, save it to database (importedRows variable will be counted)
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

    // update file object with imported rows and duplicated rows and calculate success rate
    fileRecord.importedRows = importedRows;
    fileRecord.duplicatedRows = duplicatedRows;
    fileRecord.calculateSuccessRate();
    fileRecord.status = importedRows > 0 ? "Validated" : "Failed";

    if (importedRows === 0) {
      fileRecord.failureReason =
        duplicatedRows > 0
          ? "All rows are duplicates."
          : "Unknown error prevented importing any rows.";
    }

    // save file object to database
    await fileRecord.save();

    // delete uploaded file
    fs.unlinkSync(filePath);

    const responseMessage =
      importedRows > 0
        ? "File uploaded and processed successfully."
        : `File processing completed with failures. ${fileRecord.failureReason}`;

    return res.status(200).json({
      message: responseMessage,
      file: fileRecord,
    });
  } catch (error) {
    console.error("Error processing file:", error.message);
    return res.status(500).json({
      message: "An error occurred while processing the file.",
      error: error.message,
    });
  }
};
