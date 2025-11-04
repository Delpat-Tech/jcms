# JCMS API Documentation

Complete REST API reference for the JCMS Content Management System

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Quick Start](#quick-start)
- [Authentication Endpoints](#authentication-endpoints)
- [User Management](#user-management)
- [Content Management](#content-management)
- [Image Management](#image-management)
- [File Management](#file-management)
- [Tenant Management](#tenant-management)
- [Analytics](#analytics)
- [Notifications](#notifications)
- [Subscriptions](#subscriptions)
- [Error Codes](#error-codes)

---

## Overview

**Base URL:** `http://localhost:5000/api`  
**Demo Base URL:** `https://mockapi.dev/jcms/v1`

The JCMS API provides a comprehensive content management system with:
- Role-based access control (SuperAdmin, Admin, Editor)
- Multi-tenant support
- JWT authentication
- File and image management
- Analytics and notifications
- Subscription management

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Default Credentials

After seeding the database:

- **SuperAdmin:** `superadmin` / `admin123`
- **Admin:** `dev_admin` / `dev123`
- **Editor:** `test_editor` / `test123`

---

## Quick Start

### 1. Login to get token

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "admin123"}'
```

### 2. Use token in requests

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure123",
  "role": "editor"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "editor",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "email": "john@example.com", "password": "secure123", "role": "editor"}'
```

**JavaScript:**
```javascript
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'secure123',
    role: 'editor'
  })
}).then(res => res.json()).then(data => console.log(data));
```

**Python:**
```python
import requests
response = requests.post('http://localhost:5000/api/auth/register',
  json={'username': 'john_doe', 'email': 'john@example.com', 'password': 'secure123', 'role': 'editor'})
print(response.json())
```

---

### POST /api/auth/login

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "username": "superadmin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "678c9b7b2201c52b170dc067",
    "username": "superadmin",
    "email": "superadmin@jcms.com",
    "role": "superadmin",
    "isActive": true
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "admin123"}'
```

---

### GET /api/auth/me

Get current authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "678c9b7b2201c52b170dc067",
    "username": "superadmin",
    "email": "superadmin@jcms.com",
    "role": "superadmin",
    "isActive": true,
    "tenant": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**cURL:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## User Management

**Required Role:** Admin or SuperAdmin

### POST /api/users

Create a new user with specific role.

**Request Body:**
```json
{
  "username": "new_editor",
  "email": "editor@example.com",
  "password": "secure123",
  "role": "editor",
  "tenant": "optional_tenant_id"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "678c9b7b2201c52b170dc068",
    "username": "new_editor",
    "email": "editor@example.com",
    "role": "editor",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/users

List all users (filtered by role).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `role` (string): Filter by role
- `isActive` (boolean): Filter by active status

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "_id": "678c9b7b2201c52b170dc067",
      "username": "superadmin",
      "email": "superadmin@jcms.com",
      "role": "superadmin",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 2
  }
}
```

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### GET /api/users/:userId

Get specific user by ID.

**Response (200):**
```json
{
  "success": true,
  "user": {
    "_id": "678c9b7b2201c52b170dc067",
    "username": "superadmin",
    "email": "superadmin@jcms.com",
    "role": "superadmin",
    "isActive": true,
    "tenant": null,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT /api/users/:userId

Update user information.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "_id": "678c9b7b2201c52b170dc068",
    "username": "new_editor",
    "email": "newemail@example.com",
    "role": "editor",
    "isActive": true
  }
}
```

---

### DELETE /api/users/:userId

Soft delete user (sets isActive to false).

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Content Management

**Required Role:** Editor or above

### POST /api/content

Create new content.

**Request Body:**
```json
{
  "title": "My First Article",
  "body": "This is the content body...",
  "status": "draft",
  "category": "blog",
  "tags": ["tutorial", "javascript"]
}
```

**Response (201):**
```json
{
  "success": true,
  "content": {
    "_id": "678c9b7b2201c52b170dc069",
    "title": "My First Article",
    "body": "This is the content body...",
    "status": "draft",
    "category": "blog",
    "tags": ["tutorial", "javascript"],
    "author": "678c9b7b2201c52b170dc067",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### GET /api/content

List all content with pagination.

**Query Parameters:**
- `page`, `limit`, `status`, `category`

**Response (200):**
```json
{
  "success": true,
  "content": [
    {
      "_id": "678c9b7b2201c52b170dc069",
      "title": "My First Article",
      "status": "published",
      "author": {
        "_id": "678c9b7b2201c52b170dc067",
        "username": "superadmin"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

---

### GET /api/content/:id

Get specific content item.

**Response (200):**
```json
{
  "success": true,
  "content": {
    "_id": "678c9b7b2201c52b170dc069",
    "title": "My First Article",
    "body": "This is the content body...",
    "status": "published",
    "category": "blog",
    "tags": ["tutorial", "javascript"],
    "author": {
      "_id": "678c9b7b2201c52b170dc067",
      "username": "superadmin"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### PUT /api/content/:id

Update content.

**Request Body:**
```json
{
  "title": "Updated Article Title",
  "body": "Updated content body..."
}
```

---

### POST /api/content/:id/publish

Publish draft content.

**Response (200):**
```json
{
  "success": true,
  "message": "Content published successfully",
  "content": {
    "_id": "678c9b7b2201c52b170dc069",
    "status": "published",
    "publishedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

## Image Management

### POST /api/images

Upload image file.

**Request (multipart/form-data):**
- `image` (file): Image file
- `title` (string): Image title
- `alt` (string): Alt text
- `tags` (array): Tags

**Response (201):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "image": {
    "_id": "678c9b7b2201c52b170dc070",
    "filename": "image-1737024000000.jpg",
    "title": "My Image",
    "mimeType": "image/jpeg",
    "size": 245678,
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "url": "/uploads/system/690061c2969a396e92040dac/image-1737024000000.jpg"
  }
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "title=My Image"
```

---

### GET /api/images

List all images.

**Query Parameters:** `page`, `limit`, `search`

---

### GET /api/images/:id

Get image details.

---

### POST /api/images/process/:id/sizes

Generate multiple sizes for image.

**Response (200):**
```json
{
  "success": true,
  "message": "Image sizes generated successfully",
  "sizes": {
    "thumbnail": {
      "width": 150,
      "height": 150,
      "url": "/uploads/.../image-thumbnail.jpg"
    },
    "medium": {
      "width": 640,
      "height": 360,
      "url": "/uploads/.../image-medium.jpg"
    }
  }
}
```

---

## File Management

### POST /api/files/upload

Upload file(s).

**Request (multipart/form-data):**
- `file` or `files`: File(s) to upload

**Response (201):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "files": [
    {
      "_id": "678c9b7b2201c52b170dc071",
      "filename": "document-1737024000000.pdf",
      "mimeType": "application/pdf",
      "size": 1245678,
      "url": "/uploads/.../document.pdf"
    }
  ]
}
```

---

### GET /api/files

List all files.

---

## Tenant Management

**Required Role:** SuperAdmin

### POST /api/tenants

Create tenant with admin.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "domain": "acme.example.com",
  "adminUsername": "acme_admin",
  "adminEmail": "admin@acme.com",
  "adminPassword": "secure123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tenant and admin created successfully",
  "tenant": {
    "_id": "678c9b7b2201c52b170dc072",
    "name": "Acme Corp",
    "domain": "acme.example.com",
    "isActive": true
  },
  "admin": {
    "_id": "678c9b7b2201c52b170dc073",
    "username": "acme_admin",
    "role": "admin"
  }
}
```

---

### GET /api/tenants

List all tenants.

---

## Analytics

**Required Role:** Admin or SuperAdmin

### GET /api/analytics/dashboard

Get dashboard statistics.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 150,
      "active": 142,
      "new": 12
    },
    "content": {
      "total": 450,
      "published": 380,
      "draft": 70
    },
    "images": {
      "total": 1250,
      "size": 5242880000
    }
  }
}
```

---

### GET /api/analytics/users

User activity analytics.

**Query Parameters:** `startDate`, `endDate`

---

## Notifications

**Required Role:** Admin or SuperAdmin

### GET /api/notifications

List notifications.

**Query Parameters:** `page`, `limit`, `status`

---

### GET /api/notifications/unread

Get unread notifications.

---

### PATCH /api/notifications/:id/read

Mark notification as read.

---

## Subscriptions

### POST /api/subscriptions/create-order

Create subscription order.

**Request Body:**
```json
{
  "planType": "monthly",
  "tenantId": "678c9b7b2201c52b170dc072"
}
```

---

### GET /api/subscriptions/status

Get subscription status.

---

### DELETE /api/subscriptions/cancel

Cancel subscription.

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Interactive Documentation

For interactive API testing, open `api-part1.html` in your browser.

**Try It Links:**
- [Swagger UI Style Documentation](./api-part1.html)
- [Postman Collection](../JCMS-Updated-Collection.postman_collection.json)

---

**Version:** 1.0.0  
**Last Updated:** January 2025
