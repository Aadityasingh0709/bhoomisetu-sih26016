import asyncHandler from "express-async-handler";
import Alert from "../models/Alert.js";

// GET /api/alerts
export const getAlerts = asyncHandler(async (req, res) => {
  const { resolved } = req.query;
  const filter = {};
  if (resolved !== undefined) filter.isResolved = resolved === "true";

  const alerts = await Alert.find(filter)
    .populate("project", "name state district")
    .populate("department", "displayName")
    .sort({ createdAt: -1 });
  res.json(alerts);
});

// PATCH /api/alerts/:id/resolve
export const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { isResolved: true, resolvedAt: new Date() },
    { new: true }
  );
  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  res.json(alert);
});
