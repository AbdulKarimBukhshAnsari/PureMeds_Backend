import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName : {
    type: String,
    required: true,
    index : true
  },
  chemicalName: {
    type: String,
    required: true,
  },
  manufacturer: {   
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  purpose: {
    type: String,
    required: true,
  },
  sideEffects: [{
    type: String ,
    required: true
  }],
  category : {
    type : String ,
    required : true ,
    index : true
  },
  productImage: {
    type: String,
    required: true,
  },
  availableStock: {
    type: Number,
    required: true,
  },
  batchId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^PM-\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid batch ID! Format should be PM-{number}`
    }
  },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrCode: {
    type: String,
    required: true
  }
} , { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
