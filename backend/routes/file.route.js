import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/file.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// only a logged-in user with role "user" may upload (carrier cannot)
// route for uploading file and importing its tracking data into database (post method)
router.post(
  "/upload",
  requireAuth,
  requireRole("user"),
  upload.single("file"),
  uploadFile
);

export default router;
