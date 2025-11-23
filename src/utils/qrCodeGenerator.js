import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate QR code image from hash data
 * @param {string} hash - The medicine hash to encode in QR code
 * @param {string} batchId - Batch ID for additional data
 * @returns {Promise<string>} Path to the generated QR code image
 */
export const generateQRCode = async (hash, batchId) => {
  try {
    // Create data object to encode in QR code
    const qrData = JSON.stringify({
      hash: hash,
      batchId: batchId,
      timestamp: new Date().toISOString()
    });

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, "../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `qrcode-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
    const filepath = path.join(tempDir, filename);

    // Generate QR code with options
    await QRCode.toFile(filepath, qrData, {
      errorCorrectionLevel: "H", // High error correction
      type: "png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      },
      width: 300
    });

    return filepath;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

