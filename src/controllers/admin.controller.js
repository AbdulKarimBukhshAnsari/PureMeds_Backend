import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Product from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";
// Define your logic for user controller here
// you can make other controllers in the same way as per your requirement

export const uploadProducts = asyncHandler(async (req, res, next) => {
  
    const {
      productName,
      chemicalName,
      manufacturer,
      price,
      purpose,
      sideEffects,
      category,
      availableStock,
    } = req.body;
    

    if (
      !productName ||
      !chemicalName ||
      !manufacturer ||
      !price ||
      !purpose ||
      !sideEffects ||
      !category ||
      !availableStock
    )
      throw new ApiError(400, "Required fields missing!");
    const ProductImagePath = req?.file?.path;
    if (!ProductImagePath) throw new ApiError(400, "Image not found!");
    

    const uploadResult = await uploadOnCloudinary(ProductImagePath);
    if (!uploadResult) throw new ApiError(500, "Image upload failed!");

    const ProductImageUrl = uploadResult.url;

    const productData = {
      productName,
      chemicalName,
      manufacturer,
      price,
      purpose,
      sideEffects,
      category,
      productImage: ProductImageUrl,
      availableStock,
    };

    const newProduct = new Product(productData);
    await newProduct.save();

    if(!(newProduct && newProduct._id)){
      throw new ApiError(500, "Failed to save product!");
    }

    const response = new ApiResponse(
      newProduct,
      200,
      "Product uploaded successfully!"
    );
    return res.status(200).json(response);
  
});
