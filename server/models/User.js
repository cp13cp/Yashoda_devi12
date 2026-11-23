import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, maxlength: 160 },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
