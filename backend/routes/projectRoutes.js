import express from "express";
import {
  getProjects,
  getProject,
  createProject,
  updateDepartmentProgress,
  deleteProject,
} from "../controllers/projectController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", restrictTo("Administrator", "ProjectManager"), createProject);
router.patch(
  "/:id/departments/:deptId",
  restrictTo("DepartmentOfficer", "Administrator"),
  updateDepartmentProgress
);
router.delete("/:id", restrictTo("Administrator"), deleteProject);

export default router;
