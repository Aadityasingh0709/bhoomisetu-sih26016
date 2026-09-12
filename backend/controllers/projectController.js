import asyncHandler from "express-async-handler";
import Project from "../models/Project.js";
import Department from "../models/Department.js";
import Alert from "../models/Alert.js";
import Resolution from "../models/Resolution.js";
import User from "../models/User.js";
import { dispatchCredentialsToOfficer } from "../services/notificationService.js";

// Recalculates a project's weighted overall progress + status, and raises
// bottleneck/dependency alerts. This is the core "system converts updates
// into a clear picture" logic described in the problem statement.
export const recalculateProject = async (project, options = {}) => {
  const { skipAlerts = false } = options;
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
    // BUG FIX: do NOT overwrite a "Delayed" status that was explicitly set by an officer.
    // Only assign AtRisk if current status is neither Delayed nor Completed.
    if (
      dp.status !== "Delayed" &&
      dp.status !== "Completed" &&
      dp.plannedProgress - dp.actualProgress >= 10
    ) {
      dp.status = "AtRisk";
      hasAtRisk = true;
    } else if (dp.status === "AtRisk" && dp.plannedProgress - dp.actualProgress < 10) {
      // Clear an automatically assigned risk state once the department recovers.
      dp.status = "OnTrack";
    }

    if (dp.status === "Delayed") hasDelayed = true;
    if (dp.status === "AtRisk") hasAtRisk = true;

    // Rule: many pending cases + low progress => Bottleneck alert
    if (!skipAlerts && dp.pendingCases > 20 && dp.actualProgress < 60) {
      // BUG FIX: Do NOT upsert (which creates duplicates when an existing alert
      // was manually resolved). Instead, only insert when no active alert exists.
      const existing = await Alert.findOne({
        project: project._id,
        department: dp.department,
        type: "Bottleneck",
        isResolved: false,
      });
      if (!existing) {
        await Alert.create({
          project: project._id,
          projectName: project.name,
          department: dp.department,
          type: "Bottleneck",
          severity: "High",
          message: `${dept.displayName} is a bottleneck: ${dp.pendingCases} pending cases at ${dp.actualProgress}% progress.`,
        });
      }
    }
    // No else-resolve here: we leave manually-resolved alerts alone.
  }

  // BUG FIX: Auto-complete when overall progress hits 100%.
  // Previously a fully-complete project would show as "Delayed" if past plannedCompletionDate.
  const allCompleted =
    project.departments.length > 0 &&
    project.departments.every((dp) => dp.status === "Completed");

  if (project.actualCompletionDate || allCompleted || weightedProgress >= 100) {
    project.overallStatus = "Completed";
    if (!project.actualCompletionDate) {
      project.actualCompletionDate = new Date();
    }
  } else if (hasDelayed || new Date() > project.plannedCompletionDate) {
    project.overallStatus = "Delayed";
  } else if (hasAtRisk || weightedProgress < plannedWeightedProgress - 10) {
    project.overallStatus = "AtRisk";
  } else {
    project.overallStatus = "OnTrack";
  }

  project.overallProgress = Math.round(weightedProgress);

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
      // BUG FIX: Only create if no active dependency alert already exists.
      if (!skipAlerts) {
        const existing = await Alert.findOne({
          project: project._id,
          department: downstream.department,
          type: "Dependency",
          isResolved: false,
        });
        if (!existing) {
          await Alert.create({
            project: project._id,
            projectName: project.name,
            department: downstream.department,
            type: "Dependency",
            severity: "Medium",
            message: `${downDept?.displayName} may be affected because ${upDept?.displayName} is behind schedule.`,
          });
        }
      }
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
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
      { district: { $regex: search, $options: "i" } },
    ];
  }
  if (department) filter["departments.department"] = department;

  // Security check: Department officers can only see their assigned projects
  if (req.user?.role === "DepartmentOfficer") {
    const assignedIds = (req.user.assignedProjects || []).map((p) => p._id || p);
    filter._id = { $in: assignedIds };
  }

  const projects = await Project.find(filter)
    .populate("departments.department")
    .populate("departments.assignedOfficer", "name email role phone notificationEmail")
    .populate("resolutions.department")
    .populate("resolutions.resolvedBy", "name email role")
    .sort({ createdAt: -1 });
  res.json(projects);
});

