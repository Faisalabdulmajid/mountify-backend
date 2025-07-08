const express = require("express");
const {
  getAllMountains,
  getAllTrails,
  getTrailsByMountain,
  getAllAnnouncements,
  getLatestAnnouncements,
  getAnnouncementById,
  getAllArticles,
  getArticleBySlug,
  postLaporanError,
  getMountainDetailPublic,
  getTrailDetailPublic, // tambahkan ini
} = require("../controllers/publicController");
const { authenticateToken } = require("../middleware/auth");
const { uploadLaporan } = require("../config/multer");
const router = express.Router();

// Public mountain routes
router.get("/gunung", getAllMountains);
router.get("/jalur", getAllTrails);
router.get("/gunung/:id/jalur", getTrailsByMountain);
router.get("/gunung/:id", getMountainDetailPublic);
router.get("/jalur/:id_jalur", getTrailDetailPublic); // endpoint publik detail jalur

// Public announcement routes
router.get("/public/pengumuman", getAllAnnouncements);
router.get("/public/pengumuman/terbaru", getLatestAnnouncements);
router.get("/public/pengumuman/:id", getAnnouncementById);

// Public article routes
router.get("/public/artikel", getAllArticles);
router.get("/public/artikel/:slug", getArticleBySlug);

// Endpoint publik POST laporan error (harus login)
router.post(
  "/laporan-error",
  authenticateToken,
  uploadLaporan.single("screenshot"),
  postLaporanError
);

module.exports = router;
