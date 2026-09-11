import mongoose from "mongoose";

/**
 * Standalone Resolution Model — Tracks formal bottleneck and dispute resolutions
 * where officers document how specific obstacles, land litigations, court orders,
 * or stakeholder grievances were resolved.
 */
const resolutionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alert",
    },
    title: {
      type: String,
      required: [true, "Resolution title is required"],
      trim: true,
    },
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
    issueDescription: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
    },
    resolutionDetails: {
      type: String,
      required: [true, "Resolution details are required"],
      trim: true,
    },
    actionTakenBy: {
      type: String,
      default: "",
      trim: true,
    },
    caseOrderReference: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Resolved", "Mitigated", "In Hearing"],
      default: "Resolved",
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resolution", resolutionSchema);
