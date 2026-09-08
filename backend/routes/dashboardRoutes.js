import express from "express";
import { getDashboardSummary, getMapData } from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/summary", getDashboardSummary);
router.get("/map", getMapData);

export default router;
