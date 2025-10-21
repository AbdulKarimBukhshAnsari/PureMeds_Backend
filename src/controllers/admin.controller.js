import { uploadOnCloudinary } from "../utils/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Product from "../models/product.model.js";
import asyncHandler from "../utils/asyncHandler.js";


const uploadProducts = asyncHandler(async (req, res, next) => {
  
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


const getProducts = asyncHandler(async (req, res, next) => {
    const {page , category , search } = req.query;
    const pageSize = 10;

    // if the category is provided, filter by category
    const query = {};
    if (category) {
        query.category = category;
    }
    if (search) {
        query.productName = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query)
        .skip((page - 1) * pageSize)
        .limit(pageSize);

    const ProductCount = await Product.countDocuments(query);


    const response = new ApiResponse(
        { products, totalProducts: ProductCount },
        200,
        "Products retrieved successfully!"
    );
    return res.status(200).json(response);
});

const deleteProduct = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
        throw new ApiError(404, "Product not found!");
    }

    const response = new ApiResponse(
        deletedProduct,
        200,
        "Product deleted successfully!"
    );
    return res.status(200).json(response);
});


export { uploadProducts, getProducts, deleteProduct };

