# JCMS API Documentation

Welcome to the JCMS API documentation! This directory contains comprehensive API reference materials.

## 📚 Available Documentation

### 1. **Interactive HTML Documentation** (Recommended)
- **Files:** 
  - `api-part1.html` - Authentication endpoints
  - `api-part2-complete.html` - Users & Content Management
  - `api-part3-complete.html` - Images, Files, Analytics & Notifications
- **Features:**
  - Beautiful Swagger-like UI
  - Collapsible endpoints
  - Code examples in cURL, JavaScript, and Python
  - **WORKING "Try It Out" buttons** - Makes real API calls!
  - Organized sidebar navigation
  - Token persistence across pages
- **How to use:** Open `api-part1.html` in your web browser

### 2. **Complete Markdown Reference**
- **File:** `API-DOCUMENTATION.md`
- **Features:**
  - Complete endpoint reference
  - Request/response examples
  - Code snippets in multiple languages
  - Easy to read and search
- **How to use:** View in any Markdown viewer or GitHub

### 3. **Legacy HTML Sections** (Static)
- `api-part2.html` - User and Content Management (static examples)
- `api-part3.html` - Images, Files, Tenants, Analytics (static examples)

## 🚀 Quick Start

1. **Start your backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Open the interactive documentation:**
   - Double-click `api-part1.html` to start
   - Login with default credentials to get a token
   - Navigate to other pages using sidebar links
   - Token is automatically saved and shared across all pages

3. **Login to get a token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "superadmin", "password": "admin123"}'
   ```

4. **Use the token in API requests:**
   ```bash
   curl -X GET http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

## 🔑 Default Credentials

After seeding the database:

- **SuperAdmin:** `superadmin` / `admin123`
- **Admin:** `dev_admin` / `dev123`
- **Editor:** `test_editor` / `test123`

## 📖 API Categories

### Authentication
- Register user
- Login
- Get current user

### User Management (Admin+)
- Create user
- List users
- Get user
- Update user
- Delete user

### Content Management (Editor+)
- Create content
- List content
- Get content
- Update content
- Publish content

### Image Management
- Upload image
- List images
- Get image
- Process image sizes

### File Management
- Upload files
- List files
- Get file
- Delete file

### Tenant Management (SuperAdmin)
- Create tenant
- List tenants
- Get tenant
- Update tenant

### Analytics (Admin+)
- Dashboard stats
- User activity
- System health
- Content insights

### Notifications (Admin+)
- List notifications
- Get unread
- Mark as read

### Subscriptions
- Create order
- Get status
- Cancel subscription

## 🌐 Base URLs

- **Local Development:** `http://localhost:5000/api`
- **Demo/Mock:** `https://mockapi.dev/jcms/v1`

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📝 Example Request

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "admin123"}'

# Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "superadmin",
    "role": "superadmin"
  }
}

# Use token
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🛠️ Testing Tools

### Postman Collections
Located in the backend root directory:
- `JCMS-Updated-Collection.postman_collection.json`
- `Enhanced-Tenant-Management.postman_collection.json`
- `Analytics_Notifications_Test.postman_collection.json`

### Import to Postman:
1. Open Postman
2. Click Import
3. Select the JSON file
4. Start testing!

## 📊 Response Format

All API responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

## 🎯 Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## 💡 Tips

1. **Use the interactive HTML docs** for the best experience
2. **Login first** - Click "Try It Out" on the login endpoint to get a token
3. **Token is saved** - Your token persists across page refreshes and navigation
4. **Check role requirements** - Some endpoints require Admin/SuperAdmin roles
5. **File uploads work** - Select files using the file input before clicking "Try It Out"
6. **Real API calls** - All "Try It Out" buttons make actual requests to your backend
7. **Backend must be running** - Ensure your server is running on http://localhost:5000

## 🔗 Additional Resources

- [Main README](../README.md)
- [Postman Testing Guide](../POSTMAN-TESTING-GUIDE.md)
- [SuperAdmin Guide](../SUPERADMIN.md)

## 📞 Support

For issues or questions:
1. Check the documentation first
2. Review the Postman collections
3. Check the backend logs
4. Contact the development team

---

**Version:** 1.0.0  
**Last Updated:** January 2025  
**Maintained by:** JCMS Development Team
