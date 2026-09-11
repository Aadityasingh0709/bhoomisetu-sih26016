import mongoose from "mongoose";

/**
 * A DepartmentProgress sub-document tracks one department's contribution
 * to a project's overall lifecycle (Survey -> Legal -> Compensation ->
 * Rehabilitation -> Approvals -> Possession).
 */
const departmentProgressSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    status: {
      type: String,
      enum: ["NotStarted", "OnTrack", "AtRisk", "Delayed", "Completed"],
      default: "NotStarted",
    },
    actualProgress: { type: Number, min: 0, max: 100, default: 0 }, // %
    plannedProgress: { type: Number, min: 0, max: 100, default: 0 }, // % expected by today
    pendingCases: { type: Number, min: 0, default: 0 },
    completedCases: { type: Number, min: 0, default: 0 },
    delayReason: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" },
    expectedCompletionDate: { type: Date },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * Tracks formal bottleneck and dispute resolutions where officers document
 * how specific obstacles, land litigations, court orders, or stakeholder grievances
 * were resolved.
 */
const resolutionSchema = new mongoose.Schema(
  {
    projectName: { type: String, default: "", trim: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Bottleneck",
        "Land Title Dispute",
        "Compensation Grievance",
        "Boundary Demarcation",
        "Rehabilitation & Resettlement",
        "Clearance & NOC",
        "Inter-Agency",
        "Other",
      ],
      default: "Bottleneck",
    },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    issueDescription: { type: String, required: true, trim: true },
    resolutionDetails: { type: String, required: true, trim: true },
    actionTakenBy: { type: String, default: "" },
    caseOrderReference: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Resolved", "Mitigated", "In Hearing"],
      default: "Resolved",
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true }, // e.g. NH-44-KA-2026
    state: { type: String, required: true },
    district: { type: String, required: true },
    location: {
      // GeoJSON point for map plotting (geo-tagging requirement from PS 26016)
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    implementingAgency: { type: String, required: true },
    startDate: { type: Date, required: true },
    plannedCompletionDate: { type: Date, required: true },
    actualCompletionDate: { type: Date },

    areaNotified: { type: Number, default: 0 }, // hectares
    areaAcquired: { type: Number, default: 0 },
    affectedFamilies: { type: Number, default: 0 },
    displacedFamilies: { type: Number, default: 0 },
    compensationAssessed: { type: Number, default: 0 }, // INR
    compensationDisbursed: { type: Number, default: 0 }, // INR

    departments: [departmentProgressSchema],

    overallProgress: { type: Number, min: 0, max: 100, default: 0 },
    overallStatus: {
      type: String,
      enum: ["OnTrack", "AtRisk", "Delayed", "Completed"],
      default: "OnTrack",
    },

    documents: [
      {
        title: String,
        fileUrl: String,
        version: { type: Number, default: 1 },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    resolutions: [resolutionSchema],
  },
  { timestamps: true }
);

projectSchema.index({ location: "2dsphere" });

export default mongoose.model("Project", projectSchema);
