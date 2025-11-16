import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getAuth } from "@clerk/express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

// Get featured products (limit to 3) - No authentication required
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  // Get 3 random products or latest products
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(3);

  if (!products || products.length === 0) {
    throw new ApiError(404, "No featured products found!");
  }

  const response = new ApiResponse(
    products,
    200,
    "Featured products fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get products with pagination, category filter, and search - No authentication required
export const getProductsWithFilters = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 15, category = "", search = "" } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};
  
  if (category && category.trim() !== "") {
    query.category = category;
  }

  if (search && search.trim() !== "") {
    query.productName = { $regex: search, $options: "i" };
  }

  // Execute query with pagination
  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalProducts = await Product.countDocuments(query);

  if (!products || products.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        { products: [], totalProducts: 0, currentPage: pageNum, totalPages: 0 },
        200,
        "No products found!"
      )
    );
  }

  const response = new ApiResponse(
    {
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
    },
    200,
    "Products fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get products by category with pagination - No authentication required
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!category || category.trim() === "") {
    throw new ApiError(400, "Category is required!");
  }

  const products = await Product.find({ category })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalProducts = await Product.countDocuments({ category });

  if (!products || products.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        { products: [], totalProducts: 0, currentPage: pageNum, totalPages: 0 },
        200,
        `No products found in category: ${category}`
      )
    );
  }

  const response = new ApiResponse(
    {
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      category,
    },
    200,
    "Products fetched successfully!"
  );
  return res.status(200).json(response);
});

// Search products by name with pagination - No authentication required
export const searchProductsByName = asyncHandler(async (req, res, next) => {
  const { q: searchQuery } = req.query;
  const { page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  if (!searchQuery || searchQuery.trim() === "") {
    throw new ApiError(400, "Search query is required!");
  }

  const products = await Product.find({
    productName: { $regex: searchQuery, $options: "i" },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalProducts = await Product.countDocuments({
    productName: { $regex: searchQuery, $options: "i" },
  });

  if (!products || products.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        { products: [], totalProducts: 0, currentPage: pageNum, totalPages: 0 },
        200,
        `No products found matching: ${searchQuery}`
      )
    );
  }

  const response = new ApiResponse(
    {
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      searchQuery,
    },
    200,
    "Products found successfully!"
  );
  return res.status(200).json(response);
});

// Get product by ID - No authentication required
export const getProductById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Product ID is required!");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found!");
  }

  const response = new ApiResponse(
    product,
    200,
    "Product fetched successfully!"
  );
  return res.status(200).json(response);
});


// Upload Product (Admin only)
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
    batchId,
    expiryDate
  } = req.body;
  

  if (
    !productName ||
    !chemicalName ||
    !manufacturer ||
    !price ||
    !purpose ||
    !sideEffects ||
    !category ||
    !availableStock ||
    !batchId ||
    !expiryDate
  )
    throw new ApiError(400, "Required fields missing!");

  // Validate batch ID format
  const batchIdRegex = /^PM-\d+$/;
  if (!batchIdRegex.test(batchId)) {
    throw new ApiError(400, "Invalid Batch ID format! Use PM-{number} (e.g., PM-12345)");
  }

  // Check if batch ID already exists
  const existingBatch = await Product.findOne({ batchId });
  if (existingBatch) {
    throw new ApiError(400, "Batch ID already exists! Please use a unique Batch ID.");
  }

  // Validate expiry date is in the future
  const expiryDateObj = new Date(expiryDate);
  if (expiryDateObj <= new Date()) {
    throw new ApiError(400, "Expiry date must be in the future!");
  }

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
    batchId,
    expiryDate: expiryDateObj
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

// Get products with filters (Admin version with pagination)
export const getProductsAdmin = asyncHandler(async (req, res, next) => {
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

// Delete Product (Admin only)
export const deleteProduct = asyncHandler(async (req, res, next) => {
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

