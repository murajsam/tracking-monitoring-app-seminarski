import { Router } from "express";
import {
  getTrackings,
  getTrackingById,
} from "../controllers/tracking.controller.js";

const router = Router();

// route for getting all tracking data from database (get method)
router.get("/all", getTrackings);
// route for getting specific tracking data by id from database (get method)
router.get("/:id", getTrackingById);

export default router;
