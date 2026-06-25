import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/file.controller.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// route for uploading file and importing it's tracking data into database (post method)
router.post("/upload", upload.single("file"), uploadFile);

export default router;
