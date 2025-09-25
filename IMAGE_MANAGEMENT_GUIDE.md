# Image Management System Guide

## Overview

The JCMS Image Management System provides comprehensive image handling with Cloudflare R2 integration for public storage. This system allows users to upload, manage, and publish images with full metadata tracking and security controls.

## Features

### 🖼️ **Image Upload & Processing**
- **Multi-format Support**: WebP, AVIF, JPEG, PNG, GIF, TIFF, BMP
- **Automatic Processing**: Smart compression and format optimization
- **Metadata Extraction**: Dimensions, color space, file size, aspect ratio
- **Bulk Upload**: Upload up to 10 images simultaneously
- **Quality Control**: Adjustable compression settings (10-100%)

### 🔒 **Privacy & Security**
- **Private by Default**: All images start as private
- **Tenant Isolation**: Multi-tenant architecture with data separation
- **Role-based Access**: Different permissions for superadmin, admin, editor roles
- **Secure Storage**: Local storage with optional cloud backup

### ☁️ **Cloudflare R2 Integration**
- **Public Publishing**: One-click "Go Public" functionality
- **CDN Distribution**: Global content delivery through Cloudflare
- **Reversible**: Make images private again anytime
- **Public URLs**: Generate shareable download links
- **Automatic Cleanup**: Remove from R2 when made private

### 📊 **Analytics & Tracking**
- **Access Tracking**: Monitor image views and downloads
- **Storage Analytics**: Track total size, format distribution
- **Usage Statistics**: Recent uploads, most accessed images
- **Performance Metrics**: Compression ratios, file sizes

### 🏷️ **Organization**
- **Tagging System**: Categorize images with custom tags
- **Project Linking**: Associate images with content projects
- **Search & Filter**: Find images by name, tags, date, visibility
- **Bulk Operations**: Select multiple images for batch actions

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner mime-types
```

### 2. Configure Cloudflare R2 (Optional)

Add these environment variables to your `.env` file:

```env
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_DOMAIN=cdn.yourdomain.com  # Optional
```

#### Getting Cloudflare R2 Credentials:

1. **Create R2 Bucket**:
   - Go to Cloudflare Dashboard > R2 Object Storage
   - Create a new bucket for your images
   - Note the bucket name

2. **Generate API Token**:
   - Go to Cloudflare Dashboard > My Profile > API Tokens
   - Create a Custom Token with R2:Edit permissions
   - Note the Account ID, Access Key ID, and Secret Access Key

3. **Configure Public Access** (Optional):
   - Set up a custom domain for your R2 bucket
   - Configure DNS and SSL settings
   - Add the domain to `CLOUDFLARE_R2_PUBLIC_DOMAIN`

### 3. Create Required Directories

The system will automatically create these directories, but you can create them manually:

```bash
mkdir -p backend/temp
mkdir -p backend/uploads
```

### 4. Database Migration

The enhanced image model includes new fields. Existing images will work but won't have the new metadata fields populated until they're re-processed.

## API Endpoints

### Image Management Routes (`/api/image-management`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload multiple images |
| `GET` | `/content-page` | Get images for content management |
| `GET` | `/analytics` | Get image analytics and statistics |
| `GET` | `/:id` | Get individual image details |
| `PATCH` | `/:id/metadata` | Update image metadata |
| `POST` | `/make-public` | Make selected images public |
| `POST` | `/make-private` | Make selected images private |
| `DELETE` | `/bulk-delete` | Delete multiple images |
| `GET` | `/system/r2-status` | Check Cloudflare R2 configuration |

### Example API Usage

#### Upload Images
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
formData.append('tags', JSON.stringify(['product', 'banner']));
formData.append('format', 'webp');
formData.append('quality', '80');

const response = await fetch('/api/image-management/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

#### Make Images Public
```javascript
const response = await fetch('/api/image-management/make-public', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageIds: ['image1_id', 'image2_id']
  })
});
```

## Frontend Components

### ImageContentManager Component

The main component provides a complete image management interface:

```jsx
import ImageContentManager from '../components/ImageContentManager.jsx';

