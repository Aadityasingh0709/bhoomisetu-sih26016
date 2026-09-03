// Seeds departments (with the stage weights from the SIH 26016 workflow),
// an admin + one officer per role, and two demo projects.
// Run with: npm run seed
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";
import Project from "./models/Project.js";
import Alert from "./models/Alert.js";
import { recalculateProject } from "./controllers/projectController.js";

dotenv.config();

const DEPARTMENTS = [
  { name: "Survey", displayName: "Survey", weight: 15, order: 1 },
  { name: "LegalVerification", displayName: "Legal Verification", weight: 15, order: 2 },
  { name: "Compensation", displayName: "Compensation", weight: 30, order: 3 },
  { name: "Rehabilitation", displayName: "Rehabilitation", weight: 25, order: 4 },
  { name: "Approvals", displayName: "Approvals", weight: 5, order: 5 },
  { name: "Possession", displayName: "Possession", weight: 10, order: 6 },
];

const run = async () => {
  await connectDB();
  await Promise.all([Alert.deleteMany(), User.deleteMany(), Department.deleteMany(), Project.deleteMany()]);

  const departments = await Department.insertMany(DEPARTMENTS);
  const byName = Object.fromEntries(departments.map((d) => [d.name, d]));

  const admin = await User.create({
    name: "System Administrator",
    email: "admin@landacquisition.gov.in",
    password: "password123",
    role: "Administrator",
  });

  const seniorOfficer = await User.create({
    name: "Senior Officer",
    email: "senior@landacquisition.gov.in",
    password: "password123",
    role: "SeniorOfficer",
  });

  const officerAccounts = [
    ["Survey", "Survey Officer", "survey@landacquisition.gov.in"],
    ["LegalVerification", "Legal Verification Officer", "legal@landacquisition.gov.in"],
    ["Compensation", "Compensation Officer", "compensation@landacquisition.gov.in"],
    ["Rehabilitation", "Rehabilitation Officer", "rehabilitation@landacquisition.gov.in"],
    ["Approvals", "Approvals Officer", "approvals@landacquisition.gov.in"],
    ["Possession", "Possession Officer", "possession@landacquisition.gov.in"],
  ];

  for (const [departmentName, name, email] of officerAccounts) {
    await User.create({
      name,
      email,
      password: "password123",
      role: "DepartmentOfficer",
      department: byName[departmentName]._id,
    });
  }

  const highwayProject = await Project.create({
    name: "NH-44 Highway Expansion — Phase 2",
    code: "NH44-P2-2026",
    state: "Karnataka",
    district: "Belagavi",
    location: { type: "Point", coordinates: [74.4977, 15.8497] },
    implementingAgency: "National Highways Authority of India",
    startDate: new Date("2026-01-15"),
    plannedCompletionDate: new Date("2026-09-15"),
    areaNotified: 420,
    areaAcquired: 285,
    affectedFamilies: 610,
    displacedFamilies: 140,
    compensationAssessed: 185000000,
    compensationDisbursed: 96000000,
    departments: [
      { department: byName.Survey._id, status: "Completed", actualProgress: 100, plannedProgress: 100, pendingCases: 0, completedCases: 40 },
      { department: byName.LegalVerification._id, status: "Completed", actualProgress: 92, plannedProgress: 90, pendingCases: 3, completedCases: 35 },
      { department: byName.Compensation._id, status: "Delayed", actualProgress: 43, plannedProgress: 70, pendingCases: 32, completedCases: 18, delayReason: "Landowner verification pending" },
      { department: byName.Rehabilitation._id, status: "AtRisk", actualProgress: 55, plannedProgress: 60, pendingCases: 12, completedCases: 20 },
      { department: byName.Approvals._id, status: "Completed", actualProgress: 80, plannedProgress: 80, pendingCases: 1, completedCases: 8 },
      { department: byName.Possession._id, status: "NotStarted", actualProgress: 0, plannedProgress: 10, pendingCases: 0, completedCases: 0 },
    ],
  });

  const freightProject = await Project.create({
    name: "Eastern Freight Corridor — Land Parcel Acquisition",
    code: "EFC-LP-2026",
    state: "Bihar",
    district: "Patna",
    location: { type: "Point", coordinates: [85.1376, 25.5941] },
    implementingAgency: "Dedicated Freight Corridor Corporation of India",
    startDate: new Date("2025-11-01"),
    plannedCompletionDate: new Date("2026-12-01"),
    areaNotified: 260,
    areaAcquired: 260,
    affectedFamilies: 300,
    displacedFamilies: 45,
    compensationAssessed: 90000000,
    compensationDisbursed: 90000000,
    departments: [
      { department: byName.Survey._id, status: "Completed", actualProgress: 100, plannedProgress: 100, pendingCases: 0, completedCases: 20 },
      { department: byName.LegalVerification._id, status: "Completed", actualProgress: 100, plannedProgress: 100, pendingCases: 0, completedCases: 20 },
      { department: byName.Compensation._id, status: "Completed", actualProgress: 100, plannedProgress: 100, pendingCases: 0, completedCases: 20 },
      { department: byName.Rehabilitation._id, status: "OnTrack", actualProgress: 68, plannedProgress: 65, pendingCases: 5, completedCases: 15 },
      { department: byName.Approvals._id, status: "OnTrack", actualProgress: 60, plannedProgress: 55, pendingCases: 2, completedCases: 6 },
      { department: byName.Possession._id, status: "OnTrack", actualProgress: 20, plannedProgress: 15, pendingCases: 1, completedCases: 2 },
    ],
  });

  await recalculateProject(highwayProject);
  await recalculateProject(freightProject);

  console.log("✓ Departments created");
  console.log("✓ Demo users created");
  console.log("✓ Demo projects created");
  console.log("BhoomiSetu demo environment ready.");
  console.log("Demo password for every account: password123");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
