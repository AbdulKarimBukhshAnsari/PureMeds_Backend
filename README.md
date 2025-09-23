# PureMeds Backend

A small, focused backend for PureMeds — a simple online pharmacy API to manage products, uploads, and customer/admin actions with the integration of Block Chain .

## Idea
PureMeds is an e-commerce backend that serves product data and supports admin operations and customer-facing endpoints. The goal is a lightweight, easy-to-extend API that handles product CRUD, image uploads, and consistent API responses and errors.

## What's in this project
- REST API endpoints for admin and customer operations
- Product model and controllers
- Image upload handling (multer middleware + Cloudinary helper)
- Centralized error and response helpers for consistent output
- Simple folder structure: routes, controllers, models, services, middlewares, utils

## Main features
- Product creation, update, delete and listing
- Image upload and management via Cloudinary helper
- Structured API responses and error handling
- Async handler wrapper for controllers

## Tech
- Node.js + Express
- MongoDB with Mongoose (adjust if you use a different DB)
- Multer for file uploads and Cloudinary for hosting images

If your stack differs, update the tech section accordingly.

## Quick start
1. Install dependencies

```powershell
npm install
```

2. Add environment variables (example)

- MONGO_URI — MongoDB connection string
- PORT — server port (optional)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — for image uploads

3. Run the app

```powershell
npm run dev    # if you have nodemon / a dev script
# or
npm start
```

## Notes
- This README is intentionally short. Add sections for authentication, tests, or deployment when you expand the project.
- Update environment names and scripts to match your `package.json`.

Contributions and tweaks are welcome — keep it small and maintainable.