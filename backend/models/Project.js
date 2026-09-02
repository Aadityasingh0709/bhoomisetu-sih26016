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
    expectedCompletionDate: { type: Date },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
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
  },
  { timestamps: true }
);

projectSchema.index({ location: "2dsphere" });

export default mongoose.model("Project", projectSchema);
