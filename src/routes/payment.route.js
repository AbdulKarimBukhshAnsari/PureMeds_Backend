import express from "express";
import {
  createCheckoutSession,
  getSessionStatus,
  createPayment,
  getPaymentByOrderId,
  getPaymentsByUserId,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Route to create a checkout session
router.post("/create-checkout-session", createCheckoutSession);

// Route to get session status
router.get("/session-status", getSessionStatus);

// Payment routes
router.post("/", createPayment);
router.get("/", getPaymentsByUserId);
router.get("/order/:orderId", getPaymentByOrderId);

export default router;
