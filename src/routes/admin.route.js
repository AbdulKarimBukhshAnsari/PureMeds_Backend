import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
// import function from controller here
import { uploadProducts } from "../controllers/admin.controller.js";
import { getProducts } from "../controllers/admin.controller.js";
import { deleteProduct } from "../controllers/admin.controller.js";



const adminRouter = Router();

// here we will define all the admin routes
adminRouter.post(
  "/uploadproducts",
  upload.single("productImage"),
  uploadProducts
);

adminRouter.get("/products", getProducts);
adminRouter.delete("/products/:productId", deleteProduct);

export default adminRouter;
