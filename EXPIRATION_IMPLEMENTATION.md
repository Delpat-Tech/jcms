# File Expiration Implementation Summary

## Overview
Implemented subscription-based file expiration system where free users' files are automatically deleted after 15 days, while premium users keep files permanently.

## Frontend Changes

### 1. FileCard Component (`src/components/media/FileCard.jsx`)
- **Enhanced expiration display**: Shows precise days left instead of just expiration date
- **Color-coded warnings**: 
  - Red: Expired files
  - Orange: 1-3 days left
  - Yellow: 4-7 days left  
  - Blue: More than 7 days left
- **Premium user handling**: Hides expiration info for confirmed premium users
- **Improved text**: Shows "X days left" instead of full date

### 2. Media Dashboard (`src/components/media/EnhancedMediaDashboard.jsx`)
- **Expiration warning banner**: Shows total files expiring in next 7 days for free users
- **Subscription-aware**: Only shows warnings for non-premium users
- **Auto-refresh**: Fetches expiring files count on load

### 3. API Integration (`src/api.js`)
- **Cleanup API**: Added endpoints for getting expiring files and cleanup status

## Backend Changes

### 1. File Upload Controllers
- **File Controller** (`src/controllers/fileController.js`): Sets `expiresAt` date for free users
- **Image Controller** (`src/controllers/imageController.js`): 
  - Added file size limit checks
  - Sets expiration dates for free users
  - Added missing `filename` field

### 2. Route Middleware
- **Image Routes** (`src/routes/imageRoutes.js`): Added subscription limits middleware
- **File Routes**: Already had subscription limits middleware

### 3. Cleanup System
- **Service** (`src/services/fileCleanupService.js`): Handles expired file deletion
- **Job** (`src/jobs/fileCleanupJob.js`): Runs daily at 2 AM
- **Controller** (`src/controllers/cleanupController.js`): API endpoints for cleanup management

### 4. Database Models
- **File Model**: Already had `expiresAt` and `isExpired` fields with indexes
- **Image Model**: Already had expiration fields with indexes

## Key Features

### 1. Subscription-Based Expiration
- **Free users**: Files expire after 15 days
- **Premium users**: Files stored permanently
- **Automatic detection**: Uses subscription status to determine behavior

### 2. Visual Indicators
- **Days countdown**: Shows exact days remaining
- **Color coding**: Visual urgency indicators
- **Warning banners**: Dashboard-level notifications

### 3. Cleanup System
- **Automated**: Daily cleanup job at 2 AM
- **Manual trigger**: Superadmin can run cleanup manually
- **Safe deletion**: Removes both database records and physical files

### 4. API Endpoints
- `GET /api/cleanup/status` - Get cleanup job status
- `POST /api/cleanup/run` - Run manual cleanup (superadmin only)
- `GET /api/cleanup/expiring?days=7` - Get files expiring soon

## Testing
- Created test script (`test-expiration.js`) to verify functionality
- Tests file creation, expiration, and cleanup process

## Configuration
- Expiration period: 15 days (configurable in `subscriptionLimits.js`)
- Cleanup schedule: Daily at 2 AM (configurable in `fileCleanupJob.js`)
- File size limits: 10MB free, 100MB premium

## Security
- Tenant isolation: Users only see their own tenant's files
- Role-based access: Admins can see all tenant files, editors only their own
- Safe file deletion: Proper path sanitization and error handling