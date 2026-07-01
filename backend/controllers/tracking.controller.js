import Tracking from "../models/tracking.model.js";

// get all tracking data from database
export const getTrackings = async (req, res) => {
  try {
    // build the query filter
    const filter = {};

    // if a "carrier" is logged in, show ONLY its own carrier's shipments
    // ("user" sees everything, so the filter stays empty)
    if (req.user.role === "carrier") {
      filter["data.Carrier"] = req.user.carrier;
    }

    const trackings = await Tracking.find(filter);
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

    if (!tracking) {
      return res.status(404).json({ message: "Shipment not found." });
    }

    // a carrier may see details only of its own shipments
    if (
      req.user.role === "carrier" &&
      tracking.data.Carrier !== req.user.carrier
    ) {
      return res
        .status(403)
        .json({ message: "You don't have access to this shipment." });
    }

    return res.status(200).json(tracking);
  } catch (error) {
    console.error("Error fetching tracking:", error.message);
    return res.status(500).json({
      message: "An error occurred while fetching tracking.",
      error: error.message,
    });
  }
};
