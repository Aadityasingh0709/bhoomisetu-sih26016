// Seeds departments (with the stage weights from the SIH 26016 workflow),
// an admin + one officer per role, demo resolutions, and two demo projects.
// Run with: npm run seed
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";
import Project from "./models/Project.js";
import Alert from "./models/Alert.js";
import Resolution from "./models/Resolution.js";
import { recalculateProject } from "./controllers/projectController.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });
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
  await Promise.all([
    Alert.deleteMany(),
    User.deleteMany(),
    Department.deleteMany(),
    Project.deleteMany(),
    Resolution.deleteMany(),
  ]);

  const departments = await Department.insertMany(DEPARTMENTS);
  const byName = Object.fromEntries(departments.map((d) => [d.name, d]));

  const admin = await User.create({
    name: "System Administrator",
    email: "admin@landacquisition.gov.in",
    password: "Admin@2026Secure!",
    role: "Administrator",
  });

  const seniorOfficer = await User.create({
    name: "Senior Officer",
    email: "senior@landacquisition.gov.in",
    password: "Senior@2026Officer!",
    role: "SeniorOfficer",
  });

  const officerAccounts = [
    ["Survey", "Survey Officer", "survey@landacquisition.gov.in", "Survey@2026Land!"],
    ["LegalVerification", "Legal Verification Officer", "legal@landacquisition.gov.in", "Legal@2026Verify!"],
    ["Compensation", "Compensation Officer", "compensation@landacquisition.gov.in", "Compensation@2026!"],
    ["Rehabilitation", "Rehabilitation Officer", "rehabilitation@landacquisition.gov.in", "Rehab@2026Support!"],
    ["Approvals", "Approvals Officer", "approvals@landacquisition.gov.in", "Approvals@2026!"],
    ["Possession", "Possession Officer", "possession@landacquisition.gov.in", "Possession@2026!"],
  ];

  for (const [departmentName, name, email, password] of officerAccounts) {
    await User.create({
      name,
      email,
      password,
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
    resolutions: [
      {
        title: "Survey Parcel #44B Title Contest & Boundary Settlement",
        category: "Land Title Dispute",
        department: byName.LegalVerification._id,
        issueDescription: "Conflicting claims over ancestral partition between co-owners blocked joint verification and issuance of 3D award notification for 14.2 hectares.",
        resolutionDetails: "Convened Lok Adalat mediation session with Assistant Commissioner, Revenue Inspector, and legal counsels on 12 Feb 2026. Family members reached consent apportionment agreement; individual sub-division deed executed and registered under Order #REV/BLG-2026/894.",
        actionTakenBy: "Legal Verification Officer & Assistant Commissioner Belagavi",
        caseOrderReference: "REV/BLG-2026/894-LOKADALAT",
        status: "Resolved",
        resolvedBy: seniorOfficer._id,
        resolvedAt: new Date("2026-02-14"),
      },
      {
        title: "Disbursement Backlog Unblocked for Gram Panchayat Hosur",
        category: "Compensation Grievance",
        department: byName.Compensation._id,
        issueDescription: "28 farmer bank account IFSC details bounced during bulk PFMS DBT transfer due to rural cooperative bank consolidation.",
        resolutionDetails: "Held special camp in Hosur Panchayat Hall with lead district bank manager. Re-authenticated Aadhaar seeded bank accounts on PFMS portal; verified passbooks and completed direct transfer of ₹2.4 Cr compensation within 48 hours.",
        actionTakenBy: "Compensation Officer & District Lead Bank Manager",
        caseOrderReference: "PFMS-CORR-2026-0211",
        status: "Resolved",
        resolvedBy: seniorOfficer._id,
        resolvedAt: new Date("2026-02-28"),
      },
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
    resolutions: [
      {
        title: "Railway Alignment & Irrigation Canal NOC Clearance",
        category: "Clearance & NOC",
        department: byName.Approvals._id,
        issueDescription: "Water Resources Dept raised objections regarding drainage siphon clearance along chainage 42+200 km.",
        resolutionDetails: "Joint engineering inspection conducted on 10 Jan 2026 with Chief Engineer (DFCCIL) and Executive Engineer (Water Resources). Revised box-culvert design with 20% expanded discharge cross-section submitted and unconditional NOC issued.",
        actionTakenBy: "Approvals Officer & Executive Engineer WRD",
        caseOrderReference: "WRD/IRR-PAT-NOC/2026-102",
        status: "Resolved",
        resolvedBy: admin._id,
        resolvedAt: new Date("2026-01-18"),
      },
    ],
  });

  await recalculateProject(highwayProject);
  await recalculateProject(freightProject);

  // Seed dedicated Resolution collection
  const resolutionDocs = [
    ...highwayProject.resolutions.map((r) => ({
      _id: r._id,
      project: highwayProject._id,
      department: r.department,
      title: r.title,
      category: r.category,
      issueDescription: r.issueDescription,
      resolutionDetails: r.resolutionDetails,
      actionTakenBy: r.actionTakenBy,
      caseOrderReference: r.caseOrderReference,
      status: r.status,
      resolvedBy: r.resolvedBy,
      resolvedAt: r.resolvedAt,
    })),
    ...freightProject.resolutions.map((r) => ({
      _id: r._id,
      project: freightProject._id,
      department: r.department,
      title: r.title,
      category: r.category,
      issueDescription: r.issueDescription,
      resolutionDetails: r.resolutionDetails,
      actionTakenBy: r.actionTakenBy,
      caseOrderReference: r.caseOrderReference,
      status: r.status,
      resolvedBy: r.resolvedBy,
      resolvedAt: r.resolvedAt,
    })),
  ];
  await Resolution.insertMany(resolutionDocs);

  console.log("✓ Departments created");
  console.log("✓ Demo users created");
  console.log("✓ Demo projects created");
  console.log("✓ Dedicated Resolution collection seeded");
  console.log("BhoomiSetu demo environment ready.");
  console.log("\n📋 Demo Account Credentials:");
  console.log("─────────────────────────────────────────");
  console.log("Admin: admin@landacquisition.gov.in → Admin@2026Secure!");
  console.log("Senior Officer: senior@landacquisition.gov.in → Senior@2026Officer!");
  console.log("Survey Officer: survey@landacquisition.gov.in → Survey@2026Land!");
  console.log("Legal Officer: legal@landacquisition.gov.in → Legal@2026Verify!");
  console.log("Compensation Officer: compensation@landacquisition.gov.in → Compensation@2026!");
  console.log("Rehabilitation Officer: rehabilitation@landacquisition.gov.in → Rehab@2026Support!");
  console.log("Approvals Officer: approvals@landacquisition.gov.in → Approvals@2026!");
  console.log("Possession Officer: possession@landacquisition.gov.in → Possession@2026!");
  console.log("─────────────────────────────────────────\n");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
