import { ethers } from "ethers";
import ApiError from "../utils/ApiError.js";

/**
 * Blockchain Service Class
 * Handles all interactions with the MedicineRegistry smart contract
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.privateKey = process.env.PRIVATE_KEY;
    this.rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545"; // Default to local Hardhat node
    
    // Contract ABI (Application Binary Interface)
    this.contractABI = [
      "function registerMedicine(bytes32 _hash, string memory _batchId) public returns (bool)",
      "function verifyMedicine(bytes32 _hash) public view returns (bool isValid, string memory batchId, uint256 registeredAt)",
      "function isMedicineRegistered(bytes32 _hash) public view returns (bool)",
      "function getTotalMedicines() public view returns (uint256)",
      "function owner() public view returns (address)",
      "event MedicineRegistered(bytes32 indexed hash, string batchId, address registeredBy, uint256 timestamp)"
    ];
  }

  /**
   * Initialize the blockchain connection
   */
  async initialize() {
    try {
      // Create provider (connection to blockchain)
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
      
      // Create signer (wallet that will sign transactions)
      if (!this.privateKey) {
        throw new Error("PRIVATE_KEY environment variable is not set");
      }
      
      this.signer = new ethers.Wallet(this.privateKey, this.provider);
      
      // Connect to contract
      if (!this.contractAddress) {
        throw new Error("CONTRACT_ADDRESS environment variable is not set");
      }
      
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractABI,
        this.signer
      );
      
      console.log("Blockchain service initialized successfully");
      console.log("Contract address:", this.contractAddress);
      console.log("Signer address:", await this.signer.getAddress());
    } catch (error) {
      console.error("Error initializing blockchain service:", error);
      throw new ApiError(500, `Blockchain initialization failed: ${error.message}`);
    }
  }

  /**
   * Register a medicine hash on the blockchain
   * @param {string} hash - The medicine hash (hex string)
   * @param {string} batchId - The batch ID (e.g., PM-12345)
   * @returns {Promise<Object>} Transaction receipt
   */
  async registerMedicine(hash, batchId) {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      // Convert hex string to bytes32
      // Ensure hash is 64 characters (32 bytes) without 0x prefix
      const cleanHash = hash.startsWith("0x") ? hash.slice(2) : hash;
      if (cleanHash.length !== 64) {
        throw new ApiError(400, "Invalid hash format. Hash must be 64 characters.");
      }
      const hashBytes32 = "0x" + cleanHash;
      
      // Check if already registered
      const isRegistered = await this.contract.isMedicineRegistered(hashBytes32);
      if (isRegistered) {
        throw new ApiError(400, "Medicine hash already registered on blockchain");
      }

      // Send transaction to register medicine
      const tx = await this.contract.registerMedicine(hashBytes32, batchId);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      console.log("Medicine registered on blockchain:", {
        hash: hash,
        batchId: batchId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error("Error registering medicine on blockchain:", error);
      
      // Handle specific errors
      if (error.code === "CALL_EXCEPTION") {
        throw new ApiError(500, "Blockchain contract call failed. Check contract address and network.");
      }
      
      if (error.reason) {
        throw new ApiError(400, `Blockchain error: ${error.reason}`);
      }
      
      throw new ApiError(500, `Failed to register medicine on blockchain: ${error.message}`);
    }
  }

  /**
   * Verify if a medicine hash exists on the blockchain
   * @param {string} hash - The medicine hash (hex string)
   * @returns {Promise<Object>} Verification result
   */
  async verifyMedicine(hash) {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      // Convert hex string to bytes32
      const cleanHash = hash.startsWith("0x") ? hash.slice(2) : hash;
      if (cleanHash.length !== 64) {
        throw new ApiError(400, "Invalid hash format. Hash must be 64 characters.");
      }
      const hashBytes32 = "0x" + cleanHash;
      
      // Call contract to verify
      const [isValid, batchId, registeredAt] = await this.contract.verifyMedicine(hashBytes32);
      
      return {
        isValid: isValid,
        batchId: batchId,
        registeredAt: registeredAt.toString(),
        hash: hash
      };
    } catch (error) {
      console.error("Error verifying medicine on blockchain:", error);
      throw new ApiError(500, `Failed to verify medicine on blockchain: ${error.message}`);
    }
  }

  /**
   * Check if medicine is registered (simple boolean check)
   * @param {string} hash - The medicine hash (hex string)
   * @returns {Promise<boolean>} True if registered
   */
  async isMedicineRegistered(hash) {
    try {
      if (!this.contract) {
        await this.initialize();
      }

      const cleanHash = hash.startsWith("0x") ? hash.slice(2) : hash;
      if (cleanHash.length !== 64) {
        return false;
      }
      const hashBytes32 = "0x" + cleanHash;
      return await this.contract.isMedicineRegistered(hashBytes32);
    } catch (error) {
      console.error("Error checking medicine registration:", error);
      return false;
    }
  }
}

// Export singleton instance
export default new BlockchainService();

