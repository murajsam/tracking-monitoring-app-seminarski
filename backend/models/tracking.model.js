import mongoose from "mongoose";

// get/set date handler for ETD/ETA/ATD/ATA fields to handle invalid dates
const dateHandler = {
  get: (value) => value,
  set: (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  },
};

// model for tracking data from uploaded files (each data has get/set methods to handle invalid data)
const trackingSchema = new mongoose.Schema(
  {
    data: {
      type: {
        Status: { type: String },
        "PO Number": { type: String },
        ETD: { type: Date, set: dateHandler.set },
        ETA: { type: Date, set: dateHandler.set },
        ATD: { type: Date, set: dateHandler.set },
        ATA: { type: Date, set: dateHandler.set },
        Packages: {
          type: Number,
          set: (v) => (isNaN(Number(v)) || v <= 0 ? null : Number(v)),
        },
        Weight: {
          type: Number,
          set: (v) => (isNaN(Number(v)) || v <= 0 ? null : Number(v)),
        },
        Volume: {
          type: Number,
          set: (v) => (isNaN(Number(v)) || v <= 0 ? null : Number(v)),
        },
        Shipper: { type: String },
        "Shipper Country": { type: String },
        Receiver: { type: String },
        "Receiver Country": { type: String },
        "House AWB": { type: String },
        "Shipper Ref. No": { type: String },
        Carrier: { type: String },
        "Inco Term": { type: String },
        "Flight No": { type: String },
        "Pick-up Date": { type: Date, set: dateHandler.set },
        "Latest Checkpoint": { type: Date, set: dateHandler.set },
        "Additional Info": { type: mongoose.Schema.Types.Mixed },
      },
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },
    fileName: {
      type: String,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export default mongoose.model("Tracking", trackingSchema);
