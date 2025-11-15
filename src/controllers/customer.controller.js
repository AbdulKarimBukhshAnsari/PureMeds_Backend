import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getAuth } from "@clerk/express";

// Get all products (existing endpoint - kept for backward compatibility)
export const getProducts = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw new ApiError(401, "Unauthorized request!");
    }
    const products = await Product.find({});

    if (!products || products.length === 0) {
      throw new ApiError(404, "No products found!");
    }
    const response = new ApiResponse(
      products,
      201,
      "Products fetched successfully!"
    );
    return res.status(200).json(response);
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Get featured products (limit to 3) - No authentication required
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  // Get 3 random products or latest products
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(3);

  if (!products || products.length === 0) {
    throw new ApiError(404, "No featured products found!");
  }

  const response = new ApiResponse(
    products,
    200,
    "Featured products fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get products with pagination, category filter, and search - No authentication required
export const getProductsWithFilters = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 15, category = "", search = "" } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};
  
  if (category && category.trim() !== "") {
    query.category = category;
  }

  if (search && search.trim() !== "") {
    query.productName = { $regex: search, $options: "i" };
  }

  // Execute query with pagination
  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalProducts = await Product.countDocuments(query);

  if (!products || products.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        { products: [], totalProducts: 0, currentPage: pageNum, totalPages: 0 },
        200,
        "No products found!"
      )
    );
  }

  const response = new ApiResponse(
    {
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
    },
    200,
    "Products fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get products by category with pagination - No authentication required
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!category || category.trim() === "") {
    throw new ApiError(400, "Category is required!");
  }

  const products = await Product.find({ category })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalProducts = await Product.countDocuments({ category });

  if (!products || products.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        { products: [], totalProducts: 0, currentPage: pageNum, totalPages: 0 },
        200,
        `No products found in category: ${category}`
      )
    );
  }

  const response = new ApiResponse(
    {
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      category,
    },
    200,
    "Products fetched successfully!"
  );
  return res.status(200).json(response);
});

// Search products by name with pagination - No authentication required
export const searchProductsByName = asyncHandler(async (req, res, next) => {
  const { q: searchQuery } = req.query;
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!searchQuery || searchQuery.trim() === "") {
    throw new ApiError(400, "Search query is required!");
  }

  const products = await Product.find({
    productName: { $regex: searchQuery, $options: "i" },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalProducts = await Product.countDocuments({
    productName: { $regex: searchQuery, $options: "i" },
  });

  if (!products || products.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        { products: [], totalProducts: 0, currentPage: pageNum, totalPages: 0 },
        200,
        `No products found matching: ${searchQuery}`
      )
    );
  }

  const response = new ApiResponse(
    {
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      searchQuery,
    },
    200,
    "Products found successfully!"
  );
  return res.status(200).json(response);
});

// Get product by ID - No authentication required
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Product ID is required!");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }

  const response = new ApiResponse(
    product,
    200,
    "Product fetched successfully!"
  );
  return res.status(200).json(response);
});

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