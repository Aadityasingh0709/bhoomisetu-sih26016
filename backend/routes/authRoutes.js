import express from "express";
import {
  login,
  getMe,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  validateProjectCode,
} from "../controllers/authController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/validate-project/:code", validateProjectCode);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/register", protect, restrictTo("Administrator"), register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/change-password", protect, changePassword);

export default router;
