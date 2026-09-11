import express from "express";
import {
  getAlerts,
  createAlert,
  resolveAlert,
  postDecision,
  officerMarkResolved,
} from "../controllers/alertController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// Any authenticated user can view alerts
router.get("/", getAlerts);

// Any authenticated officer or authority can report a bottleneck/issue
router.post("/", createAlert);

// Higher authority posts a corrective-action decision
router.patch(
  "/:id/decision",
  restrictTo("Administrator", "SeniorOfficer", "ProjectManager"),
  postDecision
);

// Department officer marks the problem as fixed after acting on decision
router.patch(
  "/:id/officer-resolved",
  restrictTo("DepartmentOfficer", "Administrator", "SeniorOfficer", "ProjectManager"),
  officerMarkResolved
);

// Higher authority fully closes the alert
router.patch(
  "/:id/resolve",
  restrictTo("Administrator", "SeniorOfficer", "ProjectManager"),
  resolveAlert
);

export default router;
