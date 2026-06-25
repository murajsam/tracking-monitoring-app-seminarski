import { Router } from "express";
import {
  getTrackings,
  getTrackingById,
} from "../controllers/tracking.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// obe rute traze da korisnik bude prijavljen (requireAuth)
// route for getting all tracking data from database (get method)
router.get("/all", requireAuth, getTrackings);
// route for getting specific tracking data by id from database (get method)
router.get("/:id", requireAuth, getTrackingById);

export default router;
