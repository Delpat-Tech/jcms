# JCMS - Content Management System

A full-stack content management system built with React frontend and Node.js backend.

## Project Structure

```
jcms/
├── backend/          # Node.js API server
├── frontend/         # React application
└── frontend_test/    # Next.js test application
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your MongoDB URI and other settings in .env
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure API URL in .env
npm start
```

## Default Credentials

After seeding the database:

- **SuperAdmin**: `superadmin` / `admin123`
- **Admin**: `dev_admin` / `dev123`
- **Editor**: `test_editor` / `test123`

## Features

- Role-based authentication (SuperAdmin, Admin, Editor)
- JWT token management
- File upload and management
- User management
- Analytics and notifications
- Multi-tenant support

## Environment Variables

### Backend (.env)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PORT` - Server port (default: 5000)

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL

## License

Private project - All rights reserved.