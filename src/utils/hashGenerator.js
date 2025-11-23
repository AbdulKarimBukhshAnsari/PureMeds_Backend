import crypto from "crypto";

/**
 * Generate a cryptographic hash from medicine data
 * @param {string} batchId - Batch ID (e.g., PM-12345)
 * @param {string} manufacturer - Manufacturer name
 * @param {Date|string} expiryDate - Expiry date
 * @param {string} productName - Product name
 * @returns {string} SHA256 hash in hexadecimal format
 */
export const generateMedicineHash = (batchId, manufacturer, expiryDate, productName) => {
  if (!batchId || !manufacturer || !expiryDate || !productName) {
    throw new Error("All parameters are required for hash generation");
  }

  // Convert expiry date to ISO string for consistency
  const expiryDateStr = expiryDate instanceof Date 
    ? expiryDate.toISOString() 
    : new Date(expiryDate).toISOString();

  // Create a unique string from all medicine identifiers
  const hashInput = `${batchId}-${manufacturer}-${expiryDateStr}-${productName}`;
  
  // Generate SHA256 hash
  const hash = crypto.createHash("sha256").update(hashInput).digest("hex");
  
  return hash;
};

/**
 * Convert hex hash to bytes32 format (for Solidity)
 * @param {string} hexHash - Hexadecimal hash string
 * @returns {string} bytes32 formatted hash (0x prefixed, 66 characters)
 */
export const hexToBytes32 = (hexHash) => {
  if (!hexHash) {
    throw new Error("Hash is required");
  }
  
  // Remove 0x prefix if present
  const cleanHash = hexHash.startsWith("0x") ? hexHash.slice(2) : hexHash;
  
  // Ensure it's 64 characters (32 bytes)
  if (cleanHash.length !== 64) {
    throw new Error("Hash must be 64 characters (32 bytes)");
  }
  
  return `0x${cleanHash}`;
};

