# JCMS Admin Panel Setup Guide

## Quick Start

### 1. Start the Server
```bash
# In your JCMS project folder, run:
npm run dev
# OR
npm start
```

### 2. Wait for Success Message
Look for this message in your terminal:
```
Server started successfully { port: 5000 }
```

### 3. Open Admin Panel
Go to: http://localhost:5000/admin

### 4. Test Connection
Click the "🔍 Test Server Connection" button to verify everything is working.

## Default Test Credentials
If you need to create a test user, you can:

1. Run the seeding script:
```bash
npm run seed:core
```

2. Or manually create a user through the API

## Troubleshooting

### "Failed to fetch" Error
- ✅ Make sure server is running (`npm run dev`)
- ✅ Check terminal for error messages
- ✅ Verify port 5000 is not blocked
- ✅ Try refreshing the admin panel page

### No Users to Login With
- Run: `npm run seed:core` to create default users
- Or use the admin panel to create users after getting a token

### Database Connection Issues
- Check your `.env` file has correct `MONGO_URI`
- Ensure MongoDB is running (if using local MongoDB)
- Verify network connection (if using MongoDB Atlas)

## Admin Panel Features
- 🔐 Authentication with JWT tokens
- 📊 Test all API endpoints
- 📁 File and image uploads
- 👥 User management
- 🏢 Tenant management
- 📈 Analytics and notifications