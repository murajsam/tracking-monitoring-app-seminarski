import XLSX from "xlsx";
import { convertWeight, isPotentialDate } from "./dataConverters.js";

// carrier tracking data for DHL, Hellman & Logwin (name and fields with all names)
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

// tracking data field mapping for uploaded Excel file.
// reuturns array of mapped data and matching carrier name
// if no matching carrier is found, returns empty array and "Unknown"
export const processExcelFile = (buffer) => {
  // load the Excel workbook from the provided buffer
  const workbook = XLSX.read(buffer, {
    type: "buffer", // load the workbook from a buffer
    cellDates: true, // parse dates in fileds (field will be converted to Date object if possible)
    sheetStubs: true, // create sheet stubs (empty rows and columns)
  });

  // process each sheet and return the first matching carrier's tracking data
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const trackingData = XLSX.utils.sheet_to_json(sheet, {
      defval: null, // default value for empty fields
    });

    let matchingCarrierRow = -1; // index of the row with matching carrier
    let matchingCarrier = { name: "Unknown", fields: [] }; // matching carrier name (DHL, Hellman, Logwin)
    let mappedTrackingData = []; // array of final mapped tracking data to store in database

    // identify the matching carrier by comparing each row field's tracking data from excel file with carrier fields from mapping array (DHL, Hellman, Logwin)
    for (const trackingDataItem of trackingData) {
      matchingCarrierRow++;

      // filter null and undefined values from keys and values
      const trackingDataKeys = Object.keys(trackingDataItem).filter(
        (key) =>
          trackingDataItem[key] !== null && trackingDataItem[key] !== undefined
      );
      const trackingDataValues = Object.values(trackingDataItem).filter(
        (value) => value !== null && value !== undefined
      );

      // find a carrier whose all fields match either keys or values in the excel file tracking data
      matchingCarrier = carriers.find(
        (carrier) =>
          trackingDataValues.every((value) =>
            carrier.fields.includes(
              (value === null || value === undefined ? "" : String(value))
                .replaceAll(/\r|\n/g, " ") // replace line breaks with spaces
                .replaceAll("  ", " ") // replace double spaces with single space
            )
          ) ||
          trackingDataKeys.every((key) =>
            carrier.fields.includes(
              (key === null || key === undefined ? "" : String(key))
                .replaceAll(/\r|\n/g, " ")
                .replaceAll("  ", " ")
            )
          )
      );

      // if a matching carrier is found, break the loop
      if (matchingCarrier) {
        break;
      }
    }

    // If a matching carrier is found, process its tracking data
    if (matchingCarrier) {
      // tracking data array from excel file which will then be mapped in predefined fileds and stored in database
      const retrievedTrackingData = [];

      // extract tracking data starting from the row after the carrier is identified
      for (
        let i =
          matchingCarrierRow + (matchingCarrier.name === "Logwin" ? 0 : 1); // logwin specific offset becuase of different header row within the excel file
        i < trackingData.length;
        i++
      ) {
        const trackingDataItem = trackingData[i];
        if (!trackingDataItem) continue;

        // retrieve tracking data object with mapped fields from excel file
        const retrievedTrackingDataObject = {};

        // map each field from matching carrier fields array to tracking data object in format of { field: value }
        // if value is a potential date, convert it to Date object with correct timezone for each carrier
        // if value is not a potential date, pass type as is
        // if value is empty (""), convert it to null
        // if value is undefined, convert it to null
        matchingCarrier.fields.forEach((field, index) => {
          const value = Object.values(trackingDataItem)[index];

          retrievedTrackingDataObject[field] = isPotentialDate(value)
            ? (() => {
                switch (matchingCarrier.name) {
                  case "Logwin": {
                    const date = new Date(value);
                    const offset = +120; // GMT+0200 (Central European Summer Time)
                    const adjustedDate = new Date(
                      date.getTime() + offset * 60 * 1000
                    );
                    return isNaN(adjustedDate.getTime()) ? null : adjustedDate; // if date is invalid, return null
                  }
                  case "DHL": {
                    const date = new Date(value);
                    const offset = +60; // GMT+0100 (Central European Standard Time)
                    const adjustedDate = new Date(
                      date.getTime() + offset * 60 * 1000
                    );
                    return isNaN(adjustedDate.getTime()) ? null : adjustedDate;
                  }
                  case "Hellman": {
                    const date = new Date(value);
                    const offset = +120; // GMT+0200 (Central European Standard Time)
                    const adjustedDate = new Date(
                      date.getTime() + offset * 60 * 1000
                    );
                    return isNaN(adjustedDate.getTime()) ? null : adjustedDate;
                  }
                  default:
                    return null;
                }
              })()
            : value === ""
            ? null
            : value;
        });

        // add the mapped object to the tracking data array
        if (
          Object.values(retrievedTrackingDataObject).some(
            (value) =>
              value !== null &&
              value !== "" &&
              (typeof value !== "string" || value.trim() !== "")
          )
        ) {
          retrievedTrackingData.push(retrievedTrackingDataObject);
        }
      }

      // form array of final mapped tracking data (predefined fields rules mapping from .csv file) to store in database
      switch (matchingCarrier.name) {
        case "DHL":
          mappedTrackingData = retrievedTrackingData.map(
            ({
              "Waybill Number": house,
              "Shipper Reference Number": shipperRef,
              Receiver: receiver,
              Pieces: packages,
              "Manifested Weight": weight,
              "Estimated Delivery Date": eta,
              ...rest
            }) => ({
              Status: null,
              "House AWB": house,
              Shipper: null,
              Receiver: null,
              "PO Number": null,
              "Shipper Ref. No": shipperRef,
              ETD: null,
              ETA: eta,
              ATD: null,
              ATA: null,
              Carrier: null,
              Packages: packages,
              Weight: convertWeight(weight) <= 0 ? null : convertWeight(weight), // convert other weight types to kg (ex. lbs to kg, pounds to kg)
              Volume: null,
              "Shipper Country": null,
              Receiver: receiver,
              "Receiver Country": null,
              Carrier: matchingCarrier.name,
              "Inco Term": null,
              "Flight No": null,
              "Pick-up Date": null,
              "Latest Checkpoint": null,
              "Additional Info": rest,
            })
          );
          break;
        case "Hellman":
          mappedTrackingData = retrievedTrackingData.map(
            ({
              Status: status,
              "House AWB": house,
              "Shipper Name": shipper,
              "Shipper Country": shipperCountry,
              "Consignee Name": consignee,
              "Consignee Country": consigneeCountry,
              "Flight ETD": etd,
              "Flight ETA": eta,
              "Flight ATD": atd,
              "Flight ATA": ata,
              "No of Packages": packages,
              "Gross Weight (Kg)": weight,
              ...rest
            }) => ({
              Status: status,
              "House AWB": house,
              Shipper: shipper,
              Receiver: consignee,
              "PO Number": null,
              "Shipper Ref. No": null,
              ETD: etd,
              ETA: eta,
              ATD: atd,
              ATA: ata,
              Carrier: matchingCarrier.name,
              Packages: packages,
              Weight: convertWeight(weight) <= 0 ? null : convertWeight(weight),
              Volume: null,
              "Shipper Country": shipperCountry,
              "Receiver Country": consigneeCountry,
              Carrier: matchingCarrier.name,
              "Inco Term": null,
              "Flight No": null,
              "Pick-up Date": null,
              "Latest Checkpoint": null,
              "Additional Info": rest,
            })
          );
          break;
        case "Logwin":
          mappedTrackingData = retrievedTrackingData.map(
            ({
              Status: status,
              House: house,
              Shipper: shipper,
              Consignee: consignee,
              "PO Number": poNumber,
              "Shipper Ref.": shipperRef,
              ETD: etd,
              ETA: eta,
              ATD: atd,
              ATA: ata,
              Carrier: carrier,
              Packages: packages,
              Weight: weight,
              Volume: volume,
              ...rest
            }) => ({
              Status: status,
              "House AWB": house,
              Shipper: shipper,
              Receiver: consignee,
              "PO Number": poNumber,
              "Shipper Ref. No": shipperRef,
              ETD: etd,
              ETA: eta,
              ATD: atd,
              ATA: ata,
              Carrier: carrier,
              Packages: packages,
              Weight: convertWeight(weight) <= 0 ? null : convertWeight(weight),
              Volume: volume,
              "Shipper Country": null,
              Receiver: null,
              "Receiver Country": null,
              Carrier: matchingCarrier.name,
              "Inco Term": null,
              "Flight No": null,
              "Pick-up Date": null,
              "Latest Checkpoint": null,
              "Additional Info": rest,
            })
          );
          break;
      }

      // return final tracking data and matching carrier name
      return {
        trackingData: mappedTrackingData,
        carrier: matchingCarrier.name,
      };
    }
  }

  // if no matching carrier is found, return empty array and "Unknown" carrier
  return { trackingData: [], carrier: "Unknown" };
};
