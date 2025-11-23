import Product from "../models/product.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import jsQR from "jsqr";
import Jimp from "jimp";
import blockchainService from "../services/blockchain.service.js";

/**
 * Verify medicine by QR code image
 * This endpoint accepts a QR code image, decodes it, extracts the hash,
 * and verifies it against both database and blockchain
 */
export const verifyMedicineByQRCode = asyncHandler(async (req, res, next) => {
  const qrCodeImagePath = req?.file?.path;
  
  if (!qrCodeImagePath) {
    throw new ApiError(400, "QR code image is required!");
  }

  try {
    // Decode QR code from image using Jimp and jsQR
    let decodedData;
    try {
      // Read image file
      const image = await Jimp.read(qrCodeImagePath);
      
      // Get image data for jsQR
      const { data, width, height } = image.bitmap;
      
      // Convert to Uint8ClampedArray format expected by jsQR
      const imageData = new Uint8ClampedArray(data);
      
      // Decode QR code
      const qrCode = jsQR(imageData, width, height);
      
      if (!qrCode) {
        throw new Error("Could not decode QR code");
      }
      
      decodedData = qrCode.data;
    } catch (error) {
      // Clean up temp file
      if (fs.existsSync(qrCodeImagePath)) {
        fs.unlinkSync(qrCodeImagePath);
      }
      throw new ApiError(400, "Invalid QR code image. Please upload a valid QR code.");
    }

    // Clean up temp file
    if (fs.existsSync(qrCodeImagePath)) {
      fs.unlinkSync(qrCodeImagePath);
    }

    // Parse decoded data
    let qrData;
    try {
      qrData = JSON.parse(decodedData);
    } catch (error) {
      throw new ApiError(400, "Invalid QR code data format.");
    }

    const { hash, batchId } = qrData;

    if (!hash || !batchId) {
      throw new ApiError(400, "QR code does not contain valid medicine data.");
    }

    // Check in database first
    const product = await Product.findOne({ hash: hash });

    if (!product) {
      return res.status(200).json(
        new ApiResponse(
          {
            isValid: false,
            isDistributedByPureMeds: false,
            message: "This medicine is not distributed by PureMeds. The QR code does not match any registered medicine in our system.",
            hash: hash,
            batchId: batchId
          },
          200,
          "Medicine verification failed"
        )
      );
    }

    // Verify on blockchain
    let blockchainVerification = null;
    try {
      blockchainVerification = await blockchainService.verifyMedicine(hash);
    } catch (error) {
      console.error("Blockchain verification error:", error);
      // Continue with database verification if blockchain fails
    }

    // Check expiry date
    const isExpired = new Date(product.expiryDate) < new Date();
    const daysUntilExpiry = Math.ceil(
      (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    // Prepare response
    const verificationResult = {
      isValid: true,
      isDistributedByPureMeds: true,
      isExpired: isExpired,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
      product: {
        productName: product.productName,
        chemicalName: product.chemicalName,
        manufacturer: product.manufacturer,
        batchId: product.batchId,
        expiryDate: product.expiryDate,
        category: product.category
      },
      blockchainVerification: blockchainVerification,
      verifiedAt: new Date().toISOString()
    };

    // Determine message based on verification status
    let message = "Medicine verified successfully!";
    if (isExpired) {
      message = "Medicine verified but has expired. Do not use this medicine.";
    } else if (daysUntilExpiry <= 30) {
      message = `Medicine verified. Warning: Expires in ${daysUntilExpiry} days.`;
    }

    if (!blockchainVerification?.isValid) {
      message += " Note: Blockchain verification unavailable.";
    }

    return res.status(200).json(
      new ApiResponse(
        verificationResult,
        200,
        message
      )
    );
  } catch (error) {
    // Clean up temp file in case of error
    if (fs.existsSync(qrCodeImagePath)) {
      fs.unlinkSync(qrCodeImagePath);
    }
    throw error;
  }
});

/**
 * Verify medicine by hash (direct hash verification)
 * Useful when hash is already extracted from QR code
 */
export const verifyMedicineByHash = asyncHandler(async (req, res, next) => {
  const { hash } = req.body;

  if (!hash) {
    throw new ApiError(400, "Hash is required!");
  }

  // Check in database
  const product = await Product.findOne({ hash: hash });

  if (!product) {
    return res.status(200).json(
      new ApiResponse(
        {
          isValid: false,
          isDistributedByPureMeds: false,
          message: "This medicine is not distributed by PureMeds. The hash does not match any registered medicine in our system.",
          hash: hash
        },
        200,
        "Medicine verification failed"
      )
    );
  }

  // Verify on blockchain
  let blockchainVerification = null;
  try {
    blockchainVerification = await blockchainService.verifyMedicine(hash);
  } catch (error) {
    console.error("Blockchain verification error:", error);
  }

  // Check expiry date
  const isExpired = new Date(product.expiryDate) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(product.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const verificationResult = {
    isValid: true,
    isDistributedByPureMeds: true,
    isExpired: isExpired,
    daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
    product: {
      productName: product.productName,
      chemicalName: product.chemicalName,
      manufacturer: product.manufacturer,
      batchId: product.batchId,
      expiryDate: product.expiryDate,
      category: product.category
    },
    blockchainVerification: blockchainVerification,
    verifiedAt: new Date().toISOString()
  };

  let message = "Medicine verified successfully!";
  if (isExpired) {
    message = "Medicine verified but has expired. Do not use this medicine.";
  } else if (daysUntilExpiry <= 30) {
    message = `Medicine verified. Warning: Expires in ${daysUntilExpiry} days.`;
  }

  if (!blockchainVerification?.isValid) {
    message += " Note: Blockchain verification unavailable.";
  }

  return res.status(200).json(
    new ApiResponse(
      verificationResult,
      200,
      message
    )
  );
});