// GET /api/projects/:id
export const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("departments.department")
    .populate("departments.assignedOfficer", "name email role phone notificationEmail")
    .populate("resolutions.department")
    .populate("resolutions.resolvedBy", "name email role");
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Security check: DepartmentOfficer can only view their assigned project
  if (req.user?.role === "DepartmentOfficer") {
    const isAssigned = (req.user.assignedProjects || []).some(
      (p) => String(p._id || p) === String(project._id)
    );
    if (!isAssigned) {
      res.status(403);
      throw new Error("Access denied: You are not assigned to this project");
    }
  }

  res.json(project);
});

// POST /api/projects  (Administrator / ProjectManager)
export const createProject = asyncHandler(async (req, res) => {
  const { departmentOfficers, ...projectData } = req.body;
  const departments = await Department.find();

  // Create initial project document
  const project = new Project({
    ...projectData,
    departments: departments.map((d) => ({
      department: d._id,
    })),
  });

  // If department officers credentials were provided during creation
  if (Array.isArray(departmentOfficers) && departmentOfficers.length > 0) {
    for (const officerData of departmentOfficers) {
      if (!officerData.email || !officerData.password) continue;

      const dept = departments.find(
        (d) =>
          String(d._id) === String(officerData.departmentId) ||
          d.name.toLowerCase() === String(officerData.departmentName || "").toLowerCase()
      );
      if (!dept) continue;

      let user = await User.findOne({ email: officerData.email.toLowerCase().trim() });
      if (user) {
        // Associate this existing officer with this new project
        if (officerData.phone) user.phone = officerData.phone.trim();
        if (officerData.notificationEmail) {
          user.notificationEmail = officerData.notificationEmail.toLowerCase().trim();
        }
        if (officerData.password) {
          user.password = officerData.password;
        }
        if (!user.assignedProjects.some((id) => String(id) === String(project._id))) {
          user.assignedProjects.push(project._id);
        }
        await user.save();
      } else {
        // Create new project-specific department officer
        user = await User.create({
          name: officerData.name?.trim() || `${dept.displayName} Officer`,
          email: officerData.email.toLowerCase().trim(),
          password: officerData.password,
          role: "DepartmentOfficer",
          department: dept._id,
          assignedProjects: [project._id],
          phone: officerData.phone?.trim() || "",
          notificationEmail: officerData.notificationEmail?.toLowerCase()?.trim() || "",
        });
      }

      // Link officer to the project's department progress item
      const deptEntry = project.departments.find(
        (dp) => String(dp.department) === String(dept._id)
      );
      if (deptEntry) {
        deptEntry.assignedOfficer = user._id;
        if (officerData.phone) deptEntry.officerPhone = officerData.phone.trim();
        if (officerData.notificationEmail) {
          deptEntry.officerNotificationEmail = officerData.notificationEmail.toLowerCase().trim();
        }
      }

      // Direct Automated Dispatch: Transmit official credentials directly to officer via Email and WhatsApp
      if (officerData.notificationEmail || officerData.phone) {
        dispatchCredentialsToOfficer({
          officerName: user.name,
          notificationEmail: officerData.notificationEmail || user.notificationEmail,
          phone: officerData.phone || user.phone,
          projectCode: project.code,
          projectName: project.name,
          departmentName: dept.displayName,
          loginEmail: officerData.email,
          password: officerData.password,
        }).catch((err) => {
          console.error(`[Dispatch Error] Automated dispatch to ${user.name} failed:`, err.message);
        });
      }
    }
  }

  await project.save();

  // Apply the same progress, risk, and alert rules at creation time as on a
  // department update, so a newly created project is never left inconsistent.
  const updated = await recalculateProject(project);
  await updated.populate([
    { path: "departments.department" },
    { path: "departments.assignedOfficer", select: "name email role phone notificationEmail" },
  ]);
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

  // Department officers may update only their assigned project and own department.
  if (req.user.role === "DepartmentOfficer") {
    const isAssigned = (req.user.assignedProjects || []).some(
      (p) => String(p._id || p) === String(project._id)
    );
    if (!isAssigned) {
      res.status(403);
      throw new Error("Access denied: You cannot edit a project you are not assigned to");
    }

    if (String(req.user.department?._id) !== deptId) {
      res.status(403);
      throw new Error("You can update only your assigned department");
    }
  }

  const {
    actualProgress,
    plannedProgress,
    pendingCases,
    completedCases,
    delayReason,
    resolutionNotes,
    expectedCompletionDate,
    status,
  } = req.body;

  if (actualProgress !== undefined) entry.actualProgress = actualProgress;
  if (plannedProgress !== undefined) entry.plannedProgress = plannedProgress;
  if (pendingCases !== undefined) entry.pendingCases = pendingCases;
  if (completedCases !== undefined) entry.completedCases = completedCases;
  if (delayReason !== undefined) entry.delayReason = delayReason;
  if (resolutionNotes !== undefined) {
    entry.resolutionNotes = resolutionNotes;
    if (resolutionNotes.trim()) {
      const deptInfo = await Department.findById(deptId);
      const resDoc = await Resolution.create({
        project: project._id,
        projectName: project.name,
        title: `${deptInfo?.displayName || "Stage"} Progress & Resolution Update`,
        category: "Bottleneck",
        department: deptId,
        issueDescription: entry.delayReason || "Pending backlog or milestone delay",
        resolutionDetails: resolutionNotes.trim(),
        actionTakenBy: req.user.name,
        status: "Resolved",
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
      });
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
    }
  }
  // BUG FIX: Treat empty string as null to avoid Mongoose CastError on Date field.
  if (expectedCompletionDate !== undefined) {
    entry.expectedCompletionDate = expectedCompletionDate ? new Date(expectedCompletionDate) : null;
  }
  if (status !== undefined) entry.status = status;
  entry.lastUpdatedBy = req.user._id;
  entry.lastUpdatedAt = new Date();

  const updated = await recalculateProject(project);
  // Populate departments and resolutions so frontend gets full display data
  await updated.populate([
    { path: "departments.department" },
    { path: "resolutions.department" },
    { path: "resolutions.resolvedBy", select: "name email role" },
  ]);
  res.json(updated);
});

