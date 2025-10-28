// this file is the entry point of the application

import express from "express";
import cors from "cors";
import { errorHandler } from "./utils/errorHandler.js";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// defining the configurations

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "250kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(clerkMiddleware());

// route for checking the server status
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is live",
  });
});

// defining the routes here

// app.use('/api/v1/auth' , authRoutes) ;

import adminRouter from "./routes/admin.route.js";
import customerRouter from "./routes/customer.router.js";
import paymentRouter from "./routes/payment.route.js";

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/customer", customerRouter);

app.use("/api/v1/payments", paymentRouter);

// this should be end of all routes
app.use(errorHandler);

export default app;
