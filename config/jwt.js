// JWT Configuration

// Pastikan JWT secret key ada dan aman
if (!process.env.JWT_SECRET_KEY) {
  console.error(
    "❌ Error: JWT_SECRET_KEY tidak ditemukan di environment variables!"
  );
  console.error("Silakan set JWT_SECRET_KEY di file .env");
  console.error(
    "Generate key yang aman dengan: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
  process.exit(1);
}

// Validasi panjang minimum JWT secret (minimal 32 karakter)
if (process.env.JWT_SECRET_KEY.length < 32) {
  console.error(
    "❌ Error: JWT_SECRET_KEY terlalu pendek! Minimal 32 karakter."
  );
  console.error(
    "Generate key yang aman dengan: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
  );
  process.exit(1);
}

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

module.exports = {
  JWT_SECRET_KEY,
  JWT_EXPIRES_IN,
};
