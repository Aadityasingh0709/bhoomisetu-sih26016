import express from "express";
import { getAlerts, resolveAlert } from "../controllers/alertController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.get("/", getAlerts);
router.patch("/:id/resolve", restrictTo("Administrator", "SeniorOfficer", "ProjectManager"), resolveAlert);

export default router;
