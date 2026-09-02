import express from "express";
import { login, getMe, register } from "../controllers/authController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/register", protect, restrictTo("Administrator"), register);

export default router;
