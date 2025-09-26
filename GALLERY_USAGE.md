# JCMS Image Gallery Usage Guide

## Overview
The JCMS Image Gallery is now accessible at the root URL (`/`) and provides a beautiful interface to view and download images with card-based layout.

## Features
✅ **Fixed "Cannot GET /" issue** - Root route now serves the image gallery
✅ **Beautiful card-based image gallery** - Modern, responsive design
✅ **Image view functionality** - Click to view images in full-screen modal
✅ **Download options** - Multiple size options for downloads
✅ **Authentication** - Secure login system
✅ **Responsive design** - Works on desktop and mobile

## How to Use

### 1. Access the Gallery
- Navigate to `http://localhost:5000/` (or your tunnel URL)
- You'll see the JCMS Image Gallery homepage

### 2. Login
Use the default superadmin credentials:
- **Email/Username**: `superadmin` (or check your .env file)
- **Password**: `admin123` (or check your .env file)

### 3. View Images
- Images are displayed in a responsive card grid
- Each card shows:
  - Image thumbnail
  - Title and description
  - Upload date and user
  - Hover overlay with quick actions

### 4. Image Actions
**View Full Size:**
- Click "View Full Size" button on any card
- Or hover over image and click "👁️ View" in overlay
- Image opens in full-screen modal
- Press Escape or click X to close

**Download Options:**
- Click "Download Options" button for multiple sizes:
  1. Original Size
  2. Large (1920x1080)
  3. Medium (800x600)
  4. Thumbnail (150x150)
- Or hover over image and click "⬇️ Download" for original

### 5. Navigation
- Responsive design adapts to screen size
- Smooth animations and hover effects
- Clean, modern interface

## Technical Details

### Routes Added
- `GET /` - Serves the image gallery HTML
- `GET /api/auth/me` - Get current user info
- Enhanced login to support both email and username

### API Endpoints Used
- `POST /api/auth/login` - User authentication
- `GET /api/images` - Fetch user's images
- `GET /api/images/:id/thumbnail` - Get thumbnail
- `GET /api/images/:id/medium` - Get medium size
- `GET /api/images/:id/large` - Get large size
- `GET /uploads/:filename` - Original image files

### Security
- All image operations require authentication
- JWT token-based security
- User can only see their own images (or all if admin)

## Troubleshooting

### Cannot Login
- Check if seeding ran successfully
- Verify .env file has correct credentials
- Default: username=`superadmin`, password=`admin123`

### Images Not Loading
- Ensure images exist in `/uploads` directory
- Check file permissions
- Verify database has image records

### Tunnel Issues
- If using Cloudflare tunnel, the gallery is now accessible at the tunnel URL
- No more "Cannot GET /" error

## Next Steps
- Upload images through the existing admin interface
- Images will automatically appear in the gallery
- Users can view and download in multiple formats
