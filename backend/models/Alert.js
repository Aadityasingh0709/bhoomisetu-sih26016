import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    type: {
      type: String,
      enum: ["Bottleneck", "Dependency", "ScheduleRisk", "Delay", "Dispute"],
      required: true,
    },
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    message: { type: String, required: true },
    isResolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
