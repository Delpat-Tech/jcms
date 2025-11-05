# 🚀 Enhanced Tenant Management - Postman Testing Guide

This guide will walk you through testing all the enhanced tenant management features using Postman.

## 📋 Prerequisites

### 1. **Start the JCMS Server**
```bash
cd "R:\Internship Projects\jcms\backend"
npm run dev
```

### 2. **Ensure Database is Set Up**
- Make sure MongoDB is running
- Ensure you have a `.env` file with proper configuration
- Verify superadmin user exists

### 3. **Install Postman**
- Download from [postman.com](https://www.postman.com/downloads/)
- Create a free account if needed

## 🔧 Setup Instructions

### Step 1: Import the Collection

1. **Open Postman**
2. **Click "Import"** in the top left
3. **Select "Enhanced-Tenant-Management.postman_collection.json"** from your backend directory
4. **Click "Import"**

The collection will be imported with these folders:
- 🔐 Authentication
- 🏢 Basic Tenant Management  
- 👥 Tenant User Management
- 📊 Tenant Statistics
- 📈 Tenant Analytics
- 🧪 Advanced Features
- 🧹 Cleanup

### Step 2: Configure Variables

The collection uses these variables (automatically managed):
- `baseUrl`: http://localhost:5000
- `authToken`: Stored after login
- `testTenantId`: Stored after tenant creation
- `testUserId`: Stored after user creation

## 🧪 Testing Scenarios

### **Scenario 1: Quick Smoke Test**

**Purpose**: Verify all basic functionality works

**Steps**:
1. Run **🔐 Authentication → Health Check**
2. Run **🔐 Authentication → Login as Superadmin**
   - ⚠️ **Update credentials** in the request body first!
3. Run **🏢 Basic Tenant Management → Get All Tenants**
4. Run **🧪 Advanced Features → Test Tenant Analytics Route**

**Expected Results**: All requests should return 200 status codes

### **Scenario 2: Full Tenant Lifecycle Test**

**Purpose**: Test complete tenant management workflow

**Steps**:
1. **Authentication**
   - Health Check ✅
   - Login as Superadmin ✅

2. **Create and Manage Tenant**
   - Get All Tenants
   - Create Test Tenant ✅ (stores tenant ID)
   - Get Tenant by ID ✅
   - Update Tenant Settings ✅

3. **User Management**
   - Get Tenant Users
   - Create Single Tenant User ✅
   - Bulk Create Tenant Users ✅ (creates 3 users)
   - Export Tenant Users (JSON) ✅
   - Export Tenant Users (CSV) ✅

4. **Analytics & Reporting**
   - Get Tenant Stats ✅
   - Get Tenant Dashboard (7 days) ✅
   - Get Tenant Usage History ✅
   - Get Tenant Performance Metrics ✅
   - Get Tenant Activity Report ✅
   - Compare All Tenants ✅

5. **Cleanup**
   - Delete Test Tenant ✅ (removes all data)

### **Scenario 3: Bulk Operations Test**

**Purpose**: Test all bulk user management features

**Steps**:
1. Login and create a test tenant
2. Run **👥 Tenant User Management → Bulk Create Tenant Users**
3. Run **👥 Tenant User Management → Get Tenant Users** (verify users created)
4. Run **🧪 Advanced Features → Bulk Update Tenant Users**
5. Export users to verify updates
6. Cleanup

### **Scenario 4: Analytics Deep Dive**

**Purpose**: Test all analytics endpoints

**Steps**:
1. Create tenant with some users
2. Test each analytics endpoint:
   - Dashboard with different timeframes (24h, 7d, 30d)
   - Usage history with different periods (daily, weekly)
   - Performance metrics
   - Activity reports with different filters
   - Multi-tenant comparison

## 🔍 Individual Test Details

### **Authentication Tests**

#### Health Check
```http
GET /api/health
```
**Expected**: Server status and timestamp

#### Login as Superadmin
```http
POST /api/auth/login
{
  "username": "superadmin",
  "password": "your-password"
}
```
**⚠️ Important**: Update the credentials in the request body!

### **Basic Tenant Management**

#### Create Tenant (Enhanced)
```http
POST /api/tenants
{
  "name": "Test Company Enhanced",
  "subdomain": "testenhanced", 
  "adminUsername": "testadmin",
  "adminEmail": "admin@testenhanced.com",
  "adminPassword": "testpass123"
}
```
**Expected**: Creates tenant AND admin user simultaneously

#### Update Tenant Settings
```http
PUT /api/tenants/{{testTenantId}}
{
  "name": "Updated Name",
  "settings": {
    "maxUsers": 100,
    "maxStorage": "20GB"
  },
  "isActive": true
}
```

### **User Management Tests**

#### Bulk Create Users
```json
{
  "users": [
    {
      "username": "bulkuser1",
      "email": "bulkuser1@test.com", 
      "password": "password123",
      "roleName": "editor"
    },
    {
      "username": "bulkuser2",
      "email": "bulkuser2@test.com",
      "password": "password123", 
      "roleName": "viewer"
    }
  ]
}
```
**Expected**: Creates multiple users, returns success/error count

#### Export Users
```http
GET /api/tenants/{{testTenantId}}/users/export?format=json
GET /api/tenants/{{testTenantId}}/users/export?format=csv
```
**Expected**: Downloads user data in requested format

### **Analytics Tests**

#### Tenant Dashboard
```http
GET /api/tenant-analytics/{{testTenantId}}/dashboard?timeframe=7d
```
**Expected**: Comprehensive dashboard data with:
- User counts and activity
- Storage usage and quota
- Recent activity trends  
- Top uploaders
- File type distribution

#### Performance Metrics
```http
GET /api/tenant-analytics/{{testTenantId}}/performance
```
**Expected**: Detailed metrics including:
- User engagement rates
- Content creation rates
- Storage efficiency
- Health indicators

#### Usage History
```http
GET /api/tenant-analytics/{{testTenantId}}/usage-history?period=daily&limit=7
```
**Expected**: Historical data for images, files, and users

#### Tenant Comparison
```http
GET /api/tenant-analytics/compare?metrics=users,storage,activity
```
**Expected**: Comparison data for all active tenants

## 🐛 Troubleshooting

### **Common Issues**

#### ❌ "Login failed" 
**Solution**: Update superadmin credentials in the login request body

#### ❌ "Server connection failed"
**Solution**: 
1. Ensure server is running: `npm run dev`
2. Check MongoDB is running
3. Verify `.env` file exists with correct MONGO_URI

#### ❌ "Tenant not found" in subsequent requests
**Solution**: The testTenantId variable wasn't set. Re-run "Create Test Tenant" first.

#### ❌ "Access denied"
**Solution**: Ensure you're logged in and authToken is set

### **Environment Configuration**

#### Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jcms
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:5000
```

#### Verify Superadmin User:
```bash
node checkSuperAdmin.js
```

## 📊 Test Results Interpretation

### **Success Indicators**
- ✅ Status codes: 200 (success), 201 (created)
- ✅ Response contains `"success": true`
- ✅ Expected data structures returned
- ✅ Variables automatically stored for subsequent tests

### **Expected Response Structures**

#### Tenant Creation Response
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "tenant": {
    "_id": "tenant-id",
    "name": "Test Company Enhanced",
    "subdomain": "testenhanced",
    "adminUser": {
      "_id": "admin-user-id",
      "username": "testadmin"
    }
  }
}
```

#### Analytics Dashboard Response
```json
{
  "success": true,
  "dashboard": {
    "overview": { "totalUsers": 4, "activeUsers": 4 },
    "activity": { "newUsers": 0, "dailyActivity": [] },
    "storage": { "used": 0, "usagePercentage": 0 },
    "users": { "byRole": {}, "topUploaders": [] }
  }
}
```

#### Bulk Operations Response
```json
{
  "success": true,
  "message": "Bulk operation completed: 3 users created, 0 errors",
  "results": {
    "created": [...],
    "errors": []
  }
}
```

## 🔄 Running Tests in Sequence

### **Option 1: Manual Testing**
Run requests one by one, checking responses

### **Option 2: Collection Runner**
1. Click collection name → **"Run collection"**
2. Select all requests or specific folder
3. Click **"Run Enhanced Tenant Management"**
4. Review results in the runner

### **Option 3: Newman (CLI)**
```bash
npm install -g newman
newman run Enhanced-Tenant-Management.postman_collection.json
```

## 📝 Test Coverage

This collection tests:
- ✅ **18 API endpoints** across all tenant management features
- ✅ **Authentication & Authorization** - Login, token management
- ✅ **CRUD Operations** - Create, read, update, delete tenants
- ✅ **Bulk Operations** - Mass user creation, updates, exports
- ✅ **Data Isolation** - Tenant-specific data access
- ✅ **Analytics & Reporting** - Comprehensive metrics and dashboards
- ✅ **Error Handling** - Proper error responses
- ✅ **Data Export** - JSON and CSV formats
- ✅ **Variable Management** - Automatic ID storage and reuse

## 🎯 Success Criteria

**✅ All tests pass if:**
- Health check returns server status
- Login succeeds and stores auth token
- Tenant creation works with all required fields
- User management (single + bulk) functions correctly
- Analytics endpoints return proper data structures
- Export functions work for both JSON and CSV
- Cleanup removes all test data

**The tenant management system is working correctly when all 18 requests in the collection return successful responses!**