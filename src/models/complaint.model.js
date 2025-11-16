import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    medicineDose: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    batchId: {
      type: String,
      required: true,
    },
    manufacturerDate: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: String,
      required: true,
    },
    store: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Resolved", "Invalid"],
      default: "Pending",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Generate unique complaint ID before saving
complaintSchema.pre("save", async function (next) {
  if (this.isNew && !this.complaintId) {
    let unique = false;
    let complaintId;
    
    while (!unique) {
      // Generate 5-digit random number between 0-10000
      complaintId = `ALT-${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
      
      // Check if this ID already exists using this.constructor
      const existing = await this.constructor.findOne({ complaintId });
      if (!existing) {
        unique = true;
      }
    }
    
    this.complaintId = complaintId;
  }
  next();
});

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;

