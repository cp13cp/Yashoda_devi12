import mongoose from "mongoose";

const posterSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true, unique: true, default: "home" },
    imageData: { type: Buffer, required: true, select: false },
    imageContentType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp"] },
  },
  { timestamps: true },
);

export default mongoose.model("Poster", posterSchema);
