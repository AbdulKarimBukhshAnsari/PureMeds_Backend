# PureMeds Backend

A robust RESTful API backend for the PureMeds e-pharmacy platform, built with Node.js and Express. This backend handles product management, order processing, payment integration, medicine verification, and blockchain integration.

## Overview

PureMeds Backend is a comprehensive API server that provides:
- RESTful API endpoints for admin and customer operations
- Product and medicine management with image uploads
- Order processing and payment integration (Stripe)
- Medicine verification with blockchain integration
- Supply chain tracking
- Complaint and alert management
- Dashboard analytics

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Clerk** - Authentication middleware
- **Stripe** - Payment processing
- **Cloudinary** - Image hosting
- **Ethers.js** - Blockchain interaction
- **Multer** - File upload handling

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn
- Stripe account (for payments)
- Cloudinary account (for images)
- Clerk account (for authentication)
- Ethereum node or provider (for blockchain)

## Installation

1. **Clone the repository** (if not already done)
```bash
cd PureMeds_Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:5174

# Database
MONGO_URI=mongodb://localhost:27017/puremeds

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key

# Cloudinary (Image Upload)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (Payments)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Blockchain
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
RPC_URL=http://127.0.0.1:8545
```

4. **Start MongoDB**
```bash
# If using local MongoDB
mongod
```

5. **Start the server**
```bash
npm run dev    # Development mode with nodemon
# or
npm start      # Production mode
```

The server will run on **http://localhost:3000**

## Project Structure

```
src/
├── controllers/       # Business logic handlers
│   ├── medicine.controller.js
│   ├── order.controller.js
│   ├── payment.controller.js
│   ├── verification.controller.js
│   ├── complaint.controller.js
│   ├── dashboard.controller.js
│   └── supplyChain.controller.js
├── models/           # Mongoose schemas
│   ├── product.model.js
│   ├── order.model.js
│   ├── payment.model.js
│   ├── complaint.model.js
│   └── supplyChain.model.js
├── routes/           # API route definitions
│   ├── admin.route.js
│   ├── customer.route.js
│   └── payment.route.js
├── services/         # External service integrations
│   └── blockchain.service.js
├── middlewares/      # Express middlewares
│   ├── multer.middleware.js
│   └── auth.middleware.js
├── utils/            # Utility functions
│   ├── ApiError.js
│   ├── ApiResponse.js
│   ├── asyncHandler.js
│   ├── errorHandler.js
│   └── cloudinary.js
└── app.js            # Express app configuration
```

## API Endpoints

### Admin Routes (`/api/v1/admin`)

- `POST /uploadproducts` - Add new medicine
- `GET /products` - Get all products
- `DELETE /products/:id` - Delete product
- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id` - Update order status
- `GET /complaints` - Get all complaints
- `GET /complaints/:id` - Get complaint by ID
- `PUT /complaints/:id` - Update complaint status
- `GET /dashboard/overview` - Dashboard statistics
- `GET /dashboard/medicines` - Medicine statistics
- `GET /dashboard/orders` - Order statistics
- `GET /dashboard/complaints` - Complaint statistics
- `GET /dashboard/alerts` - Alert statistics

### Customer Routes (`/api/v1/customer`)

- `GET /featured-products` - Get featured products
- `GET /products` - Get products with filters
- `GET /products/:id` - Get product by ID
- `GET /products/category/:category` - Get products by category
- `GET /products/search/:name` - Search products
- `POST /orders` - Create new order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order by ID
- `DELETE /orders/:id` - Cancel order
- `POST /complaints` - Submit complaint
- `GET /complaints` - Get user complaints
- `GET /complaints/:id` - Get complaint by ID
- `DELETE /complaints/:id` - Delete complaint
- `POST /verify/qrcode` - Verify medicine by QR code
- `POST /verify/hash` - Verify medicine by hash
- `GET /supply-chain/batch/:batchId` - Get supply chain data

### Payment Routes (`/api/v1/payments`)

- `POST /create-checkout-session` - Create Stripe checkout session
- `GET /session-status` - Get session status
- `POST /create` - Create payment record
- `GET /order/:orderId` - Get payment by order ID
- `GET /user` - Get user payments

## Key Features

### 1. Medicine Management
- Add medicines with images
- Automatic hash generation
- QR code generation
- Blockchain registration
- Supply chain creation
- Stock management

### 2. Order Processing
- Order creation
- Status tracking
- Payment integration
- Order cancellation
- Admin remarks

### 3. Payment Integration
- Stripe checkout sessions
- Payment intent creation
- Payment status tracking
- COD support

### 4. Medicine Verification
- QR code verification
- Hash-based verification
- Blockchain verification
- Expiry date checking
- Supply chain validation

### 5. Complaint Management
- Complaint submission
- Status tracking
- Admin review
- CSV export

### 6. Dashboard Analytics
- Overview statistics
- Medicine analytics
- Order analytics
- Complaint analytics
- Alert monitoring

## Database Schema

See `ERD_DOCUMENTATION.md` for complete database schema and relationships.

### Main Collections:
- **Products** - Medicine/product information
- **Orders** - Customer orders
- **Payments** - Payment records
- **Complaints** - Customer complaints
- **SupplyChain** - Supply chain tracking

## Authentication

Authentication is handled by Clerk:
- JWT token validation via middleware
- User ID extraction from tokens
- Protected routes for admin and customer
- Role-based access control

## Error Handling

Centralized error handling:
- Custom `ApiError` class
- Consistent error responses
- Detailed error logging
- Development vs production error messages

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message"
}
```

## Environment Variables

Required environment variables:
- `PORT` - Server port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLOUDINARY_*` - Cloudinary credentials
- `STRIPE_SECRET_KEY` - Stripe secret key
- `CONTRACT_ADDRESS` - Blockchain contract address
- `PRIVATE_KEY` - Blockchain wallet private key
- `RPC_URL` - Blockchain RPC endpoint

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (if configured)

## Port Configuration

The backend server runs on port **3000** by default. Ensure this port is available and not blocked by firewall.

## API Testing

Use tools like Postman, Insomnia, or curl to test endpoints:

```bash
# Example: Get featured products
curl http://localhost:3000/api/v1/customer/featured-products

# Example: Create order (with auth token)
curl -X POST http://localhost:3000/api/v1/customer/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"products": [...], "customerInfo": {...}}'
```

## Database Setup

1. **Install MongoDB** (if using locally)
2. **Create database**: `puremeds`
3. **Collections** will be created automatically when first document is inserted

## Blockchain Setup

1. Deploy smart contract (see Pure_Meds_BlockChain README)
2. Set `CONTRACT_ADDRESS` in `.env`
3. Set `PRIVATE_KEY` for transaction signing
4. Set `RPC_URL` for network connection

## Security Considerations

- Environment variables for sensitive data
- Input validation on all endpoints
- SQL injection prevention (MongoDB)
- XSS protection
- CORS configuration
- Rate limiting (recommended for production)

## Contributing

1. Follow existing code structure
2. Use asyncHandler for async routes
3. Use ApiError for errors
4. Use ApiResponse for success responses
5. Add proper error handling
6. Document new endpoints

## Notes

- The server runs on port **3000** by default
- MongoDB must be running before starting the server
- All external services (Stripe, Cloudinary, Clerk, Blockchain) must be configured
- CORS is configured for frontend origins
- File uploads are limited to 16MB
