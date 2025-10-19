import { Router } from "express";
import { getProducts } from "../controllers/customer.controller.js";
import { requireAuth } from "@clerk/express";

const customerRouter = Router();

customerRouter.get("/products", requireAuth() ,   getProducts);

export default customerRouter;
