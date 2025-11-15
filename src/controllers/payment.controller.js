import Stripe from "stripe";
import dotenv from "dotenv";
import Payment from "../models/payment.model.js";
import Order from "../models/order.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getAuth } from "@clerk/express";

dotenv.config();

//It's a fully featured Client object provided by Stripe sdk that the backend uses to talk to stripe api
//stripe becomes an object that wraps every Stripe REST endpoint with convenient JavaScript methods.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Checkout Session (when user clicks “Pay Now”)
export const createCheckoutSession = async (req, res) => {
  try {
    console.log("Incoming request body:", req.body);

    const { cartItems } = req.body;

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: "pkr",
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    const shippingCost = 200;
    lineItems.push({
      price_data: {
        currency: "pkr",
        product_data: { name: "Shipping Fee" },
        unit_amount: shippingCost * 100, // ₨200 → 20000 paisa
      },
      quantity: 1,
    });

    console.log("Line items ready:", lineItems);

    // Ensure CLIENT_URL doesn't have trailing slash to avoid double slashes
    let clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    if (clientUrl.endsWith('/')) {
      clientUrl = clientUrl.slice(0, -1);
    }

    const returnUrl = `${clientUrl}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    console.log("Return URL:", returnUrl);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      ui_mode: "embedded",
      return_url: returnUrl,
    });

    console.log("Stripe session created:", session.id);

    res.json({ clientSecret: session.client_secret });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

// Retrieve session status after checkout
export const getSessionStatus = asyncHandler(async (req, res, next) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const response = new ApiResponse(
      {
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
      },
      200,
      "Session status retrieved successfully!"
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error retrieving session:", error.message);
    throw new ApiError(500, "Failed to get session status");
  }
});

// Create Payment (after successful Stripe payment or COD)
export const createPayment = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const { orderId, paymentMethod, amount, stripeSessionId, stripePaymentIntentId, transactionId } = req.body;

  // Validate required fields
  if (!orderId || !paymentMethod || !amount) {
    throw new ApiError(400, "Order ID, payment method, and amount are required!");
  }

  if (!["card", "cod"].includes(paymentMethod)) {
    throw new ApiError(400, "Valid payment method (card or cod) is required!");
  }

  // Verify order exists
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found!");
  }

  // Check if order belongs to the user
  if (order.userId !== userId) {
    throw new ApiError(403, "You don't have permission to create payment for this order!");
  }

  // Check if payment already exists
  const existingPayment = await Payment.findOne({ orderId });
  if (existingPayment) {
    throw new ApiError(400, "Payment already exists for this order!");
  }

  // Create payment
  const payment = new Payment({
    orderId,
    userId,
    paymentMethod,
    amount,
    status: paymentMethod === "cod" ? "pending" : "completed",
    stripeSessionId: paymentMethod === "card" ? stripeSessionId : undefined,
    stripePaymentIntentId: paymentMethod === "card" ? stripePaymentIntentId : undefined,
    transactionId,
  });

  await payment.save();

  // Update order status if payment is completed
  if (payment.status === "completed") {
    order.status = "confirmed";
    await order.save();
  }

  const response = new ApiResponse(
    payment,
    201,
    "Payment created successfully!"
  );
  return res.status(201).json(response);
});

// Get payment by order ID
export const getPaymentByOrderId = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const { orderId } = req.params; // This is the MongoDB order _id, not orderId field

  if (!orderId || orderId.trim() === "") {
    throw new ApiError(400, "Order ID is required!");
  }

  // Find order by MongoDB _id
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found!");
  }

  const payment = await Payment.findOne({ orderId: order._id }).populate("orderId");

  if (!payment) {
    throw new ApiError(404, "Payment not found!");
  }

  // Check if payment belongs to the user
  if (payment.userId !== userId) {
    throw new ApiError(403, "You don't have permission to view this payment!");
  }

  const response = new ApiResponse(
    payment,
    200,
    "Payment fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get payments by user ID
export const getPaymentsByUserId = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const payments = await Payment.find({ userId })
    .populate("orderId", "orderId totalAmount status")
    .sort({ createdAt: -1 });

  const response = new ApiResponse(
    payments,
    200,
    "Payments fetched successfully!"
  );
  return res.status(200).json(response);
});
