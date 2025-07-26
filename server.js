const app = require("./app");
const logger = require("./logger");
const path = require("path");

// Import db.js as ESM
let dbInit = null;
try {
  dbInit = require("./config/db.js");
} catch (e) {
  dbInit = import("./config/db.js");
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Pastikan koneksi database selesai sebelum start server
    let db;
    if (
      dbInit &&
      dbInit.default &&
      typeof dbInit.default === "object" &&
      dbInit.default.get
    ) {
      // CJS require
      db = dbInit.default;
    } else if (dbInit && dbInit.then) {
      // ESM dynamic import
      db = (await dbInit).default;
    }
    // Tunggu koneksi database selesai
    if (db && db.__esModule && db.dbPromise) {
      await db.dbPromise;
    }

    // Tampilkan DB_IN_USE di awal
    const fs = require("fs");
    const envPath = process.env.ENV_PATH || path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/DB_IN_USE=(.*)/);
      if (match) {
        logger.info(`DB_IN_USE=${match[1]}`);
      }
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server berjalan di http://localhost:${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
    // Export server only after it's defined
    module.exports = server;

    // Graceful shutdown handler
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close((err) => {
        if (err) {
          logger.error("Error during server shutdown:", err);
          process.exit(1);
        }
        logger.info("Server closed successfully");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err) {
    logger.error("Gagal start server: ", err);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  const logger = require("./logger");
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  const logger = require("./logger");
  let detail =
    reason && reason.stack
      ? reason.stack
      : typeof reason === "object"
      ? JSON.stringify(reason)
      : String(reason);
  logger.error("Unhandled Rejection at:", promise, "reason:", detail);
  console.error("Unhandled Rejection (raw):", reason);
  process.exit(1);
});

startServer();
