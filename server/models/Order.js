import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, trim: true, maxlength: 20, default: "" },
    deliveryAddress: { type: String, trim: true, maxlength: 500, default: "" },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    showPublicPurchase: { type: Boolean, default: false },
    paymentMethod: { type: String, enum: ["cod", "upi"], default: "cod" },
    utr: { type: String, trim: true, maxlength: 40, default: "" },
    paymentStatus: { type: String, enum: ["pending", "submitted", "verified", "failed"], default: "pending" },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    status: { type: String, enum: ["new", "confirmed", "delivered", "cancelled"], default: "new", index: true },
  },
  { timestamps: true },
);

orderSchema.index({ showPublicPurchase: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
