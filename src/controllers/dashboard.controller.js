import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Complaint from "../models/complaint.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get Dashboard Overview Statistics
export const getDashboardOverview = asyncHandler(async (req, res, next) => {
  // Total Medicines
  const totalMedicines = await Product.countDocuments();

  // Low Stock Items (less than 50)
  const lowStockCount = await Product.countDocuments({ availableStock: { $lt: 50 } });

  // Total Alerts (Complaints)
  const totalAlerts = await Complaint.countDocuments();

  // Inventory Value
  const products = await Product.find({}, "price availableStock");
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.availableStock), 0);

  // Category Distribution
  const categoryDistribution = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    }
  ]);

  // Recent Medicines (last 5)
  const recentMedicines = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select("productName price availableStock productImage category batchId");

  // Low Stock Medicines (first 5)
  const lowStockMedicines = await Product.find({ availableStock: { $lt: 50 } })
    .sort({ availableStock: 1 })
    .limit(5)
    .select("productName availableStock productImage");

  // Today's Orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today }
  });

  // Pending Complaints
  const pendingComplaints = await Complaint.countDocuments({ status: "Pending" });

  // Medicines Expiring Soon (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringSoon = await Product.countDocuments({
    expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
  });

  const response = new ApiResponse(
    {
      totalMedicines,
      lowStockCount,
      totalAlerts,
      totalValue: Math.round(totalValue),
      categoryDistribution: categoryDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentMedicines,
      lowStockMedicines,
      todayOrders,
      pendingComplaints,
      expiringSoon,
    },
    200,
    "Dashboard overview fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get Medicines Dashboard Statistics
export const getMedicinesDashboard = asyncHandler(async (req, res, next) => {
  // Total Medicines
  const totalMedicines = await Product.countDocuments();

  // Low Stock
  const lowStock = await Product.countDocuments({ availableStock: { $lt: 50 } });

  // Out of Stock
  const outOfStock = await Product.countDocuments({ availableStock: 0 });

  // Expired
  const now = new Date();
  const expired = await Product.countDocuments({ expiryDate: { $lt: now } });

  // Expiring Soon (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiringSoon = await Product.countDocuments({
    expiryDate: { $lte: thirtyDaysFromNow, $gte: now }
  });

  // Stock Level Distribution
  const stockDistribution = await Product.aggregate([
    {
      $group: {
        _id: {
          $cond: [
            { $lt: ["$availableStock", 10] },
            "Critical",
            {
              $cond: [
                { $lt: ["$availableStock", 50] },
                "Low",
                {
                  $cond: [
                    { $lt: ["$availableStock", 100] },
                    "Medium",
                    "High"
                  ]
                }
              ]
            }
          ]
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Category Wise Medicines
  const categoryWise = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const response = new ApiResponse(
    {
      totalMedicines,
      lowStock,
      outOfStock,
      expired,
      expiringSoon,
      stockDistribution: stockDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      categoryWise: categoryWise.map(item => ({
        category: item._id,
        count: item.count
      })),
    },
    200,
    "Medicines dashboard fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get Orders Dashboard Statistics
export const getOrdersDashboard = asyncHandler(async (req, res, next) => {
  // Total Orders
  const totalOrders = await Order.countDocuments();

  // Completed (Delivered)
  const completed = await Order.countDocuments({ status: "delivered" });

  // Cancelled
  const cancelled = await Order.countDocuments({ status: "cancelled" });

  // In Progress (pending, confirmed, processing, shipped)
  const inProgress = await Order.countDocuments({
    status: { $in: ["pending", "confirmed", "processing", "shipped"] }
  });

  // Today's Orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today }
  });

  // Revenue Today
  const todayRevenueOrders = await Order.find({
    createdAt: { $gte: today },
    status: { $ne: "cancelled" }
  }).select("totalAmount");
  const revenueToday = todayRevenueOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Orders trend last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const ordersTrend = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const response = new ApiResponse(
    {
      totalOrders,
      completed,
      cancelled,
      inProgress,
      todayOrders,
      revenueToday: Math.round(revenueToday),
      ordersTrend: ordersTrend.map(item => ({
        date: item._id,
        count: item.count
      })),
    },
    200,
    "Orders dashboard fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get Complaints Dashboard Statistics
export const getComplaintsDashboard = asyncHandler(async (req, res, next) => {
  // Total Complaints
  const totalComplaints = await Complaint.countDocuments();

  // Pending
  const pending = await Complaint.countDocuments({ status: "Pending" });

  // Resolved
  const resolved = await Complaint.countDocuments({ status: "Resolved" });

  // Rejected/Invalid
  const rejected = await Complaint.countDocuments({ status: "Invalid" });

  // Latest Complaints (last 5)
  const latestComplaints = await Complaint.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select("complaintId status medicineName batchId createdAt");

  // Status Distribution for Pie Chart
  const statusDistribution = await Complaint.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const response = new ApiResponse(
    {
      totalComplaints,
      pending,
      resolved,
      rejected,
      latestComplaints,
      statusDistribution: statusDistribution.map(item => ({
        status: item._id,
        count: item.count
      })),
    },
    200,
    "Complaints dashboard fetched successfully!"
  );
  return res.status(200).json(response);
});

// Get Alerts Dashboard Statistics
export const getAlertsDashboard = asyncHandler(async (req, res, next) => {
  // Low Stock Alerts
  const lowStockAlerts = await Product.find({ availableStock: { $lt: 50 } })
    .select("productName availableStock batchId")
    .limit(10);

  // Expiry Alerts (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const expiryAlerts = await Product.find({
    expiryDate: { $lte: thirtyDaysFromNow, $gte: new Date() }
  })
    .select("productName expiryDate batchId")
    .limit(10);

  // Complaint Alerts (Pending complaints)
  const complaintAlerts = await Complaint.find({ status: "Pending" })
    .select("complaintId medicineName batchId createdAt")
    .limit(10);

  // Order Issues (Cancelled orders in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const orderIssues = await Order.find({
    status: "cancelled",
    createdAt: { $gte: sevenDaysAgo }
  })
    .select("orderId totalAmount createdAt")
    .limit(10);

  // Stock Refill Reminders (Critical stock < 10)
  const stockRefillReminders = await Product.find({ availableStock: { $lt: 10 } })
    .select("productName availableStock batchId")
    .limit(10);

  const response = new ApiResponse(
    {
      lowStockAlerts,
      expiryAlerts,
      complaintAlerts,
      orderIssues,
      stockRefillReminders,
    },
    200,
    "Alerts dashboard fetched successfully!"
  );
  return res.status(200).json(response);
});

