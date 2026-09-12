import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { hasPermission, getStagePermissions } from "../config/rbac.js";

// Verifies the JWT and attaches the user to req.user
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password").populate("department");
    if (!req.user || !req.user.isActive) {
      res.status(401);
      throw new Error("Not authorized, user no longer active");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }
});

// Role-based authorization: restrictTo("Administrator", "SeniorOfficer")
export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

// Permission-based authorization using RBAC
export const requirePermission = (permission) => (req, res, next) => {
  if (!hasPermission(req.user.role, permission)) {
    res.status(403);
    throw new Error(`User does not have permission to '${permission}'`);
  }
  next();
};

// Multiple permissions (user must have at least one)
export const requireAnyPermission = (...permissions) => (req, res, next) => {
  const hasAny = permissions.some(perm => hasPermission(req.user.role, perm));
  if (!hasAny) {
    res.status(403);
    throw new Error("User does not have required permissions");
  }
  next();
};

// Multiple permissions (user must have all)
export const requireAllPermissions = (...permissions) => (req, res, next) => {
  const hasAll = permissions.every(perm => hasPermission(req.user.role, perm));
  if (!hasAll) {
    res.status(403);
    throw new Error("User does not have all required permissions");
  }
  next();
};

// Department-level access control
export const requireDepartmentAccess = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;

  if (!req.user?.department) {
    res.status(403);
    throw new Error("You do not have access to this department");
  }

  // Administrators have access to all departments
  if (req.user.role === "Administrator") {
    return next();
  }

  // DepartmentOfficers can only access their own department
  if (req.user.role === "DepartmentOfficer") {
    if (req.user.department._id.toString() !== departmentId) {
      res.status(403);
      throw new Error("You do not have access to this department");
    }
    return next();
  }

  // For all other roles, explicitly deny access unless specifically allowed elsewhere
  res.status(403);
  throw new Error("You do not have access to this department");
});

// Ownership-based access control for resources
export const requireOwnership = (userField = "createdBy") => asyncHandler(async (req, res, next) => {
  const resource = req.resource || req.params;

  // Administrators have access to all resources
  if (req.user.role === "Administrator") {
    return next();
  }

  if (resource[userField]?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You do not have access to this resource");
  }

  next();
});

