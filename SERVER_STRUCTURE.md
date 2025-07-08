# Server Structure Documentation

## Files Currently Used (Active)

### Entry Point

- `server.js` ✅ **ACTIVE** - Main server entry point (refactored version)

### Configuration Files

- `config/database.js` ✅ **ACTIVE** - Database configuration
- `config/jwt.js` ✅ **ACTIVE** - JWT configuration
- `config/multer.js` ✅ **ACTIVE** - File upload configuration

### Core Application

- `app.js` ✅ **ACTIVE** - Main Express app setup

### Controllers

- `controllers/authController.js` ✅ **ACTIVE** - Authentication logic
- `controllers/userController.js` ✅ **ACTIVE** - User management logic
- `controllers/adminController.js` ✅ **ACTIVE** - Admin operations logic
- `controllers/chatbotController.js` ✅ **ACTIVE** - Chatbot integration logic
- `controllers/recommendationController.js` ✅ **ACTIVE** - Recommendation system logic
- `controllers/mountainController.js` ✅ **ACTIVE** - Mountain management logic
- `controllers/publicController.js` ✅ **ACTIVE** - Public endpoints logic

### Routes

- `routes/auth.js` ✅ **ACTIVE** - Authentication routes
- `routes/users.js` ✅ **ACTIVE** - User routes
- `routes/admin.js` ✅ **ACTIVE** - Admin routes
- `routes/chatbot.js` ✅ **ACTIVE** - Chatbot routes
- `routes/recommendations.js` ✅ **ACTIVE** - Recommendation routes
- `routes/mountains.js` ✅ **ACTIVE** - Mountain management routes
- `routes/public.js` ✅ **ACTIVE** - Public routes

### Services

- `services/dialogflowService.js` ✅ **ACTIVE** - Dialogflow integration
- `services/recommendationService.js` ✅ **ACTIVE** - Recommendation logic

### Middleware

- `middleware/auth.js` ✅ **ACTIVE** - Authentication middleware

### Utilities

- `utils/helpers.js` ✅ **ACTIVE** - Helper functions

### Testing

- `test-server.js` ✅ **ACTIVE** - API testing script

## Files Removed/Deprecated

### Backup Files

- `server-old.js` ⚠️ **BACKUP** - Original monolithic server (keep for reference)
- `server-new.js` ❌ **DELETED** - Duplicate of server.js (removed)

## Current Server Status

- ✅ Server running at: http://localhost:5000
- ✅ API Documentation: http://localhost:5000/api-docs
- ✅ Health Check: http://localhost:5000/health

## Missing Endpoints (Need Implementation)

- ❌ `/api/public/pengumuman/terbaru` - Public announcements
- ❌ `/api/admin/gunung` - Mountain management for admin

## How to Start Server

```bash
node backend/server.js
```

## How to Test Server

```bash
node backend/test-server.js
```
