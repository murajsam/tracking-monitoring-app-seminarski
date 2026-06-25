import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";

const router = Router();

// ruta za registraciju novog korisnika (post metoda)
router.post("/register", register);
// ruta za prijavu (login) korisnika (post metoda)
router.post("/login", login);

export default router;
