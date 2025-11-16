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

// Get all orders with filters (Admin only)
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const { status, userId, productName, batchId, orderId, startDate, endDate, page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};

  if (status && status.trim() !== "") {
    query.status = status;
  }

  if (userId && userId.trim() !== "") {
    query.userId = userId;
  }

  if (orderId && orderId.trim() !== "") {
    query.orderId = { $regex: orderId, $options: "i" };
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // If filtering by productName or batchId, we need to find matching products first
  if (productName && productName.trim() !== "") {
    const matchingProducts = await Product.find({
      productName: { $regex: productName, $options: "i" }
    }).select("_id");
    const productIds = matchingProducts.map(p => p._id);
    query["products.productId"] = { $in: productIds };
  }

  if (batchId && batchId.trim() !== "") {
    const matchingProducts = await Product.find({
      batchId: { $regex: batchId, $options: "i" }
    }).select("_id");
    const productIds = matchingProducts.map(p => p._id);
    // If productName filter also exists, combine with AND
    if (productName && productName.trim() !== "") {
      const nameProducts = await Product.find({
        productName: { $regex: productName, $options: "i" }
      }).select("_id");
      const nameProductIds = nameProducts.map(p => p._id);
      const combinedIds = productIds.filter(id => nameProductIds.some(nid => nid.toString() === id.toString()));
      query["products.productId"] = { $in: combinedIds };
    } else {
      query["products.productId"] = { $in: productIds };
    }
  }

  // Execute query with pagination
  const orders = await Order.find(query)
    .populate("products.productId", "productName batchId")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalOrders = await Order.countDocuments(query);

  const response = new ApiResponse(
    {
      orders,
      totalOrders,
      currentPage: pageNum,
      totalPages: Math.ceil(totalOrders / limitNum),
    },
    200,
    "Orders fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get order by ID (Admin version - no user check)
export const getOrderByIdAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Order ID is required!");
  }

  const order = await Order.findById(id)
    .populate("products.productId", "productName productImage price manufacturer batchId");

  if (!order) {
    throw new ApiError(404, "Order not found!");
  }

  const response = new ApiResponse(
    order,
    200,
    "Order fetched successfully!"
  );
  return res.status(200).json(response);
});

// Update order status and admin remarks (Admin only)
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminRemarks } = req.body;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Order ID is required!");
  }

  if (!status || !["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"].includes(status)) {
    throw new ApiError(400, "Valid status is required!");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found!");
  }

  // Update status and remarks
  order.status = status;
  if (adminRemarks !== undefined) {
    order.adminRemarks = adminRemarks;
  }

  await order.save();

  const response = new ApiResponse(
    order,
    200,
    "Order updated successfully!"
  );
  return res.status(200).json(response);
});

// Export orders to CSV (Admin only)
export const exportOrdersCSV = asyncHandler(async (req, res, next) => {
  const { status, userId, startDate, endDate } = req.query;

  // Build query
  const query = {};

  if (status && status.trim() !== "") {
    query.status = status;
  }

  if (userId && userId.trim() !== "") {
    query.userId = userId;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  const orders = await Order.find(query)
    .populate("products.productId", "productName batchId")
    .sort({ createdAt: -1 });

  // Generate CSV
  const csvHeaders = [
    "Order ID",
    "User ID",
    "Customer Name",
    "Email",
    "Phone",
    "Status",
    "Payment Method",
    "Total Amount",
    "Products",
    "Date Created"
  ];

  const csvRows = orders.map(order => {
    const customerName = `${order.customerInfo.firstName} ${order.customerInfo.lastName}`;
    const products = order.products.map(p => 
      `${p.productName} (Qty: ${p.quantity})`
    ).join("; ");
    
    return [
      order.orderId || "",
      order.userId || "",
      customerName,
      order.customerInfo.email || "",
      order.customerInfo.phone || "",
      order.status || "",
      order.paymentMethod || "",
      order.totalAmount || 0,
      products,
      order.createdAt ? new Date(order.createdAt).toISOString() : ""
    ];
  });

  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=orders_${Date.now()}.csv`);
  res.send(csvContent);
});

