const express = require("express");
const router = express.Router();
const {
  saveSearchHistory,
  getUserSearchHistory,
} = require("../controllers/searchHistoryController");
const { authenticateToken } = require("../middleware/auth");

// Save search history (POST) and get user search history (GET)
router.post("/", authenticateToken, saveSearchHistory);
router.get("/", authenticateToken, getUserSearchHistory);

module.exports = router;
