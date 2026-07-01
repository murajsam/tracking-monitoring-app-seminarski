import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";

const router = Router();

// route to register a new user (post method)
router.post("/register", register);
// route to log in a user (post method)
router.post("/login", login);

export default router;
