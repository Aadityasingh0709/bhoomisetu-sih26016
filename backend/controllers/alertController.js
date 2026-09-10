import asyncHandler from "express-async-handler";
import Alert from "../models/Alert.js";
import Project from "../models/Project.js";
import Resolution from "../models/Resolution.js";

// GET /api/alerts
export const getAlerts = asyncHandler(async (req, res) => {
  const { resolved } = req.query;
  const filter = {};
  if (resolved !== undefined) filter.isResolved = resolved === "true";

  const alerts = await Alert.find(filter)
    .populate("project", "name state district")
    .populate("department", "displayName")
    .populate("resolvedBy", "name email role")
    .sort({ createdAt: -1 });
  res.json(alerts);
});

// PATCH /api/alerts/:id/resolve
export const resolveAlert = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const alert = await Alert.findById(req.params.id)
    .populate("department", "displayName");

  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }

  alert.isResolved = true;
  alert.resolvedAt = new Date();
  alert.resolvedBy = req.user?._id || req.user?.id;
  if (resolutionNotes) {
    alert.resolutionNotes = resolutionNotes.trim();
  }

  await alert.save();
  await alert.populate([
    { path: "project", select: "name state district" },
    { path: "resolvedBy", select: "name email role" },
  ]);

  // If resolution notes were provided, record an entry in the dedicated Resolution collection & linked project
  if (alert.project && alert.resolutionNotes) {
    const projectId = alert.project._id || alert.project;
    const resDoc = await Resolution.create({
      project: projectId,
      department: alert.department?._id || alert.department,
      alert: alert._id,
      title: `${alert.type} Resolved — ${alert.department?.displayName || "Lifecycle Stage"}`,
      category: alert.type === "Bottleneck" ? "Bottleneck" : "Other",
      issueDescription: alert.message,
      resolutionDetails: alert.resolutionNotes,
      actionTakenBy: req.user?.name || "Officer",
      status: "Resolved",
      resolvedBy: req.user?._id || req.user?.id,
      resolvedAt: new Date(),
    });

    const project = await Project.findById(projectId);
    if (project) {
      if (!project.resolutions) project.resolutions = [];
      project.resolutions.unshift({
        _id: resDoc._id,
        title: resDoc.title,
        category: resDoc.category,
        department: resDoc.department,
        issueDescription: resDoc.issueDescription,
        resolutionDetails: resDoc.resolutionDetails,
        actionTakenBy: resDoc.actionTakenBy,
        status: resDoc.status,
        resolvedBy: resDoc.resolvedBy,
        resolvedAt: resDoc.resolvedAt,
      });
      await project.save();
    }
  }

  res.json(alert);
});
