import asyncHandler from "express-async-handler";
import Project from "../models/Project.js";
import Department from "../models/Department.js";
import Alert from "../models/Alert.js";

// Recalculates a project's weighted overall progress + status, and raises
// bottleneck/dependency alerts. This is the core "system converts updates
// into a clear picture" logic described in the problem statement.
export const recalculateProject = async (project) => {
  const departments = await Department.find();
  const deptMap = Object.fromEntries(departments.map((d) => [String(d._id), d]));

  let weightedProgress = 0;
  let plannedWeightedProgress = 0;
  let hasDelayed = false;
  let hasAtRisk = false;

  for (const dp of project.departments) {
    const dept = deptMap[String(dp.department)];
    if (!dept) continue;
    weightedProgress += (dp.actualProgress * dept.weight) / 100;
    plannedWeightedProgress += (dp.plannedProgress * dept.weight) / 100;

    // Rule: 10%+ behind planned progress => At Risk
    if (dp.plannedProgress - dp.actualProgress >= 10 && dp.status !== "Completed") {
      dp.status = "AtRisk";
      hasAtRisk = true;
    } else if (dp.status === "AtRisk") {
      // An automatically assigned risk state must clear once the department recovers.
      dp.status = "OnTrack";
    }
    // Rule: many pending cases + low progress => Bottleneck alert
    if (dp.pendingCases > 20 && dp.actualProgress < 60) {
      await Alert.findOneAndUpdate(
        { project: project._id, department: dp.department, type: "Bottleneck", isResolved: false },
        {
          project: project._id,
          department: dp.department,
          type: "Bottleneck",
          severity: "High",
          message: `${dept.displayName} is a bottleneck: ${dp.pendingCases} pending cases at ${dp.actualProgress}% progress.`,
        },
        { upsert: true, new: true }
      );
    } else {
      await Alert.findOneAndUpdate(
        { project: project._id, department: dp.department, type: "Bottleneck", isResolved: false },
        { isResolved: true, resolvedAt: new Date() }
      );
    }
    if (dp.status === "Delayed") hasDelayed = true;
  }

  project.overallProgress = Math.round(weightedProgress);
  if (project.actualCompletionDate) {
    project.overallStatus = "Completed";
  } else if (hasDelayed || new Date() > project.plannedCompletionDate) {
    project.overallStatus = "Delayed";
  } else if (hasAtRisk || weightedProgress < plannedWeightedProgress - 10) {
    project.overallStatus = "AtRisk";
  } else {
    project.overallStatus = "OnTrack";
  }

  // Dependency rule: if an earlier stage in the chain is delayed/at-risk,
  // flag downstream dependency alerts (Survey -> Legal -> Compensation ->
  // Rehabilitation -> Approvals -> Possession)
  const sorted = [...project.departments].sort((a, b) => {
    const da = deptMap[String(a.department)]?.order ?? 0;
    const db = deptMap[String(b.department)]?.order ?? 0;
    return da - db;
  });
  for (let i = 0; i < sorted.length - 1; i++) {
    const upstream = sorted[i];
    const downstream = sorted[i + 1];
    if (["Delayed", "AtRisk"].includes(upstream.status) && downstream.status !== "Completed") {
      const upDept = deptMap[String(upstream.department)];
      const downDept = deptMap[String(downstream.department)];
      await Alert.findOneAndUpdate(
        { project: project._id, department: downstream.department, type: "Dependency", isResolved: false },
        {
          project: project._id,
          department: downstream.department,
          type: "Dependency",
          severity: "Medium",
          message: `${downDept?.displayName} may be affected because ${upDept?.displayName} is behind schedule.`,
        },
        { upsert: true, new: true }
      );
    } else {
      await Alert.findOneAndUpdate(
        { project: project._id, department: downstream.department, type: "Dependency", isResolved: false },
        { isResolved: true, resolvedAt: new Date() }
      );
    }
  }

  await project.save();
  return project;
};

// GET /api/projects
export const getProjects = asyncHandler(async (req, res) => {
  const { state, department, status, search } = req.query;
  const filter = {};
  if (state) filter.state = state;
  if (status) filter.overallStatus = status;
  if (search) filter.name = { $regex: search, $options: "i" };
  if (department) filter["departments.department"] = department;

  const projects = await Project.find(filter)
    .populate("departments.department")
    .sort({ createdAt: -1 });
  res.json(projects);
});

// GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate("departments.department");
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  res.json(project);
});

// POST /api/projects  (Administrator / ProjectManager)
export const createProject = asyncHandler(async (req, res) => {
  const departments = await Department.find();
  const project = await Project.create({
    ...req.body,
    departments: departments.map((d) => ({ department: d._id })),
  });
  // Apply the same progress, risk, and alert rules at creation time as on a
  // department update, so a newly created project is never left inconsistent.
  const updated = await recalculateProject(project);
  await updated.populate("departments.department");
  res.status(201).json(updated);
});

// PATCH /api/projects/:id/departments/:deptId
// Core endpoint used by the Department Update form
export const updateDepartmentProgress = asyncHandler(async (req, res) => {
  const { id, deptId } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const entry = project.departments.find((d) => String(d.department) === deptId);
  if (!entry) {
    res.status(404);
    throw new Error("Department is not assigned to this project");
  }

  // Department officers may update only their own department. Administrators
  // retain cross-department access for operational corrections.
  if (req.user.role === "DepartmentOfficer" && String(req.user.department?._id) !== deptId) {
    res.status(403);
    throw new Error("You can update only your assigned department");
  }

  const { actualProgress, plannedProgress, pendingCases, completedCases, delayReason, expectedCompletionDate, status } =
    req.body;

  if (actualProgress !== undefined) entry.actualProgress = actualProgress;
  if (plannedProgress !== undefined) entry.plannedProgress = plannedProgress;
  if (pendingCases !== undefined) entry.pendingCases = pendingCases;
  if (completedCases !== undefined) entry.completedCases = completedCases;
  if (delayReason !== undefined) entry.delayReason = delayReason;
  if (expectedCompletionDate !== undefined) entry.expectedCompletionDate = expectedCompletionDate;
  if (status !== undefined) entry.status = status;
  entry.lastUpdatedBy = req.user._id;
  entry.lastUpdatedAt = new Date();

  const updated = await recalculateProject(project);
  res.json(updated);
});

// DELETE /api/projects/:id (Administrator only)
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  res.json({ message: "Project deleted" });
});
