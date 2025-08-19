Work Completed Till Now

Server Setup
Created server.js using Express.
Added middleware: express.json, cors.
Implemented health check route:
GET /api/health → { "status": "ok", "message": "Server is running" }


Image Schema
Basic schema: title, subtitle, filePath.
Extended schema: Added width, height, format, tenant, section.
Added Timestamps

Seeder Utility
Created utils/seedImage.js for inserting test image data into MongoDB.
Debugged validation errors for required fields.
Verified DB connectivity by inserting dummy images.