// POST /api/projects/:id/resolutions
// Used when an officer writes how he resolved a particular bottleneck or dispute
export const addProjectResolution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  // Security check: Department officer can only add resolutions to their assigned project
  if (req.user.role === "DepartmentOfficer") {
    const isAssigned = (req.user.assignedProjects || []).some(
      (p) => String(p._id || p) === String(project._id)
    );
    if (!isAssigned) {
      res.status(403);
      throw new Error("Access denied: You cannot add resolutions to a project you are not assigned to");
    }
  }

  const {
    title,
    category,
    departmentId,
    issueDescription,
    resolutionDetails,
    actionTakenBy,
    caseOrderReference,
    status,
  } = req.body;

  if (!title || !resolutionDetails) {
    res.status(400);
    throw new Error("Title and resolution details are required");
  }

  // Create standalone document in the dedicated Resolution collection
  const resolutionDoc = await Resolution.create({
    project: project._id,
    projectName: project.name,
    title: title.trim(),
    category: category || "Bottleneck",
    department: departmentId || (req.user.department?._id || null),
    issueDescription: (issueDescription || "").trim(),
    resolutionDetails: resolutionDetails.trim(),
    actionTakenBy: actionTakenBy || req.user.name,
    caseOrderReference: (caseOrderReference || "").trim(),
    status: status || "Resolved",
    resolvedBy: req.user._id,
    resolvedAt: new Date(),
  });

  const newResolution = {
    _id: resolutionDoc._id,
    projectName: project.name,
    title: resolutionDoc.title,
    category: resolutionDoc.category,
    department: resolutionDoc.department,
    issueDescription: resolutionDoc.issueDescription,
    resolutionDetails: resolutionDoc.resolutionDetails,
    actionTakenBy: resolutionDoc.actionTakenBy,
    caseOrderReference: resolutionDoc.caseOrderReference,
    status: resolutionDoc.status,
    resolvedBy: resolutionDoc.resolvedBy,
    resolvedAt: resolutionDoc.resolvedAt,
  };

  if (!project.resolutions) project.resolutions = [];
  project.resolutions.unshift(newResolution);

  // If status is Resolved and a department is specified, resolve matching active alerts
  if (newResolution.status === "Resolved" && newResolution.department) {
    await Alert.updateMany(
      {
        project: project._id,
        department: newResolution.department,
        isResolved: false,
      },
      {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
        resolutionNotes: newResolution.resolutionDetails,
      }
    );
  }

  await project.save();
  await project.populate([
    { path: "departments.department" },
    { path: "resolutions.department" },
    { path: "resolutions.resolvedBy", select: "name email role" },
  ]);

  res.status(201).json(project);
});