function ContentPage() {
  return (
    <Layout>
      <ImageContentManager />
    </Layout>
  );
}
```

### Key Features:
- **Grid View**: Visual thumbnail grid with selection
- **Upload Modal**: Drag-and-drop file upload with metadata
- **Bulk Actions**: Select multiple images for batch operations
- **Filtering**: Search, filter by visibility, tags, date range
- **Analytics Panel**: Toggle-able statistics overview
- **Public URL Display**: Copy-able public download links

## Usage Workflow

### 1. Upload Images
1. Click "Upload Images" button
2. Select one or more image files
3. Optionally add title, tags, and notes
4. Choose format and quality settings
5. Click "Upload Images"

### 2. Manage Images
1. Use filters to find specific images
2. Select images using checkboxes
3. Use bulk actions for operations:
   - **Go Public**: Upload to Cloudflare R2 and generate public URLs
   - **Make Private**: Remove from R2 and make private
   - **Delete**: Permanently remove images

### 3. Share Public Images
1. Select images and click "Go Public"
2. Copy the generated public URLs
3. Share URLs for direct download/viewing
4. URLs remain active until images are made private

## Security Considerations

### Access Control
- **Tenant Isolation**: Users can only access images from their tenant
- **Role Permissions**: Different access levels based on user roles
- **Private by Default**: Images are not publicly accessible until explicitly published

### Data Protection
- **Secure Upload**: File type validation and size limits
- **Path Sanitization**: Prevent directory traversal attacks
- **Token Authentication**: All API endpoints require valid JWT tokens

### Cloudflare R2 Security
- **API Key Management**: Store credentials securely in environment variables
- **Bucket Permissions**: Configure R2 bucket with appropriate access controls
- **Public URL Control**: Only generate public URLs when explicitly requested

## Troubleshooting

### Common Issues

1. **"Cloudflare R2 is not configured"**
   - Check environment variables are set correctly
   - Verify R2 credentials have proper permissions
   - Ensure bucket exists and is accessible

2. **Upload Fails**
   - Check file size limits (50MB per file, 10 files max)
   - Verify file types are supported
   - Ensure temp directory exists and is writable

3. **Images Not Displaying**
   - Check file paths and permissions
   - Verify uploads directory is accessible
   - Check CORS configuration for image serving

4. **Public URLs Not Working**
   - Verify R2 bucket is configured for public access
   - Check custom domain DNS settings if using CLOUDFLARE_R2_PUBLIC_DOMAIN
   - Ensure images were successfully uploaded to R2

### Debug Information

Check the system status:
```bash
GET /api/image-management/system/r2-status
```

View server logs for detailed error information:
```bash
tail -f backend/logs/app.log
```

## Performance Optimization

### Image Processing
- **WebP Format**: Use WebP for best compression (default)
- **AVIF Format**: Use AVIF for smallest file sizes (newer browsers)
- **Quality Settings**: Adjust quality based on use case (80% recommended)

### Cloudflare R2
- **Custom Domain**: Use custom domain for better performance and branding
- **CDN Caching**: Leverage Cloudflare's global CDN for fast delivery
- **Batch Operations**: Upload multiple images in single operations when possible

### Database
- **Indexes**: Optimized indexes for common queries (user, tenant, visibility)
- **Pagination**: Use pagination for large image collections
- **Lean Queries**: Use lean() for better performance when full documents aren't needed

## Migration Guide

### From Existing Image System

If you have existing images in the old format:

1. **Backup**: Create a backup of your current images and database
2. **Update Model**: The new model is backward compatible
3. **Re-process**: Optionally re-upload images to populate new metadata fields
4. **Test**: Verify existing functionality still works

### Database Schema Changes

New fields added to Image model:
- `filename`: Original filename
- `project`: Link to content/project
- `visibility`: 'private' or 'public'
- `cloudflareUrl`: Public R2 URL
- `cloudflareKey`: R2 object key
- `metadata`: Enhanced metadata object
- `tags`: Array of tags
- `accessCount`: View tracking
- `versions`: Version history

## Support

For issues or questions:
1. Check this guide and troubleshooting section
2. Review server logs for error details
3. Verify environment configuration
4. Test with minimal setup to isolate issues

## License

This image management system is part of the JCMS project and follows the same licensing terms.
