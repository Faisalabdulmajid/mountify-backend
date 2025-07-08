const { Pool } = require("pg");

// Pastikan environment variables database ada
if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error("❌ Error: Database environment variables tidak lengkap!");
  console.error(
    "Pastikan DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, dan DB_PORT sudah diset di file .env"
  );
  process.exit(1);
}

// Database connection to db_gunung2
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

module.exports = pool;
