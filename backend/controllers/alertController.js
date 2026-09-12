import asyncHandler from "express-async-handler";
import Alert from "../models/Alert.js";
import Project from "../models/Project.js";
import Resolution from "../models/Resolution.js";

// Helper: populate standard alert relations
const populateAlert = (q) =>
  q
    .populate("project", "name state district")
    .populate("department", "displayName")
    .populate("resolvedBy", "name email role")
    .populate("authorityDecidedBy", "name email role")
    .populate("officerResolvedBy", "name email role")
    .populate("raisedBy", "name email role");

// GET /api/alerts
export const getAlerts = asyncHandler(async (req, res) => {
  const { resolved, departmentId, projectId } = req.query;
  const filter = {};
  if (resolved !== undefined) filter.isResolved = resolved === "true";
  if (departmentId) filter.department = departmentId;

  // Project-scoping security:
  // Higher authorities (Admin, Senior Officer, PM, District Officer) can see alerts across all projects.
  // Department Officers can ONLY see alerts for their assigned project(s).
  if (req.user?.role === "DepartmentOfficer") {
    const assignedIds = (req.user.assignedProjects || []).map((p) => String(p._id || p));
    if (projectId) {
      if (!assignedIds.includes(String(projectId))) {
        return res.json([]);
      }
      filter.project = projectId;
    } else {
      filter.project = { $in: assignedIds };
    }
  } else if (projectId) {
    filter.project = projectId;
  }

  const alerts = await populateAlert(Alert.find(filter).sort({ createdAt: -1 }));

  const isHigherAuthority = [
    "Administrator",
    "SeniorOfficer",
    "ProjectManager",
  ].includes(req.user?.role);

  const userDeptId = String(req.user?.department?._id || req.user?.department || "");

  // Higher authorities (Admin, Senior Officer, PM) can see all decisions across all departments
  if (isHigherAuthority) {
    return res.json(alerts);
  }

  // Department Officers can see ALL bottleneck alerts for situational awareness,
  // BUT decisions taken by higher authority for a specific department are ONLY visible
  // to officers belonging to that department. Other departments cannot see the decision taken.
  const sanitized = alerts.map((alert) => {
    const alertDeptId = String(alert.department?._id || alert.department || "");
    const isOwnDept = userDeptId && alertDeptId && userDeptId === alertDeptId;
    const isAuthor = String(alert.raisedBy?._id || alert.raisedBy || "") === String(req.user?._id || "");

    if (isOwnDept) {
      return alert;
    }

    if (isAuthor) {
      return alert;
    }

    // Convert to plain object and redact private department decisions & resolution notes
    const doc = alert.toObject ? alert.toObject() : { ...alert };
    const hadDecision = !!doc.authorityDecision;
    doc.authorityDecision = undefined;
    doc.authorityDecidedBy = undefined;
    doc.authorityDecidedAt = undefined;
    doc.officerResolved = undefined;
    doc.officerResolvedBy = undefined;
    doc.officerResolvedAt = undefined;
    doc.officerResolvedNote = undefined;
    doc.resolutionNotes = undefined;
    doc.isDecisionConfidential = hadDecision;
    return doc;
  });

  res.json(sanitized);
});

// ── POST /api/alerts ──────────────────────────────────────────────────────
// Department officers or administrators can explicitly report a bottleneck issue.
// This alerts the higher authority and broadcasts the bottleneck alert to all departments.
export const createAlert = asyncHandler(async (req, res) => {
  const { projectId, departmentId, type, severity, message } = req.body;

  if (!projectId || !message || !message.trim()) {
    res.status(400);
    throw new Error("Project and message are required");
  }

  const dept = departmentId || req.user.department?._id || req.user.department;

  const project = await Project.findById(projectId).select("name");
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Security check: DepartmentOfficer can only raise alerts for their assigned project
  if (req.user?.role === "DepartmentOfficer") {
    const isAssigned = (req.user.assignedProjects || []).some(
      (p) => String(p._id || p) === String(project._id)
    );
    if (!isAssigned) {
      res.status(403);
      throw new Error("Access denied: You can only report alerts for your assigned project");
    }
  }

  const alert = await Alert.create({
    project: projectId,
    projectName: project.name,
    department: dept || null,
    type: type || "Bottleneck",
    severity: severity || "High",
    message: message.trim(),
    raisedBy: req.user._id,
  });

  const populated = await populateAlert(Alert.findById(alert._id));
  res.status(201).json(populated);
});