// DELETE /api/projects/:id/resolutions/:resolutionId
export const deleteProjectResolution = asyncHandler(async (req, res) => {
  const { id, resolutionId } = req.params;
  const project = await Project.findById(id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  if (project.resolutions) {
    project.resolutions = project.resolutions.filter(
      (r) => String(r._id) !== String(resolutionId)
    );
  }

  await Resolution.findByIdAndDelete(resolutionId);

  await project.save();
  await project.populate([
    { path: "departments.department" },
    { path: "resolutions.department" },
    { path: "resolutions.resolvedBy", select: "name email role" },
  ]);

  res.json(project);
});

// DELETE /api/projects/:id (Administrator only)
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }
  // Remove all alerts and resolutions that belong to this project
  await Alert.deleteMany({ project: project._id });
  await Resolution.deleteMany({ project: project._id });
  await User.updateMany({ assignedProjects: project._id }, { $pull: { assignedProjects: project._id } });
  res.json({ message: "Project deleted" });
});

// POST /api/projects/:id/dispatch-credentials (Administrator & ProjectManager)
// Explicit endpoint to trigger automated direct background dispatch to one or all officers
export const dispatchOfficerCredentials = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { departmentId, password } = req.body;

  const project = await Project.findById(id)
    .populate("departments.department")
    .populate("departments.assignedOfficer", "name email role phone notificationEmail");

  if (!project) {
    res.status(404);
    throw new Error("Project not found");
  }

  const reports = [];

  for (const dp of project.departments) {
    if (departmentId && String(dp.department?._id || dp.department) !== String(departmentId)) {
      continue;
    }

    const officer = dp.assignedOfficer;
    if (!officer) continue;

    const email = dp.officerNotificationEmail || officer.notificationEmail;
    const phone = dp.officerPhone || officer.phone;
    const deptName = dp.department?.displayName || "Department";

    if (!email && !phone) continue;

    const dispatchResults = await dispatchCredentialsToOfficer({
      officerName: officer.name,
      notificationEmail: email,
      phone: phone,
      projectCode: project.code,
      projectName: project.name,
      departmentName: deptName,
      loginEmail: officer.email,
      password: password || "Assigned by Administrator (BhoomiSetu@2026)",
    });

    reports.push({
      officerName: officer.name,
      department: deptName,
      email,
      phone,
      dispatchResults,
    });
  }

  res.json({
    success: true,
    message: `Direct automated credentials dispatched to ${reports.length} officer(s).`,
    reports,
  });
});

