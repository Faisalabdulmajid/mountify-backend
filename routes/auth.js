const express = require("express");
const {
  register,
  login,
  forgotPassword,
} = require("../controllers/authController");
const router = express.Router();

console.log("🔧 Auth routes loaded");

router.post("/register", (req, res, next) => {
  console.log("📝 POST /api/auth/register called");
  register(req, res, next);
});

router.post("/login", (req, res, next) => {
  console.log("🔑 POST /api/auth/login called");
  login(req, res, next);
});

// Endpoint lupa password
router.post("/forgot-password", (req, res, next) => {
  console.log("🔒 POST /api/auth/forgot-password called");
  forgotPassword(req, res, next);
});

module.exports = router;
