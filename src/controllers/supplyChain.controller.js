import SupplyChain from "../models/supplyChain.model.js";
import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getAuth } from "@clerk/express";

// Get supply chain by batch ID
export const getSupplyChainByBatchId = asyncHandler(async (req, res, next) => {
  const { batchId } = req.params;

  if (!batchId || batchId.trim() === "") {
    throw new ApiError(400, "Batch ID is required!");
  }

  const supplyChain = await SupplyChain.findOne({ batchId });

  if (!supplyChain) {
    throw new ApiError(404, "Supply chain not found for this batch ID!");
  }

  const response = new ApiResponse(
    supplyChain,
    200,
    "Supply chain fetched successfully!"
  );
  return res.status(200).json(response);
});

// Update supply chain stock (when order is placed)
export const updateSupplyChainStock = asyncHandler(async (req, res, next) => {
  const { batchId } = req.params;
  const { quantity } = req.body;

  if (!batchId || batchId.trim() === "") {
    throw new ApiError(400, "Batch ID is required!");
  }

  if (quantity === undefined || quantity === null) {
    throw new ApiError(400, "Quantity is required!");
  }

  const supplyChain = await SupplyChain.findOne({ batchId });
  if (!supplyChain) {
    throw new ApiError(404, "Supply chain not found for this batch ID!");
  }

  // Update stock
  supplyChain.stockRemaining = Math.max(0, supplyChain.stockRemaining - quantity);
  await supplyChain.save();

  const response = new ApiResponse(
    supplyChain,
    200,
    "Supply chain stock updated successfully!"
  );
  return res.status(200).json(response);
});



