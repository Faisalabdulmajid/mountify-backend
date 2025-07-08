const express = require("express");
const {
  getAllTrails,
  getTrailById,
  createTrail,
  updateTrail,
  deleteTrail,
} = require("../controllers/trailController");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const router = express.Router();

// Trail management routes
router.get("/jalur", authenticateToken, authorizeAdmin, getAllTrails);
router.get("/jalur/:id_jalur", authenticateToken, authorizeAdmin, getTrailById);
router.post("/jalur", authenticateToken, authorizeAdmin, createTrail);
router.put("/jalur/:id_jalur", authenticateToken, authorizeAdmin, updateTrail);
router.delete(
  "/jalur/:id_jalur",
  authenticateToken,
  authorizeAdmin,
  deleteTrail
);

module.exports = router;
