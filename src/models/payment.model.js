import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cod"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    stripeSessionId: {
      type: String,
      sparse: true, // Only required for card payments
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    transactionId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Cascade delete: When order is deleted, payment should be deleted
paymentSchema.index({ orderId: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

