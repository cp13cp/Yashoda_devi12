import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 400, default: "" },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    price: { type: Number, required: true, min: 1 },
    imageData: { type: Buffer, select: false },
    imageContentType: { type: String, enum: ["image/jpeg", "image/png", "image/webp"] },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
