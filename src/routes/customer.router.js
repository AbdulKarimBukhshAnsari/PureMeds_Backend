import { Router } from "express";
import { 
  getFeaturedProducts, 
  getProductsWithFilters, 
  getProductsByCategory, 
  searchProductsByName,
  getProductById,
  createOrder,
  getOrdersByUserId,
  getOrderById,
  deleteOrder
} from "../controllers/customer.controller.js";

const customerRouter = Router();

// Featured products (limit to 3)
customerRouter.get("/featured-products", getFeaturedProducts);

// Get products with filters (pagination, category, search)
customerRouter.get("/products", getProductsWithFilters);

// Search products by name (must come before /products/:id)
customerRouter.get("/products/search", searchProductsByName);

// Get products by category (must come before /products/:id)
customerRouter.get("/products/category/:category", getProductsByCategory);

// Get product by ID (must come last to avoid conflicts)
customerRouter.get("/products/:id", getProductById);

// Order routes
customerRouter.post("/orders", createOrder);
customerRouter.get("/orders", getOrdersByUserId);
customerRouter.get("/orders/:id", getOrderById);
customerRouter.delete("/orders/:id", deleteOrder);

export default customerRouter;
