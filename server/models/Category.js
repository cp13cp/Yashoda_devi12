import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40, unique: true },
    imageData: { type: Buffer, required: true, select: false },
    imageContentType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp"] },
  },
  { timestamps: true },
);

export default mongoose.model("Category", categorySchema);
