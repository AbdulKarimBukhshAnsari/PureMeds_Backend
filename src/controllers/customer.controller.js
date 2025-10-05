import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { getAuth } from "@clerk/express";

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
