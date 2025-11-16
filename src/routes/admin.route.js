import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import { 
  uploadProducts, 
  getProductsAdmin, 
  deleteProduct 
} from "../controllers/medicine.controller.js";

const adminRouter = Router();

// here we will define all the admin routes
adminRouter.post(
  "/uploadproducts",
  upload.single("productImage"),
  uploadProducts
);

adminRouter.get("/products", getProductsAdmin);
adminRouter.delete("/products/:productId", deleteProduct);

export default adminRouter;
