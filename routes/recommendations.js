const express = require("express");
const {
  getRecommendations,
  getTrailRecommendations,
} = require("../controllers/recommendationController");
const router = express.Router();

// Endpoint untuk rekomendasi gunung (existing)
router.post("/gunung", getRecommendations);

// Endpoint untuk rekomendasi jalur (new)
router.post("/jalur", getTrailRecommendations);

module.exports = router;
