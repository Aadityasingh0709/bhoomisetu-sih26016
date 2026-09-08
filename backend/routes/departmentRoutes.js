import express from "express";
import { getDepartments, createDepartment } from "../controllers/departmentController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getDepartments);
router.post("/", restrictTo("Administrator"), createDepartment);

export default router;
