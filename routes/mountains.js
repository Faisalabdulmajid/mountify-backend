const express = require("express");
const {
  getAllMountains,
  getMountainById,
  createMountain,
  updateMountain,
  deleteMountain,
} = require("../controllers/mountainController");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const { uploadThumbnail } = require("../config/multer");
const router = express.Router();

// Mountain management routes
router.get("/gunung", authenticateToken, authorizeAdmin, getAllMountains);
router.get(
  "/gunung/:id_gunung",
  authenticateToken,
  authorizeAdmin,
  getMountainById
);
router.post(
  "/gunung",
  authenticateToken,
  authorizeAdmin,
  uploadThumbnail.single("url_thumbnail"),
  createMountain
);
router.put(
  "/gunung/:id_gunung",
  authenticateToken,
  authorizeAdmin,
  uploadThumbnail.single("url_thumbnail"),
  updateMountain
);
router.delete(
  "/gunung/:id_gunung",
  authenticateToken,
  authorizeAdmin,
  deleteMountain
);

module.exports = router;
