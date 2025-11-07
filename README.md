# JCMS - Content Management System

A full-stack content management system built with React frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB Atlas account or local MongoDB
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd jcms

# Install all dependencies
npm run install-all

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your configuration
# - MongoDB URI
# - JWT Secret
# - Other settings

# Seed database (optional)
npm run seed

# Start development servers
npm run dev-backend    # Backend on port 5000
npm run dev-frontend   # Frontend on port 3000
```

## 📁 Project Structure

```
jcms/
├── backend/          # Node.js API server
│   ├── src/
│   │   ├── api/      # API routes and controllers
│   │   ├── core/     # Core utilities and middlewares
│   │   ├── database/ # Models, seeds, migrations
│   │   ├── services/ # Business logic
│   │   ├── jobs/     # Scheduled jobs
│   │   └── config/   # Configuration files
│   └── docs/         # API documentation
├── frontend/         # React application
│   ├── src/
│   │   ├── api/      # API client
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── public/
├── docs/             # Project documentation
└── scripts/          # Utility scripts
```

## 🔑 Default Credentials

After seeding the database:

- **SuperAdmin**: `superadmin` / `admin123`
- **Admin**: `dev_admin` / `dev123`
- **Editor**: `test_editor` / `test123`

## ✨ Features

- **Role-based authentication** (SuperAdmin, Admin, Editor)
- **JWT token management** with refresh tokens
- **File upload and management** with image processing
- **User management** with activation/deactivation
- **Analytics and notifications** real-time updates
- **Multi-tenant support** with branding
- **Subscription management** with Razorpay integration
- **Activity logging** and audit trails

## 🛠️ Available Scripts

### Root Level
```bash
npm run install-all      # Install all dependencies
npm run dev-backend      # Start backend in dev mode
npm run dev-frontend     # Start frontend in dev mode
npm run cleanup:dry-run  # Preview files to be cleaned
npm run cleanup          # Clean up irrelevant files
```

### Backend
```bash
cd backend
npm start               # Start production server
npm run dev            # Start with nodemon
npm run seed           # Seed database
npm run seed:core      # Seed core data only
npm run seed:empty     # Create empty structure
```

### Frontend
```bash
cd frontend
npm start              # Start development server
npm run build          # Build for production
npm test               # Run tests
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
```

## 📚 API Documentation

API documentation is available at:
- Development: `http://localhost:5000/docs`
- See `backend/docs/API-DOCUMENTATION.md` for details

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with your preferred static server
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Role-based access control (RBAC)
- Activity logging

## 📖 Documentation

- [API Documentation](backend/docs/API-DOCUMENTATION.md)
- [Subscription Setup](documentation/SUBSCRIPTION_SETUP.md)
- [Image Management Guide](documentation/IMAGE_MANAGEMENT_GUIDE.md)
- [SuperAdmin Guide](documentation/SUPERADMIN.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

Private project - All rights reserved.

## 🆘 Support

For issues and questions:
- Check documentation in `/docs`
- Review API documentation
- Contact the development team

---

**Version:** 1.0.0  
**Last Updated:** 2025
