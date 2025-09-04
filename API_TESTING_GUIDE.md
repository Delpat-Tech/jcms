# JCMS API Testing Guide

## 🚀 Quick Setup

### 1. **Seed Test Data**
```bash
cd jcms
node seed.js development
```

### 2. **Start Server**
```bash
npm start
```

### 3. **Import Postman Collection**
- Import `JCMS_API_Testing.postman_collection.json`
- Set base URL: `http://localhost:5000/api`

## 👥 Test Users Created by Seeding

| Role | Email | Password | Username |
|------|-------|----------|----------|
| **SuperAdmin** | admin@system.com | admin123 | superadmin |
| **Admin** | dev.admin@test.com | dev123 | dev_admin |
| **Editor** | editor@test.com | test123 | test_editor |
| **Viewer** | qa@test.com | test123 | qa_tester |

## 🧪 Test Scenarios

### **Authentication Tests**
- ✅ Login all roles
- ✅ Token generation
- ✅ Token validation

### **SuperAdmin Tests**
- ✅ Create admin users
- ✅ Create any role
- ✅ View all users
- ✅ Update any user
- ✅ Delete any user
- ✅ Access all images

### **Admin Tests**
- ✅ Create editor/viewer users
- ❌ Cannot create admin users
- ✅ View all users
- ✅ Update editor/viewer users
- ❌ Cannot update superadmin
- ✅ Access all images
- ✅ Delete any image

### **Editor Tests**
- ❌ Cannot create users
- ❌ Cannot access admin routes
- ✅ Upload images
- ✅ View own images
- ✅ Update own images
- ✅ Delete own images
- ❌ Cannot access other users' images

### **Viewer Tests**
- ❌ Cannot create users
- ❌ Cannot upload images
- ✅ View own images (if any)
- ❌ Cannot access other users' images
- ❌ Cannot modify anything

## 🔒 Security Validations

### **Image Ownership**
- Users can only access their own images
- Admin/SuperAdmin can access all images
- Proper 403 responses for unauthorized access

### **Role Hierarchy**
- SuperAdmin > Admin > Editor > Viewer
- Lower roles cannot escalate privileges
- Proper role-based route protection

### **API Endpoints Tested**

#### **Auth Routes**
- `POST /api/auth/login`

#### **SuperAdmin Routes**
- `POST /api/superadmin/users`
- `GET /api/superadmin/users`
- `GET /api/superadmin/users/:id`
- `PUT /api/superadmin/users/:id`
- `DELETE /api/superadmin/users/:id`

#### **Admin Routes**
- `POST /api/admin/users`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `POST /api/admin/images`
- `GET /api/admin/images`
- `GET /api/admin/images/:id`
- `PUT /api/admin/images/:id`
- `DELETE /api/admin/images/:id`

#### **Image Routes**
- `POST /api/images` (upload)
- `GET /api/images` (own images)
- `GET /api/images/:id`
- `PUT /api/images/:id`
- `PATCH /api/images/:id`
- `DELETE /api/images/:id`

## 📋 Test Execution Order

1. **Health Check** - Verify server is running
2. **Authentication** - Login all roles
3. **SuperAdmin Tests** - Full privileges
4. **Admin Tests** - Tenant management
5. **Editor Tests** - Content management
6. **Viewer Tests** - Read-only access
7. **Cross-Role Tests** - Security validation

## 🎯 Expected Results

### **Success Cases (200/201)**
- SuperAdmin: All operations
- Admin: User management (except admin creation), all image operations
- Editor: Own image operations
- Viewer: View own images only

### **Failure Cases (403/400)**
- Admin trying to create admin users
- Editor trying to create users
- Editor trying to access other users' images
- Viewer trying to upload/modify images
- Any role trying to access higher privilege operations

## 🔧 Troubleshooting

### **Common Issues**
1. **401 Unauthorized**: Check if tokens are set correctly
2. **403 Forbidden**: Role doesn't have required permissions
3. **404 Not Found**: Check if test data exists
4. **500 Server Error**: Check server logs

### **Reset Test Data**
```bash
# Drop database and reseed
node seed.js development --drop
```

## 📊 Test Coverage

- ✅ Authentication & Authorization
- ✅ Role-based Access Control (RBAC)
- ✅ Image Ownership Validation
- ✅ CRUD Operations Security
- ✅ Cross-role Access Prevention
- ✅ Error Handling
- ✅ Token Management

Run all tests to ensure your JCMS API is secure and functioning correctly!