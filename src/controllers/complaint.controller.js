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


// Get all complaints with filters (Admin only)
export const getAllComplaints = asyncHandler(async (req, res, next) => {
  const { status, city, store, batchId, page = 1, limit = 15 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build query
  const query = {};

  if (status && status.trim() !== "") {
    query.status = status;
  }

  if (city && city.trim() !== "") {
    query.city = { $regex: city, $options: "i" };
  }

  if (store && store.trim() !== "") {
    query.store = { $regex: store, $options: "i" };
  }

  if (batchId && batchId.trim() !== "") {
    query.batchId = { $regex: batchId, $options: "i" };
  }

  // Execute query with pagination
  const complaints = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalComplaints = await Complaint.countDocuments(query);

  const response = new ApiResponse(
    {
      complaints,
      totalComplaints,
      currentPage: pageNum,
      totalPages: Math.ceil(totalComplaints / limitNum),
    },
    200,
    "Complaints fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get complaint by ID (Admin version - no user check)
export const getComplaintByIdAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Complaint ID is required!");
  }

  const complaint = await Complaint.findById(id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found!");
  }

  const response = new ApiResponse(
    complaint,
    200,
    "Complaint fetched successfully!"
  );
  return res.status(200).json(response);
});

// Update complaint status and admin remarks (Admin only)
export const updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminRemarks } = req.body;

  if (!id || id.trim() === "") {
    throw new ApiError(400, "Complaint ID is required!");
  }

  if (!status || !["Pending", "Reviewed", "Resolved", "Invalid"].includes(status)) {
    throw new ApiError(400, "Valid status (Pending, Reviewed, Resolved, Invalid) is required!");
  }

  const complaint = await Complaint.findById(id);

  if (!complaint) {
    throw new ApiError(404, "Complaint not found!");
  }

  // Update status and remarks
  complaint.status = status;
  if (adminRemarks !== undefined) {
    complaint.adminRemarks = adminRemarks;
  }

  await complaint.save();

  const response = new ApiResponse(
    complaint,
    200,
    "Complaint updated successfully!"
  );
  return res.status(200).json(response);
});

// Get batch complaint count (Admin only)
export const getBatchComplaintCount = asyncHandler(async (req, res, next) => {
  const { batchId } = req.query;

  if (!batchId || batchId.trim() === "") {
    throw new ApiError(400, "Batch ID is required!");
  }

  const count = await Complaint.countDocuments({ batchId });

  const response = new ApiResponse(
    { batchId, count },
    200,
    "Batch complaint count fetched successfully!"
  );
  return res.status(200).json(response);
});

// Export complaints to CSV (Admin only)
export const exportComplaintsCSV = asyncHandler(async (req, res, next) => {
  const { status, city, store, batchId } = req.query;

  // Build query
  const query = {};

  if (status && status.trim() !== "") {
    query.status = status;
  }

  if (city && city.trim() !== "") {
    query.city = { $regex: city, $options: "i" };
  }

  if (store && store.trim() !== "") {
    query.store = { $regex: store, $options: "i" };
  }

  if (batchId && batchId.trim() !== "") {
    query.batchId = { $regex: batchId, $options: "i" };
  }

  const complaints = await Complaint.find(query).sort({ createdAt: -1 });

  // Generate CSV
  const csvHeaders = [
    "Complaint ID",
    "User ID",
    "Medicine Name",
    "Dose",
    "Manufacturer",
    "Batch ID",
    "Store",
    "City",
    "Status",
    "Date Created"
  ];

  const csvRows = complaints.map(complaint => {
    return [
      complaint.complaintId || "",
      complaint.userId || "",
      complaint.medicineName || "",
      complaint.medicineDose || "",
      complaint.manufacturer || "",
      complaint.batchId || "",
      complaint.store || "",
      complaint.city || "",
      complaint.status || "",
      complaint.createdAt ? new Date(complaint.createdAt).toISOString() : ""
    ];
  });

  const csvContent = [
    csvHeaders.join(","),
    ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=complaints_${Date.now()}.csv`);
  res.send(csvContent);
});
