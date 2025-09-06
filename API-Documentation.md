# JCMS API Documentation

## Overview
JCMS (Content Management System) provides a RESTful API with role-based access control for user and image management.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Roles & Permissions

### SuperAdmin (Single Instance)
- **Users**: Create/delete `[admin, editor, viewer]` (cannot create another superadmin)
- **Images**: Full CRUD access to ALL images from ANY user
- **Special**: Only one superadmin allowed (credentials from .env)

### Admin
- **Users**: Create/delete `[editor, viewer]` (cannot create/delete admin or superadmin)
- **Images**: 
  - **View**: Own + admin + editor + viewer images (NOT superadmin)
  - **CRUD**: Own + editor + viewer images (CANNOT modify other admin or superadmin)

### Editor/Viewer
- **Images**: Can only access their own images
- **Users**: No user management permissions

## API Endpoints

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Authentication

#### Login
```http
POST /auth/login
```
**Body:**
```json
{
  "email": "admin@system.com",
  "password": "admin123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "superadmin",
    "email": "admin@system.com",
    "role": "superadmin"
  }
}
```

### User Management

#### Get All Users
```http
GET /users
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "_id": "user-id",
      "username": "john_admin",
      "email": "john@example.com",
      "role": {
        "name": "admin",
        "description": "System Administrator"
      },
      "isActive": true,
      "createdAt": "2025-01-06T10:00:00.000Z"
    }
  ]
}
```

#### Get User by ID
```http
GET /users/{userId}
```
**Headers:** `Authorization: Bearer <token>`

#### Create User
```http
POST /users
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "password123",
  "role": "editor"
}
```

**Valid Roles by User Type:**
- **SuperAdmin**: `admin`, `editor`, `viewer`
- **Admin**: `editor`, `viewer`

#### Update User
```http
PUT /users/{userId}
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "updated_username",
  "role": "editor",
  "isActive": true
}
```

#### Delete User
```http
DELETE /users/{userId}
```
**Headers:** `Authorization: Bearer <token>`

**Restrictions:**
- Admin cannot delete other admins or superadmin
- SuperAdmin cannot delete other superadmins

### Image Management (Admin/SuperAdmin)

#### Upload Image
```http
POST /admin-images
```
**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data`
- `image`: Image file (JPG, PNG, WEBP, etc.)
- `title`: Image title
- `format`: Output format (webp, avif, jpeg, png, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "image-id",
    "title": "My Image",
    "user": "user-id",
    "format": "webp",
    "fileUrl": "http://localhost:5000/uploads/user-id/image.webp",
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

#### Get All Images
```http
GET /admin-images
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `own=true`: Get only current user's images

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "image-id",
      "title": "Image Title",
      "user": "user-id",
      "format": "webp",
      "fileUrl": "http://localhost:5000/uploads/user-id/image.webp"
    }
  ],
  "filter": "all_allowed"
}
```

#### Get Image by ID
```http
GET /admin-images/{imageId}
```
**Headers:** `Authorization: Bearer <token>`

#### Update Image
```http
PUT /admin-images/{imageId}
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Updated Title"
}
```

#### Patch Image (Format Conversion)
```http
PATCH /admin-images/{imageId}
```
**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "New Title",
  "format": "avif",
  "notes": {
    "description": "Converted to AVIF"
  }
}
```

#### Delete Image
```http
DELETE /admin-images/{imageId}
```
**Headers:** `Authorization: Bearer <token>`

### Image Management (Editor/Viewer)

#### Upload Image (Editor)
```http
POST /images
```
**Headers:** `Authorization: Bearer <token>`

**Body:** `multipart/form-data`
- `image`: Image file
- `title`: Image title

#### Get Images (Editor)
```http
GET /images
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `own=true`: Get only own images (default behavior for editors)

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid role. You can only create: editor, viewer"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. You cannot modify images uploaded by other admins."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Detailed error message"
}
```

## Permission Matrix

| Action | SuperAdmin | Admin | Editor | Viewer |
|--------|------------|-------|--------|--------|
| Create SuperAdmin | ❌ | ❌ | ❌ | ❌ |
| Create Admin | ✅ | ❌ | ❌ | ❌ |
| Create Editor | ✅ | ✅ | ❌ | ❌ |
| Delete Admin | ✅ | ❌ | ❌ | ❌ |
| Delete Editor | ✅ | ✅ | ❌ | ❌ |
| View All Images | ✅ | ✅* | ❌ | ❌ |
| Modify Any Image | ✅ | ❌ | ❌ | ❌ |
| Modify Editor Images | ✅ | ✅ | ❌ | ❌ |
| Modify Own Images | ✅ | ✅ | ✅ | ✅ |

*Admin can view all except SuperAdmin images

## Sample Credentials

### SuperAdmin
- Email: `admin@system.com`
- Password: `admin123`

### Admin
- Email: `dev.admin@test.com`
- Password: `dev123`

### Editor
- Email: `testeditor@test.com`
- Password: `test123`

## Testing

Run the API test suite:
```bash
node api-test-simple.js
```

Import the Postman collection:
```
JCMS-API-Collection.postman_collection.json
```

## Security Features

1. **Single SuperAdmin**: Only one superadmin allowed (from .env)
2. **Role Hierarchy**: Strict role-based permissions
3. **JWT Authentication**: Secure token-based auth
4. **Input Validation**: Request validation and sanitization
5. **File Upload Security**: Type and size restrictions
6. **Access Control**: Resource-level permissions