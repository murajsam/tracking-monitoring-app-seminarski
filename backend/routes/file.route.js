import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/file.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// upload sme samo prijavljen korisnik sa rolom "user" (carrier ne sme da uploaduje)
// route for uploading file and importing it's tracking data into database (post method)
router.post(
  "/upload",
  requireAuth,
  requireRole("user"),
  upload.single("file"),
  uploadFile
);

export default router;
