import Tracking from "../models/tracking.model.js";

// get all tracking data from database
export const getTrackings = async (req, res) => {
  try {
    const trackings = await Tracking.find({});
    return res.status(200).json(trackings);
  } catch (error) {
    console.error("Error fetching trackings:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching trackings.",
      error: error.message,
    });
  }
};

// get specific tracking data by id from database
export const getTrackingById = async (req, res) => {
  try {
    const { id } = req.params;
    const tracking = await Tracking.findById(id);
    return res.status(200).json(tracking);
  } catch (error) {
    console.error("Error fetching tracking:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching tracking.",
      error: error.message,
    });
  }
};
