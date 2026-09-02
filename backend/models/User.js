import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    isActive: { type: Boolean, default: true },
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

export const ROLE_LIST = ROLES;
export default mongoose.model("User", userSchema);
