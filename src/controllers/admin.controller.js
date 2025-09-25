import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
// Define your logic for user controller here
// you can make other controllers in the same way as per your requirement

export const uploadProducts = async (req, res, next) => {
  try {
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
      imageUrl: ProductImageUrl,
      availableStock,
    };

    const response = new ApiResponse(
      productData,
      201,
      "Product uploaded successfully!"
    );
    return res.status(201).json(response);
  } catch (error) {
    console.log(error);
    next(error);
  }
};
