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
} from "../controllers/complaint.controller.js";

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

export default adminRouter;
