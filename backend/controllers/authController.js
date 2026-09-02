import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password").populate("department");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  res.json({
    token: signToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/register  (Administrator only - see routes)
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  const user = await User.create({ name, email, password, role, department });
  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});
