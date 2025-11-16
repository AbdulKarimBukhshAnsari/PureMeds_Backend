import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { 
  uploadProducts, 
  getProductsAdmin, 
  deleteProduct 
} from "../controllers/medicine.controller.js";
import {
  getAllComplaints,
  getComplaintByIdAdmin,
  updateComplaintStatus,
  getBatchComplaintCount,
  exportComplaintsCSV,
} from "../controllers/complaint.controller.js";
import {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  exportOrdersCSV,
} from "../controllers/order.controller.js";
import {
  getDashboardOverview,
  getMedicinesDashboard,
  getOrdersDashboard,
  getComplaintsDashboard,
  getAlertsDashboard,
} from "../controllers/dashboard.controller.js";

const adminRouter = Router();

// here we will define all the admin routes
adminRouter.post(
  "/uploadproducts",
  upload.single("productImage"),
  uploadProducts
);

adminRouter.get("/products", getProductsAdmin);
adminRouter.delete("/products/:productId", deleteProduct);

// Complaint/Alert routes
adminRouter.get("/complaints", getAllComplaints);
adminRouter.get("/complaints/:id", getComplaintByIdAdmin);
adminRouter.patch("/complaints/:id", updateComplaintStatus);
adminRouter.get("/complaints/batch/count", getBatchComplaintCount);
adminRouter.get("/complaints/export/csv", exportComplaintsCSV);

// Order routes
adminRouter.get("/orders", getAllOrders);
adminRouter.get("/orders/:id", getOrderByIdAdmin);
adminRouter.patch("/orders/:id", updateOrderStatus);
adminRouter.get("/orders/export/csv", exportOrdersCSV);

// Dashboard routes
adminRouter.get("/dashboard/overview", getDashboardOverview);
adminRouter.get("/dashboard/medicines", getMedicinesDashboard);
adminRouter.get("/dashboard/orders", getOrdersDashboard);
adminRouter.get("/dashboard/complaints", getComplaintsDashboard);
adminRouter.get("/dashboard/alerts", getAlertsDashboard);

export default adminRouter;
