# Blockchain Integration Guide

This document explains how the blockchain integration works in the PureMeds backend.

## Overview

The PureMeds backend integrates with an Ethereum smart contract to track medicine authenticity. When a medicine is uploaded, a cryptographic hash is generated and stored both in the database and on the blockchain.

## Architecture

```
Admin Uploads Medicine
    ↓
Generate Hash (from batchId, manufacturer, expiryDate, productName)
    ↓
Generate QR Code (from hash)
    ↓
Upload Images to Cloudinary (product image + QR code)
    ↓
Save to Database (with hash and QR code URL)
    ↓
Register Hash on Blockchain
```

## Components

### 1. Hash Generation (`src/utils/hashGenerator.js`)

Generates a SHA256 hash from medicine data:
- Batch ID
- Manufacturer
- Expiry Date
- Product Name

**Usage:**
```javascript
import { generateMedicineHash } from "../utils/hashGenerator.js";

const hash = generateMedicineHash(batchId, manufacturer, expiryDate, productName);
```

### 2. QR Code Generation (`src/utils/qrCodeGenerator.js`)

Creates a QR code image containing:
- Hash
- Batch ID
- Timestamp

**Usage:**
```javascript
import { generateQRCode } from "../utils/qrCodeGenerator.js";

const qrCodePath = await generateQRCode(hash, batchId);
```

### 3. Blockchain Service (`src/services/blockchain.service.js`)

Handles all blockchain interactions:
- Initialize connection
- Register medicine hash
- Verify medicine hash

**Configuration:**
Add to your `.env` file:
```
CONTRACT_ADDRESS=0x... (from contract deployment)
PRIVATE_KEY=your_wallet_private_key
RPC_URL=http://127.0.0.1:8545 (or your network RPC)
```

## API Endpoints

### Admin: Upload Medicine

**POST** `/api/admin/uploadproducts`

**Request:**
- Form data with `productImage` file
- Body fields: `productName`, `chemicalName`, `manufacturer`, `price`, `purpose`, `sideEffects`, `category`, `availableStock`, `batchId`, `expiryDate`

**Response:**
```json
{
  "data": {
    "productName": "...",
    "hash": "abc123...",
    "qrCode": "https://cloudinary.com/...",
    "blockchainTx": {
      "success": true,
      "txHash": "0x...",
      "blockNumber": 12345
    }
  }
}
```

### Customer: Verify Medicine by QR Code

**POST** `/api/customer/verify/qrcode`

**Request:**
- Form data with `qrCode` image file

**Response (Valid Medicine):**
```json
{
  "data": {
    "isValid": true,
    "isDistributedByPureMeds": true,
    "isExpired": false,
    "daysUntilExpiry": 120,
    "product": {
      "productName": "...",
      "batchId": "PM-12345",
      "expiryDate": "2025-12-31"
    },
    "blockchainVerification": {
      "isValid": true,
      "batchId": "PM-12345"
    }
  }
}
```

**Response (Invalid Medicine):**
```json
{
  "data": {
    "isValid": false,
    "isDistributedByPureMeds": false,
    "message": "This medicine is not distributed by PureMeds..."
  }
}
```

### Customer: Verify Medicine by Hash

**POST** `/api/customer/verify/hash`

**Request:**
```json
{
  "hash": "abc123..."
}
```

**Response:** Same as QR code verification

## Database Schema Updates

The `Product` model now includes:
- `hash`: String (unique, indexed) - Cryptographic hash
- `qrCode`: String (required) - URL to QR code image on Cloudinary

## Environment Variables

Add these to your `.env` file:

```env
# Blockchain Configuration
CONTRACT_ADDRESS=0xYourContractAddress
PRIVATE_KEY=your_wallet_private_key_here
RPC_URL=http://127.0.0.1:8545

# Cloudinary (already configured)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Setup Instructions

### 1. Deploy Smart Contract

See `Pure_Meds_BlockChain/README.md` for contract deployment instructions.

### 2. Install Dependencies

```bash
npm install ethers html5-qrcode
```

### 3. Configure Environment

Update `.env` with contract address and wallet details.

### 4. Test Integration

1. Upload a medicine through admin panel
2. Check that hash and QR code are generated
3. Verify blockchain transaction in your network explorer
4. Test verification endpoint with the QR code

## Error Handling

- **Blockchain Offline**: If blockchain is unavailable, medicine is still saved to database. Blockchain registration will fail gracefully.
- **QR Code Generation Failure**: Upload will fail if QR code cannot be generated.
- **Cloudinary Upload Failure**: Upload will fail if images cannot be uploaded.

## Security Considerations

1. **Private Key**: Never commit private keys. Use environment variables.
2. **Hash Uniqueness**: Each hash must be unique. The system checks for duplicates.
3. **Blockchain Gas**: Ensure wallet has sufficient funds for transactions.
4. **Network**: Use testnets for development, mainnet for production.

## Troubleshooting

### Blockchain Connection Failed
- Check RPC_URL is correct
- Ensure Hardhat node is running (for local)
- Verify network connectivity

### Transaction Failed
- Check wallet has sufficient balance
- Verify contract address is correct
- Check contract owner permissions

### QR Code Not Generated
- Check `qrcode` package is installed
- Verify `public/temp` directory exists and is writable
- Check file permissions

## Testing

Test the integration:

```bash
# Start backend
npm run dev

# In another terminal, test upload
curl -X POST http://localhost:PORT/api/admin/uploadproducts \
  -F "productImage=@image.jpg" \
  -F "productName=Test" \
  -F "batchId=PM-12345" \
  ...

# Test verification
curl -X POST http://localhost:PORT/api/customer/verify/qrcode \
  -F "qrCode=@qrcode.png"
```

## Future Enhancements

- Batch registration for multiple medicines
- Supply chain tracking
- Expiry date alerts
- Counterfeit detection analytics

