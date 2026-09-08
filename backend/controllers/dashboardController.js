import asyncHandler from "express-async-handler";
import Project from "../models/Project.js";
import Department from "../models/Department.js";
import Alert from "../models/Alert.js";

// GET /api/dashboard/summary
// Powers the national/management dashboard: totals, status counts,
// department-wise bottleneck ranking, and delayed project list.
export const getDashboardSummary = asyncHandler(async (req, res) => {
  const projects = await Project.find().populate("departments.department");
  const departments = await Department.find();

  const total = projects.length;
  const onTrack = projects.filter((p) => p.overallStatus === "OnTrack").length;
  const atRisk = projects.filter((p) => p.overallStatus === "AtRisk").length;
  const delayed = projects.filter((p) => p.overallStatus === "Delayed").length;
  const completed = projects.filter((p) => p.overallStatus === "Completed").length;

  const avgProgress = total
    ? Math.round(projects.reduce((sum, p) => sum + p.overallProgress, 0) / total)
    : 0;

  // Bottleneck ranking: count how many projects are stuck (AtRisk/Delayed) per department
  const bottlenecks = departments.map((dept) => {
    const count = projects.filter((p) =>
      p.departments.some(
        (dp) =>
          String(dp.department?._id || dp.department) === String(dept._id) &&
          ["AtRisk", "Delayed"].includes(dp.status)
      )
    ).length;
    return { department: dept.displayName, count };
  }).sort((a, b) => b.count - a.count);

  const delayedProjects = projects
    .filter((p) => p.overallStatus === "Delayed" || p.overallStatus === "AtRisk")
    .map((p) => ({
      id: p._id,
      name: p.name,
      state: p.state,
      district: p.district,
      overallProgress: p.overallProgress,
      overallStatus: p.overallStatus,
      plannedCompletionDate: p.plannedCompletionDate,
    }));

  const activeAlerts = await Alert.find({ isResolved: false })
    .populate("project", "name state district")
    .populate("department", "displayName")
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    totals: { total, onTrack, atRisk, delayed, completed, avgProgress },
    bottlenecks,
    delayedProjects,
    activeAlerts,
  });
});

// GET /api/dashboard/map
// Lightweight payload for plotting all projects as pins on the GIS map
export const getMapData = asyncHandler(async (req, res) => {
  const projects = await Project.find().select(
    "name state district location overallStatus overallProgress"
  );
  res.json(
    projects.map((p) => ({
      id: p._id,
      name: p.name,
      state: p.state,
      district: p.district,
      status: p.overallStatus,
      progress: p.overallProgress,
      lat: p.location?.coordinates?.[1] ?? null,
      lng: p.location?.coordinates?.[0] ?? null,
    }))
  );
});
