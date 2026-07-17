import { carrierNames } from "../utils/carrierConfig.js";

// returns the list of supported carrier names (from the configuration)
// used by the frontend so carrier lists don't have to be hardcoded there
export const getCarriers = (req, res) => {
  return res.status(200).json({ carriers: carrierNames });
};
