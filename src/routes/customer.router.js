import { Router } from "express";
import { getProducts } from "../controllers/customer.controller.js";

const customerRouter = Router();

customerRouter.get("/products", getProducts);

<<<<<<< HEAD
// here we will define all the customer routes









export default customerRouter ;
=======
export default customerRouter;
>>>>>>> 088c203cc3d6b3d9f3764416227ab9a10ea7012f
