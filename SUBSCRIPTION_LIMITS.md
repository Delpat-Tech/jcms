# Subscription Limits & Image Expiry

## 📋 Overview

JCMS implements subscription-based limits for image uploads and automatic cleanup for free users.

---

## 🎯 Upload Limits

### File Size Limits by Plan

| Plan | Max File Size | Features |
|------|---------------|----------|
| **Free** | 10 MB | Unlimited uploads, 15-day expiry |
| **Standard** | 100 MB | Unlimited uploads, no expiry |
| **Premium** | 100 MB | Unlimited uploads, no expiry |

### How It Works

1. **Upload Request** → System checks user's subscription plan
2. **File Size Check** → Validates file size against plan limit
3. **Rejection** → If file exceeds limit, upload is rejected with error message
4. **Success** → If within limit, file is uploaded and processed

---

## ⏰ Image Expiry (Free Users Only)

### Automatic Deletion

- **Free users**: Images expire after **15 days**
- **Subscribed users**: Images **never expire**

### Expiry Process

```
Upload → Set expiresAt = now + 15 days → Cleanup service runs daily → Delete expired images
```

### Cleanup Schedule

- Runs every **24 hours**
- Initial cleanup runs **5 seconds** after server start
- Deletes both file and database record

---

## 🔧 Technical Implementation

### Database Fields

```javascript
{
  expiresAt: Date,           // Expiry date (null for subscribed users)
  userPlan: String,          // 'free', 'standard', 'premium'
  fileSize: Number,          // File size in bytes
  createdAt: Date            // Upload timestamp
}
```

### Middleware: checkUploadLimit

```javascript
// Checks file size before upload
- Gets user's subscription plan
- Sets upload limit based on plan
- Validates file size
- Rejects if exceeds limit
```

### Service: imageCleanupService

```javascript
// Runs daily cleanup
- Finds images where expiresAt <= now
- Only targets userPlan === 'free'
- Deletes file from disk
- Removes database record
```

---

## 📊 Plan Comparison

### Free Plan
- ✅ Unlimited image uploads
- ✅ 10 MB max file size
- ⚠️ Images deleted after 15 days
- ❌ No permanent storage

### Standard Plan ($9.99/month)
- ✅ Unlimited image uploads
- ✅ 100 MB max file size
- ✅ Permanent storage (no expiry)
- ✅ Full article access

### Premium Plan ($19.99/month)
- ✅ Unlimited image uploads
- ✅ 100 MB max file size
- ✅ Permanent storage (no expiry)
- ✅ Premium media support (PDF, video)

---

## 🚨 Error Messages

### File Size Exceeded
```json
{
  "success": false,
  "message": "File size exceeds limit. Max: 10MB for free plan"
}
```

### Multiple Files
```json
{
  "success": false,
  "message": "File \"image.jpg\" exceeds limit. Max: 10MB for free plan"
}
```

---

## 💡 User Experience

### Upload Flow

1. User uploads image
2. System checks subscription
3. If free user:
   - Limit: 10 MB
   - Expiry: 15 days
   - Warning shown
4. If subscribed:
   - Limit: 100 MB
   - No expiry
   - No warnings

### Expiry Notifications

Free users see:
- Upload success message
- "Image will expire in 15 days"
- Upgrade prompt

---

## 🔄 Upgrade Benefits

### When User Upgrades

1. **Existing Images**:
   - Expiry date removed
   - Images become permanent
   - No longer deleted

2. **New Uploads**:
   - 100 MB limit applies
   - No expiry set
   - Permanent storage

### Implementation

```javascript
// On subscription upgrade
await Image.updateMany(
  { user: userId, userPlan: 'free' },
  { 
    userPlan: 'standard',
    expiresAt: null 
  }
);
```

---

## 📈 Monitoring

### Cleanup Logs

```
[INFO] Running scheduled image cleanup...
[INFO] Found 15 expired images to delete
[INFO] Deleted expired image: 507f1f77bcf86cd799439011
[INFO] Image cleanup completed: 15 deleted
```

### Statistics

Track:
- Total images uploaded
- Images by plan
- Expired images deleted
- Storage saved

---

## 🛠️ Configuration

### Expiry Duration

Change in `imageController.js`:
```javascript
// Current: 15 days
expiresAt.setDate(expiresAt.getDate() + 15);

// Change to 30 days
expiresAt.setDate(expiresAt.getDate() + 30);
```

### Cleanup Interval

Change in `imageCleanupService.js`:
```javascript
// Current: 24 hours
const INTERVAL = 24 * 60 * 60 * 1000;

// Change to 12 hours
const INTERVAL = 12 * 60 * 60 * 1000;
```

### File Size Limits

Change in `subscriptionLimits.js`:
```javascript
const limits = {
  free: 10 * 1024 * 1024,      // 10MB
  standard: 100 * 1024 * 1024,  // 100MB
  premium: 100 * 1024 * 1024    // 100MB
};
```

---

## 🔐 Security

- Users can only delete their own images
- Cleanup service runs with system privileges
- File deletion is safe (checks exist before delete)
- Database transactions ensure consistency

---

## 📝 Best Practices

### For Users

1. **Free Plan**:
   - Upload only needed images
   - Download important images before expiry
   - Upgrade for permanent storage

2. **Subscribed**:
   - Organize with collections
   - Use appropriate file sizes
   - Regular cleanup of unused images

### For Admins

1. Monitor cleanup logs
2. Track storage usage
3. Adjust limits as needed
4. Communicate expiry to users

---

## 🚀 Future Enhancements

- [ ] Email notifications before expiry
- [ ] Grace period after expiry
- [ ] Bulk download before expiry
- [ ] Archive instead of delete
- [ ] User-configurable expiry

---

**Version**: 1.0.0
**Last Updated**: 2024