// ── NEW: POST /api/alerts/:id/decision ────────────────────────────────────
// Higher authority (SeniorOfficer / Admin / ProjectManager) posts a
// corrective-action decision on an unresolved bottleneck alert.
// The decision is persisted and becomes visible to the DepartmentOfficer.
export const postDecision = asyncHandler(async (req, res) => {
  const { decision } = req.body;

  if (!decision || !decision.trim()) {
    res.status(400);
    throw new Error("Decision text is required");
  }

  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  if (alert.isResolved) {
    res.status(400);
    throw new Error("Alert is already fully resolved");
  }

  alert.authorityDecision = decision.trim();
  alert.authorityDecidedBy = req.user._id;
  alert.authorityDecidedAt = new Date();
  await alert.save();

  await populateAlert(
    Alert.findById(alert._id)
  ).then(async (populated) => {
    res.json(populated);
  });
});

// ── NEW: PATCH /api/alerts/:id/officer-resolved ───────────────────────────
// The DepartmentOfficer who owns the alert marks the problem as fixed
// after acting on the authority's decision. This triggers a notification
// loop back to the higher authority (stored on the alert).
export const officerMarkResolved = asyncHandler(async (req, res) => {
  const { note } = req.body;

  const alert = await Alert.findById(req.params.id);
  if (!alert) {
    res.status(404);
    throw new Error("Alert not found");
  }
  if (alert.isResolved) {
    res.status(400);
    throw new Error("Alert is already fully resolved");
  }

  // Security check: DepartmentOfficer can only resolve alerts for their assigned project
  if (req.user?.role === "DepartmentOfficer") {
    const isAssigned = (req.user.assignedProjects || []).some(
      (p) => String(p._id || p) === String(alert.project?._id || alert.project)
    );
    if (!isAssigned) {
      res.status(403);
      throw new Error("Access denied: You can only resolve alerts for your assigned project");
    }
  }

  alert.officerResolved = true;
  alert.officerResolvedAt = new Date();
  alert.officerResolvedBy = req.user._id;
  alert.officerResolvedNote = (note || "").trim();
  await alert.save();

  const populated = await populateAlert(Alert.findById(alert._id));
  res.json(populated);
});

// PATCH /api/alerts/:id/resolve
// Used by higher authority to fully close the loop once the officer has
// marked the problem as fixed (or at any time they choose to close it).
export const resolveAlert = asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const alert = await Alert.findById(req.params.id).populate("department", "displayName");

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
  const populated = await populateAlert(Alert.findById(alert._id));

  // If resolution notes were provided, record an entry in the dedicated Resolution collection
  if (alert.project && (alert.resolutionNotes || alert.authorityDecision)) {
    const projectId = alert.project._id || alert.project;
    const project = await Project.findById(projectId);
    const details =
      alert.resolutionNotes ||
      `Authority Decision: ${alert.authorityDecision}. Officer fix note: ${alert.officerResolvedNote || "N/A"}`;

    const resDoc = await Resolution.create({
      project: projectId,
      projectName: alert.projectName || project?.name || "Unknown Project",
      department: alert.department?._id || alert.department,
      alert: alert._id,
      title: `${alert.type} Resolved — ${alert.department?.displayName || "Lifecycle Stage"}`,
      category: alert.type === "Bottleneck" ? "Bottleneck" : "Other",
      issueDescription: alert.message,
      resolutionDetails: details,
      actionTakenBy: req.user?.name || "Officer",
      status: "Resolved",
      resolvedBy: req.user?._id || req.user?.id,
      resolvedAt: new Date(),
    });

    if (project) {
      if (!project.resolutions) project.resolutions = [];
      project.resolutions.unshift({
        _id: resDoc._id,
        projectName: project.name,
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

  res.json(populated);
});
