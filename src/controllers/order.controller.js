import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getAuth } from "@clerk/express";

// Create Order
export const createOrder = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const { customerInfo, products, subtotal, shipping, totalAmount, paymentMethod } = req.body;

  // Validate required fields
  if (!customerInfo || !products || !Array.isArray(products) || products.length === 0) {
    throw new ApiError(400, "Customer info and products are required!");
  }

  if (!subtotal || !totalAmount) {
    throw new ApiError(400, "Subtotal and total amount are required!");
  }

  if (!paymentMethod || !["card", "cod"].includes(paymentMethod)) {
    throw new ApiError(400, "Valid payment method (card or cod) is required!");
  }

  // Validate customer info
  const requiredCustomerFields = ["firstName", "lastName", "email", "phone", "address", "city", "state", "zip", "country"];
  for (const field of requiredCustomerFields) {
    if (!customerInfo[field]) {
      throw new ApiError(400, `${field} is required in customer info!`);
    }
  }

  // Validate and check product availability, then decrease stock
  const orderProducts = [];
  for (const item of products) {
    if (!item.productId || !item.quantity || !item.price) {
      throw new ApiError(400, "Each product must have productId, quantity, and price!");
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      throw new ApiError(404, `Product with ID ${item.productId} not found!`);
    }

    if (product.availableStock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for ${product.productName}. Available: ${product.availableStock}, Requested: ${item.quantity}`);
    }

    // Decrease stock
    product.availableStock -= item.quantity;
    await product.save();

    orderProducts.push({
      productId: product._id,
      productName: product.productName,
      quantity: item.quantity,
      price: item.price,
    });
  }

  // Create order
  const order = new Order({
    userId,
    customerInfo,
    products: orderProducts,
    subtotal,
    shipping: shipping || 200,
    totalAmount,
    paymentMethod,
    status: paymentMethod === "cod" ? "pending" : "confirmed",
  });

  await order.save();

  const response = new ApiResponse(
    order,
    201,
    "Order created successfully!"
  );
  return res.status(201).json(response);
});

// Get orders by user ID
export const getOrdersByUserId = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const orders = await Order.find({ userId })
    .populate("products.productId", "productName productImage price")
    .sort({ createdAt: -1 });

  const response = new ApiResponse(
    orders,
    200,
    "Orders fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get order by ID
export const getOrderById = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Order ID is required!");
  }

  const order = await Order.findById(id).populate("products.productId", "productName productImage price manufacturer");

  if (!order) {
    throw new ApiError(404, "Order not found!");
  }

  // Check if order belongs to the user
  if (order.userId !== userId) {
    throw new ApiError(403, "You don't have permission to view this order!");
  }

  const response = new ApiResponse(
    order,
    200,
    "Order fetched successfully!"
  );
  return res.status(200).json(response);
});

// Delete order (cascade delete payment)
export const deleteOrder = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Order ID is required!");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found!");
  }

  // Check if order belongs to the user
  if (order.userId !== userId) {
    throw new ApiError(403, "You don't have permission to delete this order!");
  }

  // Delete associated payment
  await Payment.deleteOne({ orderId: order._id });

  // Restore product stock
  for (const item of order.products) {
    const product = await Product.findById(item.productId);
    if (product) {
      product.availableStock += item.quantity;
      await product.save();
    }
  }

  // Delete order
  await Order.findByIdAndDelete(id);

  const response = new ApiResponse(
    null,
    200,
    "Order deleted successfully!"
  );
  return res.status(200).json(response);
});

