const csrf = require("csrf");
const session = require("express-session");
const logger = require("../logger");

// Initialize CSRF token generator
const tokens = new csrf();

// Session configuration for CSRF
const sessionConfig = {
  secret:
    process.env.CSRF_SESSION_SECRET ||
    "csrf-session-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "strict",
  },
  name: "mountify.csrf.sid",
};

// Session middleware
const sessionMiddleware = session(sessionConfig);

// Generate CSRF token
const generateCSRFToken = (req, res, next) => {
  try {
    // Skip if session not available
    if (!req.session) {
      return next();
    }

    if (!req.session.csrfSecret) {
      req.session.csrfSecret = tokens.secretSync();
    }

    // Use existing token from session or create new one
    if (!req.session.csrfToken) {
      req.session.csrfToken = tokens.create(req.session.csrfSecret);
    }

    req.csrfToken = req.session.csrfToken;

    // Add token to response locals for templates
    res.locals.csrfToken = req.session.csrfToken;

    next();
  } catch (error) {
    logger.error("Error generating CSRF token:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: "CSRF token generation failed",
    });
  }
};

// Whitelist endpoints that do not require CSRF verification
const CSRF_WHITELIST = ["/api/auth/login", "/api/auth/register", "/api/health"];

// Verify CSRF token middleware
const verifyCSRFToken = (req, res, next) => {
  // Allow whitelisted endpoints
  if (CSRF_WHITELIST.includes(req.path)) {
    return next();
  }

  // Only check for state-changing methods
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    // Support both x-csrf-token and x-xsrf-token (case-insensitive)
    const headers = req.headers || {};
    const token =
      headers["x-csrf-token"] ||
      headers["x-xsrf-token"] ||
      (req.body && req.body._csrf) ||
      (req.query && req.query._csrf);
    if (!req.session || !req.session.csrfSecret) {
      return res.status(403).json({
        message: "CSRF Forbidden",
        error: "CSRF session missing",
      });
    }
    if (!token || !tokens.verify(req.session.csrfSecret, token)) {
      return res.status(403).json({
        message: "CSRF Forbidden",
        error: "Invalid or missing CSRF token",
      });
    }
  }
  next();
};

// Get CSRF token endpoint
const getCSRFToken = (req, res) => {
  try {
    // Ensure session exists
    if (!req.session) {
      return res.status(500).json({
        message: "Session not initialized",
        error: "Session middleware not properly configured",
      });
    }

    // Generate secret if not exists
    if (!req.session.csrfSecret) {
      req.session.csrfSecret = tokens.secretSync();
    }

    // Generate and store token in session if not exists
    if (!req.session.csrfToken) {
      req.session.csrfToken = tokens.create(req.session.csrfSecret);
    }

    res.json({
      csrfToken: req.session.csrfToken,
    });
  } catch (error) {
    logger.error("Error getting CSRF token:", error);
    res.status(500).json({
      message: "Internal server error",
      error: "Failed to get CSRF token",
    });
  }
};

module.exports = {
  sessionMiddleware,
  generateCSRFToken,
  getCSRFToken,
  verifyCSRFToken,
};
