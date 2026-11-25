import mongoose from "mongoose";

const paymentItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const paymentAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    deliveryAddress: { type: String, required: true, trim: true, maxlength: 500 },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    showPublicPurchase: { type: Boolean, default: false },
    items: { type: [paymentItemSchema], required: true },
    subtotal: { type: Number, required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    status: { type: String, enum: ["creating", "pending", "paid", "failed"], default: "creating" },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true },
);

paymentAttemptSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
paymentAttemptSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });

export default mongoose.model("PaymentAttempt", paymentAttemptSchema);
