import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { 
  getFeaturedProducts, 
  getProductsWithFilters, 
  getProductsByCategory, 
  searchProductsByName,
  getProductById,
} from "../controllers/medicine.controller.js";
import {
  createOrder,
  getOrdersByUserId,
  getOrderById,
  deleteOrder
} from "../controllers/order.controller.js";
import {
  createComplaint,
  getComplaintsByUserId,
  getComplaintById,
  deleteComplaint,
} from "../controllers/complaint.controller.js";
import {
  verifyMedicineByQRCode,
  verifyMedicineByHash,
} from "../controllers/verification.controller.js";
import {
  getSupplyChainByBatchId,
} from "../controllers/supplyChain.controller.js";

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

// Complaint routes
customerRouter.post(
  "/complaints",
  upload.single("qrCode"),
  createComplaint
);
customerRouter.get("/complaints", getComplaintsByUserId);
customerRouter.get("/complaints/:id", getComplaintById);
customerRouter.delete("/complaints/:id", deleteComplaint);

// Medicine verification routes
customerRouter.post(
  "/verify/qrcode",
  upload.single("qrCode"),
  verifyMedicineByQRCode
);
customerRouter.post("/verify/hash", verifyMedicineByHash);

// Supply Chain routes
customerRouter.get("/supply-chain/batch/:batchId", getSupplyChainByBatchId);

export default customerRouter;

