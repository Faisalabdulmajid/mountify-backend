// Load environment variables
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const logger = require("./logger");
const {
  sessionMiddleware,
  generateCSRFToken,
  getCSRFToken,
  verifyCSRFToken, // tambahkan import
} = require("./middleware/csrf");

// Import Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const mountainRoutes = require("./routes/mountains");
const trailRoutes = require("./routes/trails");
const publicRoutes = require("./routes/public");
const chatbotRoutes = require("./routes/chatbot");
const recommendationRoutes = require("./routes/recommendations");
const poiAdminRoutes = require("./routes/routes-poi-admin");
const artikelAdminRoutes = require("./routes/routes-artikel-admin");
const gunungAdminRoutes = require("./routes/routes-gunung-admin");
const jalurAdminRoutes = require("./routes/routes-jalur-admin");
const galeriAdminRoutes = require("./routes/routes-galeri-admin");
const bugAdminRoutes = require("./routes/routes-bug-admin");
const tagsAdminRoutes = require("./routes/routes-tags-admin");
const reviewAdminRoutes = require("./routes/routes-review-admin");
const pengumumanAdminRoutes = require("./routes/routes-pengumuman-admin");

const app = express();

// CORS Configuration dengan whitelist origin yang aman
const corsOptions = {
  origin: function (origin, callback) {
    // Daftar origin yang diizinkan dari environment variables
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      : [
          "http://localhost:3000", // React development server
          "http://localhost:3001", // Backup React port
          "http://127.0.0.1:3000", // Alternative localhost
          "http://127.0.0.1:3001", // Alternative localhost backup
        ];

    // Izinkan requests tanpa origin (misal: Postman, server-to-server, testing) di development dan test
    if (
      !origin &&
      (process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test")
    ) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      // Kembalikan 403 Forbidden, bukan error 500
      callback(null, false);
    }
  },
  credentials: true, // Izinkan cookies/credentials
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
    "X-XSRF-Token",
  ],
  maxAge: 86400, // Cache preflight request untuk 24 jam
};

// Middleware khusus untuk handle CORS error 403
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 403 && res.getHeader("x-cors-reason")) {
      res.json({ message: "Origin tidak diizinkan oleh kebijakan CORS" });
    }
  });
  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware untuk CSRF
app.use(sessionMiddleware);

// CSRF Protection
app.use(generateCSRFToken);
// Jangan aktifkan verifyCSRFToken secara global

// Middleware blokir origin tidak diizinkan (untuk automated test/supertest)
if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",")
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://127.0.0.1:3000",
          "http://127.0.0.1:3001",
        ];
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      return res
        .status(403)
        .json({
          message: "Forbidden: Origin tidak diizinkan oleh kebijakan CORS",
        });
    }
    next();
  });
}

// Static files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Setup Swagger/OpenAPI Documentation
try {
  const swaggerDocument = YAML.load(path.join(__dirname, "../openapi.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  logger.info("✅ Swagger UI tersedia di http://localhost:5000/api-docs");
} catch (error) {
  logger.error("❌ Error loading OpenAPI file:", error.message);
}

// Routes
console.log("🔧 Mounting routes...");
app.use("/api/auth", authRoutes);
console.log("✅ Auth routes mounted at /api/auth");
app.use("/api/users", userRoutes);
app.use("/api/profile", profileRoutes);

// Pasang verifyCSRFToken hanya untuk /api/admin dan subroutenya
app.use("/api/admin", verifyCSRFToken, adminRoutes);
app.use("/api/admin", verifyCSRFToken, mountainRoutes);
app.use("/api/admin", verifyCSRFToken, trailRoutes);
app.use("/api/admin", verifyCSRFToken, poiAdminRoutes);
app.use("/api/admin", verifyCSRFToken, artikelAdminRoutes);
app.use("/api/admin", verifyCSRFToken, gunungAdminRoutes);
app.use("/api/admin", verifyCSRFToken, jalurAdminRoutes);
app.use("/api/admin", verifyCSRFToken, galeriAdminRoutes);
app.use("/api/admin", verifyCSRFToken, bugAdminRoutes);
app.use("/api/admin", verifyCSRFToken, tagsAdminRoutes);
app.use("/api/admin", verifyCSRFToken, reviewAdminRoutes);
app.use("/api/admin", verifyCSRFToken, pengumumanAdminRoutes);

app.use("/api", publicRoutes);
app.use("/api", chatbotRoutes);
app.use("/api/rekomendasi", recommendationRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Duplicate for /api/health
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// CSRF token endpoint
app.get("/api/csrf-token", getCSRFToken);

// Protected route for testing CSRF and auth
const { authenticateToken } = require("./middleware/auth");
app.get("/api/protected-route", authenticateToken, (req, res) => {
  res.status(200).json({
    message: "Access to protected route granted (GET)",
    success: true,
    user: req.user || null,
  });
});
app.post(
  "/api/protected-route",
  authenticateToken,
  verifyCSRFToken,
  (req, res) => {
    res.status(200).json({
      message: "Access to protected route granted (POST)",
      success: true,
      user: req.user || null,
    });
  }
);
app.put(
  "/api/protected-route",
  authenticateToken,
  verifyCSRFToken,
  (req, res) => {
    res.status(200).json({
      message: "Access to protected route granted (PUT)",
      success: true,
      user: req.user || null,
    });
  }
);
app.delete(
  "/api/protected-route",
  authenticateToken,
  verifyCSRFToken,
  (req, res) => {
    res.status(200).json({
      message: "Access to protected route granted (DELETE)",
      success: true,
      user: req.user || null,
    });
  }
);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    message: "Endpoint tidak ditemukan",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error);
  res.status(500).json({
    message: "Terjadi kesalahan pada server",
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
});

module.exports = app;
