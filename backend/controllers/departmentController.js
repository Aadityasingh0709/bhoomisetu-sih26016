import asyncHandler from "express-async-handler";
import Department from "../models/Department.js";

// GET /api/departments
export const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ order: 1 });
  res.json(departments);
});

// POST /api/departments (Administrator only, used for initial setup)
export const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json(department);
});
