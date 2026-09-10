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

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

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
      // For demo purposes only - remove in production
      demo: {
        resetToken,
        resetUrl,
        expiresIn: "10 minutes",
      },
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

  const user = await User.findOne({
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    res.status(400);
    throw new Error("Token is invalid or has expired");
  }

  if (!user.matchResetToken(token)) {
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

  const user = await User.findById(req.user.id).select("+password");

  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  if (newPassword !== passwordConfirm) {
    res.status(400);
    throw new Error("New passwords do not match");
  }

  user.password = newPassword;
  user.lastPasswordChange = Date.now();
  await user.save();

  res.json({
    message: "Password changed successfully",
    token: signToken(user._id),
  });
});
