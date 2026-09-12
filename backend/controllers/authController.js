import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Project from "../models/Project.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// GET /api/auth/validate-project/:code
export const validateProjectCode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  if (!code || !code.trim()) {
    res.status(400);
    throw new Error("Project Code / ID is required");
  }

  const query = code.match(/^[0-9a-fA-F]{24}$/)
    ? { $or: [{ _id: code }, { code: { $regex: new RegExp(`^${code.trim()}$`, "i") } }] }
    : { code: { $regex: new RegExp(`^${code.trim()}$`, "i") } };

  const project = await Project.findOne(query).select("name code state district implementingAgency overallStatus");
  if (!project) {
    res.status(404);
    throw new Error(`Project with code/ID "${code}" not found in system.`);
  }

  res.json({
    success: true,
    project: {
      id: project._id,
      code: project.code,
      name: project.name,
      state: project.state,
      district: project.district,
      implementingAgency: project.implementingAgency,
    },
  });
});

// GET /api/auth/lookup-projects
export const lookupProjects = asyncHandler(async (req, res) => {
  const { q } = req.query;
  let filter = {};
  if (q && q.trim()) {
    const regex = new RegExp(q.trim(), "i");
    filter = {
      $or: [
        { code: regex },
        { name: regex },
        { district: regex },
        { state: regex },
        { implementingAgency: regex },
      ],
    };
  }

  const projects = await Project.find(filter)
    .select("name code state district implementingAgency overallStatus")
    .sort({ createdAt: -1 })
    .limit(40);

  res.json({
    success: true,
    projects: projects.map((p) => ({
      id: p._id,
      code: p.code,
      name: p.name,
      state: p.state,
      district: p.district,
      implementingAgency: p.implementingAgency,
      overallStatus: p.overallStatus,
    })),
  });
});


// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, projectCode } = req.body;

  if (!email || !email.trim()) {
    res.status(400);
    throw new Error("Email is required");
  }

  if (!password || !password.trim()) {
    res.status(400);
    throw new Error("Password is required");
  }

  const user = await User.findOne({ email })
    .select("+password")
    .populate("department")
    .populate("assignedProjects", "name code state district");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  let activeProject = null;

  // Departmental Officers MUST provide their project ID/code
  if (user.role === "DepartmentOfficer") {
    if (!projectCode || !projectCode.trim()) {
      res.status(400);
      throw new Error("Project ID / Code is required for Departmental Officers");
    }

    const query = projectCode.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ _id: projectCode }, { code: { $regex: new RegExp(`^${projectCode.trim()}$`, "i") } }] }
      : { code: { $regex: new RegExp(`^${projectCode.trim()}$`, "i") } };

    const targetProject = await Project.findOne(query).populate("departments.department");
    if (!targetProject) {
      res.status(404);
      throw new Error(`Project with code/ID "${projectCode}" does not exist.`);
    }

    // Check if user is assigned to this project
    const isAssignedToProject =
      user.assignedProjects?.some((p) => String(p._id || p) === String(targetProject._id)) ||
      targetProject.departments?.some((dp) => String(dp.assignedOfficer) === String(user._id));

    // If no specific project assignment restriction was set on legacy/global demo accounts, auto-associate
    if (!isAssignedToProject && (!user.assignedProjects || user.assignedProjects.length === 0)) {
      // Allow legacy demo/unassigned officers or associate them
      user.assignedProjects = [targetProject._id];
      await user.save();
    } else if (!isAssignedToProject) {
      res.status(403);
      throw new Error(
        `Access denied: Officer "${user.name}" is not assigned to Project "${targetProject.name}" (${targetProject.code}).`
      );
    }

    activeProject = {
      id: targetProject._id,
      code: targetProject.code,
      name: targetProject.name,
      state: targetProject.state,
      district: targetProject.district,
    };
  }

  res.json({
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      assignedProjects: user.assignedProjects,
      activeProject,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate("department")
    .populate("assignedProjects", "name code state district");
  res.json({ user });
});

// POST /api/auth/register  (Administrator only - see routes)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Name is required");
  }

  if (!email || !email.trim()) {
    res.status(400);
    throw new Error("Email is required");
  }

  if (!password || !password.trim()) {
    res.status(400);
    throw new Error("Password is required");
  }

  if (!role || !role.trim()) {
    res.status(400);
    throw new Error("Role is required");
  }

  const exists = await User.findOne({ email: email.trim() });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({ name, email, password, role, department });
  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No user found with that email address");
  }

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In production, send email with reset token
  // For demo, we'll return it in response with a warning
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  try {
    // TODO: Implement actual email service (Nodemailer, SendGrid, etc.)
    console.log(`Password reset URL: ${resetUrl}`);

    res.json({
      message: "Password reset token sent to email",
      expiresIn: "10 minutes",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error("Error sending password reset email");
  }
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  if (password !== passwordConfirm) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    res.status(400);
    throw new Error("Token is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.lastPasswordChange = Date.now();
  await user.save();

  res.json({
    message: "Password reset successful",
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  if (!currentPassword || !currentPassword.trim()) {
    res.status(400);
    throw new Error("Current password is required");
  }

  if (!newPassword || !newPassword.trim()) {
    res.status(400);
    throw new Error("New password is required");
  }

  if (!passwordConfirm || !passwordConfirm.trim()) {
    res.status(400);
    throw new Error("Password confirmation is required");
  }

  if (newPassword !== passwordConfirm) {
    res.status(400);
    throw new Error("New passwords do not match");
  }

  const user = await User.findById(req.user.id).select("+password");

  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  user.lastPasswordChange = Date.now();
  await user.save();

  res.json({
    message: "Password changed successfully",
    token: signToken(user._id),
  });
});
