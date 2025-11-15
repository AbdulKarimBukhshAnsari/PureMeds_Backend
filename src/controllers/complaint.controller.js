import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getAuth } from "@clerk/express";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create Complaint
export const createComplaint = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const {
    medicineName,
    medicineDose,
    manufacturer,
    batchId,
    manufacturerDate,
    expiryDate,
    store,
    city,
    description,
  } = req.body;

  // Validate required fields
  if (
    !medicineName ||
    !medicineDose ||
    !manufacturer ||
    !batchId ||
    !manufacturerDate ||
    !expiryDate ||
    !store ||
    !city ||
    !description
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  // Handle QR Code file upload
  const qrCodePath = req?.file?.path;
  if (!qrCodePath) {
    throw new ApiError(400, "QR Code image is required!");
  }

  const uploadResult = await uploadOnCloudinary(qrCodePath);
  if (!uploadResult) {
    throw new ApiError(500, "QR Code image upload failed!");
  }

  const qrCodeUrl = uploadResult.url;

  // Create complaint
  const complaint = new Complaint({
    userId,
    medicineName,
    medicineDose,
    manufacturer,
    batchId,
    manufacturerDate,
    expiryDate,
    store,
    city,
    qrCode: qrCodeUrl,
    description,
    status: "Pending",
    adminRemarks: "",
  });

  await complaint.save();

  const response = new ApiResponse(
    complaint,
    201,
    "Complaint created successfully!"
  );
  return res.status(201).json(response);
});

// Get complaints by user ID
export const getComplaintsByUserId = asyncHandler(async (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const complaints = await Complaint.find({ userId }).sort({ createdAt: -1 });

  const response = new ApiResponse(
    complaints,
    200,
    "Complaints fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get complaint by ID
export const getComplaintById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Complaint ID is required!");
  }

  const complaint = await Complaint.findById(id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found!");
  }

  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  // Check if complaint belongs to the user
  if (complaint.userId !== userId) {
    throw new ApiError(403, "You don't have permission to view this complaint!");
  }

  const response = new ApiResponse(
    complaint,
    200,
    "Complaint fetched successfully!"
  );
  return res.status(200).json(response);
});

// Delete complaint
export const deleteComplaint = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Complaint ID is required!");
  }

  const { userId } = getAuth(req);
  if (!userId) {
    throw new ApiError(401, "Unauthorized request!");
  }

  const complaint = await Complaint.findById(id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found!");
  }

  // Check if complaint belongs to the user
  if (complaint.userId !== userId) {
    throw new ApiError(403, "You don't have permission to delete this complaint!");
  }

  // Delete complaint
  await Complaint.findByIdAndDelete(id);

  const response = new ApiResponse(
    null,
    200,
    "Complaint deleted successfully!"
  );
  return res.status(200).json(response);
});

