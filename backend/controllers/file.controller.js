import fs from "fs";
import path from "path";
import File from "../models/file.model.js";
import { processExcelFile } from "../utils/excelParser.js";
import { importTrackingData } from "../utils/importTracking.js";

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
    // get final mapped tracking data and matching carrier name from Excel file
    // (carrier definitions and mapping rules come from config/carriers.json)
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

    // import tracking data from file with duplicate detection
    // (the shared import logic lives in utils/importTracking.js)
    const { importedRows, duplicatedRows } = await importTrackingData(
      trackingData,
      fileRecord
    );

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
