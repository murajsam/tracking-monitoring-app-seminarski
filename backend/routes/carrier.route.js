import express from "express";
import { getCarriers } from "../controllers/carrier.controller.js";

const router = express.Router();

// GET /api/carriers - list of supported carriers (public, needed on the register page)
router.get("/", getCarriers);

export default router;
