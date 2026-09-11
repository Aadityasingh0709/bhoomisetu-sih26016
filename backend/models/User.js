import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ROLES = [
  "Administrator",
  "SeniorOfficer",
  "ProjectManager",
  "DepartmentOfficer",
  "DistrictOfficer",
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastPasswordChange: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.matchResetToken = function (token) {
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  return this.passwordResetToken === hashedToken;
};

export const ROLE_LIST = ROLES;
export default mongoose.model("User", userSchema);
