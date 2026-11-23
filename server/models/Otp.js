import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["verify_email", "reset_password"], required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export default mongoose.model("Otp", otpSchema);
