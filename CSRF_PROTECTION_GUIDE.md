# CSRF Protection Implementation Guide

## 📋 Overview

CSRF (Cross-Site Request Forgery) protection telah diimplementasikan untuk melindungi aplikasi dari serangan CSRF. Implementasi ini menggunakan token-based CSRF protection dengan session management.

## 🔧 Backend Implementation

### Dependencies

- `csrf`: Library untuk generate dan verify CSRF tokens
- `express-session`: Session management untuk menyimpan CSRF secrets

### Middleware Components

#### 1. Session Middleware

```javascript
const sessionConfig = {
  secret: process.env.CSRF_SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "strict",
  },
};
```

#### 2. CSRF Token Generation

- Generates unique CSRF token untuk setiap session
- Token disimpan dalam `req.csrfToken` dan `res.locals.csrfToken`

#### 3. CSRF Token Verification

- Memverifikasi token untuk semua non-GET requests
- Mendukung multiple header formats: `X-CSRF-Token`, `X-XSRF-Token`
- Mendukung body dan query parameters: `_csrf`

### Whitelisted Endpoints

Endpoint berikut di-exclude dari CSRF verification:

- `/api/auth/login`
- `/api/auth/register`
- `/health`
- All GET, HEAD, OPTIONS requests

### API Endpoints

#### Get CSRF Token

```
GET /api/csrf-token
```

Response:

```json
{
  "csrfToken": "token_value_here"
}
```

## 🎨 Frontend Implementation

### CSRF Token Manager

File: `frontend/src/utils/csrfToken.js`

#### Features:

- Automatic token fetching dan caching
- Token expiry management (23 hours)
- Automatic retry jika CSRF error
- Axios interceptor untuk seamless integration

#### Usage:

```javascript
import { initializeCSRF, getCSRFToken } from "../utils/csrfToken";

// Initialize CSRF saat app start
await initializeCSRF();

// Get token untuk manual use
const token = await getCSRFToken();

// Axios akan automatically include token di header
```

## 🔐 Security Configuration

### Environment Variables

Add to `.env`:

```bash
CSRF_SESSION_SECRET=your_csrf_session_secret_minimum_32_characters_very_strong_random
```

Generate secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cookie Configuration

- `httpOnly: true` - Prevent XSS access
- `secure: true` - HTTPS only (production)
- `sameSite: 'strict'` - Prevent CSRF via cookies
- `maxAge: 24h` - Token expiry

## 📝 Implementation Steps

### Backend Setup

1. Install dependencies: `npm install csrf express-session`
2. Add CSRF_SESSION_SECRET to environment variables
3. Import dan configure CSRF middleware di `app.js`
4. Add CSRF token endpoint

### Frontend Setup

1. Copy `csrfToken.js` utility ke project
2. Initialize CSRF di App.js:

```javascript
import { initializeCSRF } from "./utils/csrfToken";

useEffect(() => {
  initializeCSRF().catch(console.error);
}, []);
```

## 🧪 Testing

### Manual Testing

1. Get CSRF token: `GET /api/csrf-token`
2. Make POST request dengan token di header: `X-CSRF-Token: token_value`
3. Make POST request tanpa token (should fail dengan 403)

### Automated Testing

```javascript
// Test CSRF protection
describe("CSRF Protection", () => {
  it("should reject requests without CSRF token", async () => {
    const response = await request(app)
      .post("/api/admin/users")
      .send({ data: "test" });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("CSRF");
  });

  it("should accept requests with valid CSRF token", async () => {
    const tokenResponse = await request(app).get("/api/csrf-token");
    const token = tokenResponse.body.csrfToken;

    const response = await request(app)
      .post("/api/admin/users")
      .set("X-CSRF-Token", token)
      .send({ data: "test" });

    expect(response.status).not.toBe(403);
  });
});
```

## 🔍 Monitoring & Logging

CSRF protection events di-log dengan level yang sesuai:

- Token generation: Info level
- Invalid tokens: Warning level
- Missing tokens: Warning level
- Errors: Error level

Log format:

```
[WARN] CSRF token missing for POST /api/admin/users from 192.168.1.1
[WARN] Invalid CSRF token for PUT /api/admin/users/123 from 192.168.1.1
```

## ⚠️ Important Notes

1. **Session Storage**: Default menggunakan memory store. Untuk production, gunakan persistent store (Redis, PostgreSQL)

2. **Token Rotation**: Tokens valid selama session lifetime (24 jam default)

3. **CORS Compatibility**: CSRF protection compatible dengan CORS yang sudah ada

4. **Performance**: Minimal overhead, token generation sangat cepat

5. **Backward Compatibility**: Existing API masih berfungsi, hanya perlu add CSRF token

## 🚀 Production Considerations

1. Use persistent session store (Redis recommended)
2. Configure proper cookie settings untuk HTTPS
3. Monitor CSRF logs untuk potential attacks
4. Consider token rotation untuk high-security operations
5. Test thoroughly dengan production-like environment

## 📊 Security Benefits

✅ **Prevents CSRF Attacks**: Token-based protection
✅ **Session Security**: Secure cookie configuration  
✅ **Automatic Retry**: Frontend handles token refresh
✅ **Comprehensive Logging**: Attack detection dan monitoring
✅ **Minimal Performance Impact**: Efficient implementation
✅ **Easy Integration**: Seamless dengan existing code
