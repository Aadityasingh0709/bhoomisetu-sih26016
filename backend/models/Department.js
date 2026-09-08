import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: [
        "Survey",
        "LegalVerification",
        "Compensation",
        "Rehabilitation",
        "Approvals",
        "Possession",
      ],
    },
    displayName: { type: String, required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    order: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
