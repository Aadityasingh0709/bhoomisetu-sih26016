import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    projectName: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    type: {
      type: String,
      enum: ["Bottleneck", "Dependency", "ScheduleRisk", "Delay", "Dispute"],
      required: true,
    },
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    message: { type: String, required: true },

    // ── Higher-Authority Decision ──────────────────────────────────────────
    // Posted by SeniorOfficer / Admin after reviewing a bottleneck alert.
    // Visible to the DepartmentOfficer who raised the issue.
    authorityDecision: { type: String, default: "" },
    authorityDecidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorityDecidedAt: { type: Date },

    // ── Officer Acknowledgement / Resolution ──────────────────────────────
    // Set by the DepartmentOfficer once the bottleneck is actually fixed.
    officerResolved: { type: Boolean, default: false },
    officerResolvedAt: { type: Date },
    officerResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    officerResolvedNote: { type: String, default: "" },

    // ── Final Resolution (set when higher authority closes the loop) ───────
    isResolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNotes: { type: String, default: "" },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
