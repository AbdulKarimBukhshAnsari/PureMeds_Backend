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
} , { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;
