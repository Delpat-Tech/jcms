# 🚀 JCMS Quick Reference Card

## 📦 New Utilities

### Response Handler
```javascript
const { success, error, paginated } = require('./core/utils/responseHandler');

// Success (200)
return success(res, data, 'Message');

// Success with custom status
return success(res, data, 'Created', 201);

// Error
return error(res, 'Error message', 400);

// Paginated
return paginated(res, items, page, limit, total);
```

### Async Handler
```javascript
const asyncHandler = require('./core/utils/asyncHandler');

// Wrap all async controllers
const myController = asyncHandler(async (req, res) => {
  // No try-catch needed!
  const data = await Model.find();
  return success(res, data);
});
```

### HTTP Status
```javascript
const HTTP_STATUS = require('./core/constants/httpStatus');

HTTP_STATUS.OK                    // 200
HTTP_STATUS.CREATED               // 201
HTTP_STATUS.BAD_REQUEST           // 400
HTTP_STATUS.UNAUTHORIZED          // 401
HTTP_STATUS.FORBIDDEN             // 403
HTTP_STATUS.NOT_FOUND             // 404
HTTP_STATUS.INTERNAL_SERVER_ERROR // 500
```

### Validation
```javascript
const { validateEmail, validateUsername, validatePassword, sanitizeString } = require('./core/utils/validation');

const email = validateEmail(req.body.email);
const username = validateUsername(req.body.username);
const password = validatePassword(req.body.password);
const safe = sanitizeString(req.body.text);
```

### Roles
```javascript
const ROLES = require('./core/constants/roles');

ROLES.SUPERADMIN                  // 'superadmin'
ROLES.ADMIN                       // 'admin'
ROLES.EDITOR                      // 'editor'
ROLES.isSuperAdmin(role)          // boolean
ROLES.isAdmin(role)               // boolean
ROLES.hasRole(role, allowedRoles) // boolean
```

---

## 🔧 Controller Template

```javascript
const asyncHandler = require('../core/utils/asyncHandler');
const { success, error } = require('../core/utils/responseHandler');
const HTTP_STATUS = require('../core/constants/httpStatus');
const Model = require('../models/model');

// GET all
const getAll = asyncHandler(async (req, res) => {
  const items = await Model.find();
  return success(res, items, 'Items retrieved');
});

// GET by ID
const getById = asyncHandler(async (req, res) => {
  const item = await Model.findById(req.params.id);
  
  if (!item) {
    return error(res, 'Item not found', HTTP_STATUS.NOT_FOUND);
  }
  
  return success(res, item, 'Item retrieved');
});

// CREATE
const create = asyncHandler(async (req, res) => {
  const item = await Model.create(req.body);
  return success(res, item, 'Item created', HTTP_STATUS.CREATED);
});

// UPDATE
const update = asyncHandler(async (req, res) => {
  const item = await Model.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!item) {
    return error(res, 'Item not found', HTTP_STATUS.NOT_FOUND);
  }
  
  return success(res, item, 'Item updated');
});

// DELETE
const remove = asyncHandler(async (req, res) => {
  const item = await Model.findByIdAndDelete(req.params.id);
  
  if (!item) {
    return error(res, 'Item not found', HTTP_STATUS.NOT_FOUND);
  }
  
  return success(res, null, 'Item deleted', HTTP_STATUS.NO_CONTENT);
});

module.exports = { getAll, getById, create, update, remove };
```

---

## 📝 Route Template

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, requireAdminOrAbove } = require('../middlewares/auth');
const controller = require('../controllers/controller');

// Public routes
router.get('/public', controller.getPublic);

// Protected routes
router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Admin only
router.post('/', requireAdminOrAbove, controller.create);
router.put('/:id', requireAdminOrAbove, controller.update);
router.delete('/:id', requireAdminOrAbove, controller.remove);

module.exports = router;
```

---

## 🎯 Common Patterns

### Validation in Routes
```javascript
const { body, param } = require('express-validator');
const validate = require('../core/middlewares/validate');

router.post('/',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('username').isLength({ min: 3 }).withMessage('Username too short'),
    body('password').isLength({ min: 6 }).withMessage('Password too short'),
    validate
  ],
  controller.create
);
```

### Pagination
```javascript
const getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Model.find().skip(skip).limit(limit),
    Model.countDocuments()
  ]);
  
  return paginated(res, items, page, limit, total);
});
```

### Filtering
```javascript
const getAll = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: 'i' };
  
  const items = await Model.find(query);
  return success(res, items);
});
```

### Tenant Filtering
```javascript
const getAll = asyncHandler(async (req, res) => {
  const query = req.user.role === 'superadmin' 
    ? {} 
    : { tenant: req.user.tenant };
  
  const items = await Model.find(query);
  return success(res, items);
});
```

---

## 🔒 Security Checklist

- [ ] Use `asyncHandler` for all async functions
- [ ] Use `HTTP_STATUS` constants instead of numbers
- [ ] Use `success/error` response handlers
- [ ] Validate all inputs
- [ ] Sanitize user input
- [ ] Check authentication with `authenticate`
- [ ] Check authorization with `requireRole`
- [ ] Don't expose sensitive data in errors
- [ ] Use environment variables for secrets
- [ ] Log security events

---

## 📋 NPM Scripts

```bash
# Root
npm run install-all      # Install all dependencies
npm run dev-backend      # Start backend dev
npm run dev-frontend     # Start frontend dev
npm run cleanup:dry-run  # Preview cleanup
npm run cleanup          # Run cleanup

# Backend
cd backend
npm start               # Production
npm run dev            # Development
npm run seed           # Seed database

# Frontend
cd frontend
npm start              # Development
npm run build          # Production build
npm test               # Run tests
```

---

## 🐛 Debugging

### Check Logs
```javascript
const logger = require('./config/logger');

logger.info('Info message', { data });
logger.warn('Warning message', { data });
logger.error('Error message', { error: err.message });
```

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"admin123"}'
```

---

## 📚 File Locations

```
backend/src/
├── core/
│   ├── utils/
│   │   ├── responseHandler.js  ← Use this
│   │   ├── asyncHandler.js     ← Use this
│   │   └── validation.js       ← Use this
│   └── constants/
│       ├── httpStatus.js       ← Use this
│       └── roles.js            ← Use this
├── controllers/
├── routes/
├── models/
└── middlewares/
```

---

## ⚡ Quick Tips

1. **Always use asyncHandler** - No try-catch needed
2. **Always use response handlers** - Consistent responses
3. **Always use HTTP_STATUS** - No magic numbers
4. **Always validate input** - Security first
5. **Always check authentication** - Use middleware
6. **Always log errors** - Use logger, not console
7. **Never expose secrets** - Use .env
8. **Never commit .env** - Use .env.example

---

## 🆘 Common Issues

### Issue: "Token is not valid"
**Solution:** Check JWT_SECRET in .env

### Issue: "CORS error"
**Solution:** Add origin to ALLOWED_ORIGINS in .env

### Issue: "MongoDB connection failed"
**Solution:** Check MONGO_URI in .env

### Issue: "File too large"
**Solution:** Check subscription limits

---

**Print this page for quick reference! 📄**
