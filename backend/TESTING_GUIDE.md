# JCMS API Testing Guide

## 🚀 Quick Start

### Option 1: Postman Collection (Recommended)

1. **Import Collection**
   ```
   File: JCMS-Complete-API-Tests.postman_collection.json
   ```

2. **Set Base URL**
   - Collection Variables → `baseUrl` = `http://localhost:5000`

3. **Run Tests**
   - Start with "Login - SuperAdmin"
   - Token auto-saves to collection variables
   - Run other tests in any order

### Option 2: Quick Test Script

```bash
cd backend
node quick-test.js
```

---

## 📋 Postman Collection Features

### Auto-Variables
- ✅ `token` - Auto-saved after login
- ✅ `userId` - Auto-saved after login
- ✅ `imageId` - Auto-saved after image upload
- ✅ `contentId` - Auto-saved after content creation

### Test Scripts
- ✅ Automatic token extraction
- ✅ Response validation
- ✅ Variable auto-population

---

## 🧪 Test Scenarios

### 1. Authentication Flow
```
1. Login - SuperAdmin
2. Get Current User
3. Verify token is set
```

### 2. Subscription Flow
```
1. Get Subscription Plans
2. Get Subscription Status (free)
3. Create Subscription (standard)
4. Verify Payment
5. Get Payment History
6. Cancel Subscription
```

### 3. Image Upload Flow (Free User)
```
1. Login as Editor
2. Upload Image (< 10MB)
3. Verify expiresAt is set
4. Verify userPlan = 'free'
5. Try upload > 10MB (should fail)
```

### 4. Image Upload Flow (Subscribed User)
```
1. Login
2. Create Subscription
3. Verify Payment
4. Upload Image (< 100MB)
5. Verify expiresAt is null
6. Verify userPlan = 'standard'
```

### 5. Content Management Flow
```
1. Create Content (draft)
2. Get All Content
3. Update Content (published)
4. Delete Content
```

---

## 📝 Manual Testing

### Test Upload Limits

**Free User (10MB limit)**
```bash
# Create 5MB test file
dd if=/dev/zero of=test-5mb.jpg bs=1M count=5

# Create 15MB test file
dd if=/dev/zero of=test-15mb.jpg bs=1M count=15

# Upload 5MB - Should succeed
# Upload 15MB - Should fail
```

**Subscribed User (100MB limit)**
```bash
# Create 50MB test file
dd if=/dev/zero of=test-50mb.jpg bs=1M count=50

# Upload 50MB - Should succeed
```

### Test Image Expiry

**Check Expiry Date**
```javascript
// After upload as free user
GET /api/images/:id

Response:
{
  "expiresAt": "2024-02-15T10:30:00.000Z",  // 15 days from now
  "userPlan": "free"
}
```

**Trigger Manual Cleanup**
```javascript
// In backend console
const { cleanupExpiredImages } = require('./src/services/imageCleanupService');
await cleanupExpiredImages();
```

---

## 🔍 Testing Checklist

### Authentication
- [ ] Login with SuperAdmin
- [ ] Login with Admin
- [ ] Login with Editor
- [ ] Invalid credentials fail
- [ ] Token is returned
- [ ] Get current user works

### Subscriptions
- [ ] Get all plans
- [ ] Get current status
- [ ] Create subscription
- [ ] Verify payment
- [ ] View payment history
- [ ] Cancel subscription
- [ ] Cannot cancel twice

### Image Upload
- [ ] Upload as free user (< 10MB)
- [ ] Upload as free user (> 10MB) fails
- [ ] Free user image has expiresAt
- [ ] Subscribe and upload (< 100MB)
- [ ] Subscribed user image has no expiresAt
- [ ] Get all images
- [ ] Delete image

### Content
- [ ] Create draft
- [ ] Create published
- [ ] Update content
- [ ] Delete content
- [ ] Get all content

### Users
- [ ] Get all users
- [ ] Create user
- [ ] Update user
- [ ] Delete user

---

## 🐛 Common Issues

### Issue: "Unauthorized"
**Solution**: Run login request first to get token

### Issue: "File too large"
**Solution**: Check subscription plan and file size

### Issue: "Image not found"
**Solution**: Image may have expired (free users)

### Issue: "Cannot read property 'id'"
**Solution**: Ensure user is logged in

---

## 📊 Expected Responses

### Successful Login
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "superadmin",
    "role": "superadmin"
  }
}
```

### Successful Image Upload (Free)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Test Image",
    "fileSize": 5242880,
    "userPlan": "free",
    "expiresAt": "2024-02-15T10:30:00.000Z"
  }
}
```

### File Size Exceeded
```json
{
  "success": false,
  "message": "File size exceeds limit. Max: 10MB for free plan"
}
```

### Subscription Created
```json
{
  "success": true,
  "message": "Subscription created",
  "data": {
    "plan": "standard",
    "status": "active",
    "expiryDate": "2024-02-15T10:30:00.000Z"
  }
}
```

---

## 🎯 Performance Testing

### Load Test Script
```javascript
// Test 100 concurrent logins
for (let i = 0; i < 100; i++) {
  fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'superadmin',
      password: 'admin123'
    })
  });
}
```

---

## 📈 Monitoring

### Check Cleanup Logs
```bash
# View server logs
tail -f logs/combined.log | grep "cleanup"
```

### Check Database
```javascript
// Count expired images
db.images.count({ expiresAt: { $lte: new Date() } })

// Count by plan
db.images.aggregate([
  { $group: { _id: "$userPlan", count: { $sum: 1 } } }
])
```

---

## 🔧 Advanced Testing

### Test Cleanup Service
```javascript
// Manually trigger cleanup
const { cleanupExpiredImages } = require('./src/services/imageCleanupService');

// Run cleanup
const result = await cleanupExpiredImages();
console.log(`Deleted ${result.deleted} images`);
```

### Test Subscription Upgrade
```javascript
// 1. Upload as free user
// 2. Subscribe to standard
// 3. Upload again
// 4. Verify no expiry on new images
```

---

## 📞 Support

If tests fail:
1. Check server is running (`npm run dev`)
2. Check MongoDB is running
3. Verify environment variables
4. Check logs for errors
5. Clear database and re-seed

---

**Last Updated**: 2024
