import express from "express";
import {
  getResolutions,
  getResolutionById,
  createResolution,
  deleteResolution,
} from "../controllers/resolutionController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getResolutions);
router.get("/:id", getResolutionById);
router.post(
  "/",
  restrictTo("DepartmentOfficer", "Administrator", "SeniorOfficer", "ProjectManager"),
  createResolution
);
router.delete(
  "/:id",
  restrictTo("Administrator", "ProjectManager"),
  deleteResolution
);

export default router;
