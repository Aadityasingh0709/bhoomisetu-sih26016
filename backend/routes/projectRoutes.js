import express from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateDepartmentProgress,
  addProjectResolution,
  deleteProjectResolution,
  deleteProject,
  dispatchOfficerCredentials,
  updateDepartmentOfficer,
} from "../controllers/projectController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", restrictTo("Administrator", "ProjectManager"), createProject);
router.patch(
  "/:id/departments/:deptId",
  restrictTo("DepartmentOfficer", "Administrator", "ProjectManager"),
  updateDepartmentProgress
 );
router.patch(
  "/:id/departments/:deptId/officer",
  restrictTo("Administrator", "ProjectManager"),
  updateDepartmentOfficer
);
router.post(
  "/:id/resolutions",
  restrictTo("DepartmentOfficer", "Administrator", "SeniorOfficer", "ProjectManager"),
  addProjectResolution
);
router.delete(
  "/:id/resolutions/:resolutionId",
  restrictTo("Administrator", "ProjectManager"),
  deleteProjectResolution
);
router.delete("/:id", restrictTo("Administrator"), deleteProject);
router.post(
  "/:id/dispatch-credentials",
  restrictTo("Administrator", "ProjectManager"),
  dispatchOfficerCredentials
);

export default router;
