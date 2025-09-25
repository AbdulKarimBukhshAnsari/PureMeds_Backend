import { Router } from "express";
import { getProducts } from "../controllers/customer.controller.js";

const customerRouter = Router();

customerRouter.get("/products", getProducts);

export default customerRouter;
