import mongoose from "mongoose";

const supplyChainSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "Product",
      validate: {
        validator: function(v) {
          return /^PM-\d+$/.test(v);
        },
        message: props => `${props.value} is not a valid batch ID! Format should be PM-{number}`
      }
    },
    manufacturerName: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    stockRemaining: {
      type: Number,
      required: true,
      default: 0,
    },
    details: {
      "raw-material": {
        verified: {
          type: Boolean,
          default: true,
        },
        name: {
          type: String,
          default: "ABC",
        },
      },
      Manufacturer: {
        verified: {
          type: Boolean,
          default: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
      "Quality-testing": {
        verified: {
          type: Boolean,
          default: true,
        },
        name: {
          type: String,
          default: "ABV",
        },
      },
      Platform: {
        verified: {
          type: Boolean,
          default: true,
        },
        name: {
          type: String,
          default: "PureMeds",
        },
      },
      Customers: {
        verified: {
          type: Boolean,
          default: true,
        },
        name: {
          type: String,
          default: "",
        },
      },
    },
  },
  { timestamps: true }
);

// Index for faster queries
supplyChainSchema.index({ batchId: 1 });

const SupplyChain = mongoose.model("SupplyChain", supplyChainSchema);

export default SupplyChain;

