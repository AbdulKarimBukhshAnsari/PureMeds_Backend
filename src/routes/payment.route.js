import express from "express";
import {
  createCheckoutSession,
  getSessionStatus,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Route to create a checkout session
router.post("/create-checkout-session", createCheckoutSession);

// Route to get session status
router.get("/session-status", getSessionStatus);

export default router;
