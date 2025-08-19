## JCMS – Minimal CMS Backend (Phase 1)

Basic Node.js + Express + MongoDB backend for image upload, AVIF conversion, and CRUD-ready APIs.

### Tech Stack
- Node.js, Express
- MongoDB (Mongoose)
- Multer (file uploads)
- Sharp (image processing to AVIF)
- Dotenv, CORS

### Prerequisites
- Node.js 18+
- MongoDB connection string (local or Atlas)

### Setup
1) Clone and install
```bash
git clone <repo-url>
cd jcms
npm install
```

2) Create `.env`
```bash
copy NUL .env  # Windows (PowerShell/CMD)
# Then edit .env and add:
# MONGO_URI=mongodb://localhost:27017/cms_backend
# PORT=5000
```

3) Run
```bash
npm run start
# Server: http://localhost:5000
```

### Project Structure
```
src/
  config/db.js        # Mongo connection
  server.js           # Express app
  controllers/        # (to be filled) image logic
  models/             # (to be filled) mongoose schemas
  routes/             # (to be filled) express routers
  middlewares/        # (to be filled)
  services/           # (to be filled) image processing (Sharp → AVIF)
  utils/              # (to be filled) helpers
uploads/
  index/
.env                  # ignored
```

Notes:
- `uploads/` is gitignored; empty folders are kept with `.gitkeep`.
- Images will be stored under `uploads/{tenant}/{entity}/` in AVIF.

### Health Check
```text
GET /
```
Returns: `Hello World!` (temporary placeholder)

### Next Steps (Phase 1 continuation)
- Add Image model, upload route, controller, and service for AVIF conversion.
- Enforce upload constraints (max 2MB, jpg/png only).
- CRUD endpoints: `POST/GET/GET/:id/PUT/:id/DELETE/:id` under `/api/:module`.
