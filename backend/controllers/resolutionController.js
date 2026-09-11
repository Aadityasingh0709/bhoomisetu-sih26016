import asyncHandler from "express-async-handler";
import Resolution from "../models/Resolution.js";
import Project from "../models/Project.js";
import Alert from "../models/Alert.js";

// GET /api/resolutions
export const getResolutions = asyncHandler(async (req, res) => {
  const { projectId, departmentId, category, status } = req.query;
  const filter = {};

  if (projectId) filter.project = projectId;
  if (departmentId) filter.department = departmentId;
  if (category && category !== "All") filter.category = category;
  if (status && status !== "All") filter.status = status;

  const resolutions = await Resolution.find(filter)
    .populate("project", "name code state district")
    .populate("department", "displayName name")
    .populate("resolvedBy", "name email role")
    .sort({ resolvedAt: -1, createdAt: -1 });

  res.json(resolutions);
});

// GET /api/resolutions/:id
export const getResolutionById = asyncHandler(async (req, res) => {
  const resolution = await Resolution.findById(req.params.id)
    .populate("project", "name code state district")
    .populate("department", "displayName name")
    .populate("resolvedBy", "name email role");

  if (!resolution) {
    res.status(404);
    throw new Error("Resolution not found");
  }

  res.json(resolution);
});

// POST /api/resolutions
export const createResolution = asyncHandler(async (req, res) => {
  const {
    projectId,
    departmentId,
    alertId,
    title,
    category,
    issueDescription,
    resolutionDetails,
    actionTakenBy,
    caseOrderReference,
    status,
  } = req.body;

  if (!projectId || !title || !resolutionDetails || !issueDescription) {
    res.status(400);
    throw new Error("Project ID, title, issue description, and resolution details are required");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const resolution = await Resolution.create({
    project: projectId,
    projectName: project.name,
    department: departmentId || req.user.department?._id || null,
    alert: alertId || null,
    title: title.trim(),
    category: category || "Bottleneck",
    issueDescription: issueDescription.trim(),
    resolutionDetails: resolutionDetails.trim(),
    actionTakenBy: actionTakenBy || req.user.name,
    caseOrderReference: (caseOrderReference || "").trim(),
    status: status || "Resolved",
    resolvedBy: req.user._id,
    resolvedAt: new Date(),
  });

  // Keep embedded sub-document array on Project synchronized as well
  if (!project.resolutions) {
    project.resolutions = [];
  }
  project.resolutions.unshift({
    _id: resolution._id,
    projectName: project.name,
    title: resolution.title,
    category: resolution.category,
    department: resolution.department,
    issueDescription: resolution.issueDescription,
    resolutionDetails: resolution.resolutionDetails,
    actionTakenBy: resolution.actionTakenBy,
    caseOrderReference: resolution.caseOrderReference,
    status: resolution.status,
    resolvedBy: resolution.resolvedBy,
    resolvedAt: resolution.resolvedAt,
  });
  await project.save();

  // If resolving an active alert, mark the alert as resolved in MongoDB
  if (alertId) {
    await Alert.findByIdAndUpdate(alertId, {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy: req.user._id,
      resolutionNotes: resolution.resolutionDetails,
    });
  } else if (resolution.status === "Resolved" && resolution.department) {
    await Alert.updateMany(
      {
        project: project._id,
        department: resolution.department,
        isResolved: false,
      },
      {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
        resolutionNotes: resolution.resolutionDetails,
      }
    );
  }

  await resolution.populate([
    { path: "project", select: "name code state district" },
    { path: "department", select: "displayName name" },
    { path: "resolvedBy", select: "name email role" },
  ]);

  res.status(201).json(resolution);
});

// DELETE /api/resolutions/:id
export const deleteResolution = asyncHandler(async (req, res) => {
  const resolution = await Resolution.findById(req.params.id);
  if (!resolution) {
    res.status(404);
    throw new Error("Resolution not found");
  }

  await Resolution.findByIdAndDelete(req.params.id);

  // Remove from embedded array on project if present
  if (resolution.project) {
    await Project.findByIdAndUpdate(resolution.project, {
      $pull: { resolutions: { _id: resolution._id } },
    });
  }

  res.json({ message: "Resolution removed from database" });
});
