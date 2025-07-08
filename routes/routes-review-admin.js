const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");

// ===================================
// ADMIN ROUTES - REVIEW MANAGEMENT
// ===================================

// GET all reviews
router.get("/reviews", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const query = `
        SELECT 
          r.id_ulasan, r.rating, r.isi_ulasan AS komentar, r.dibuat_pada AS created_at,
          r.status, u.username AS penulis, j.nama_jalur, g.nama_gunung
        FROM ulasan r
        JOIN users u ON r.id_user = u.id_user
        JOIN jalur_pendakian j ON r.id_jalur = j.id_jalur
        JOIN gunung g ON j.id_gunung = g.id_gunung
        ORDER BY r.dibuat_pada DESC
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data ulasan." });
  }
});

router.patch(
  "/reviews/:id_ulasan/status",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_ulasan } = req.params;
      const { status } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          message: "Status tidak valid. Gunakan 'approved' atau 'rejected'.",
        });
      }
      const result = await pool.query(
        "UPDATE ulasan SET status = $1 WHERE id_ulasan = $2 RETURNING id_ulasan, status",
        [status, id_ulasan]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Ulasan tidak ditemukan." });
      }
      res.json({
        message: `Ulasan berhasil diubah menjadi '${status}'.`,
        ulasan: result.rows[0],
      });
    } catch (error) {
      logger.error("Error updating review status:", error);
      res
        .status(500)
        .json({ message: "Server error saat memperbarui status ulasan." });
    }
  }
);

router.patch(
  "/reviews/:id_ulasan/approve",
  authenticateToken,
  authorizeAdmin,
  (req, res) => {
    res.json({
      message: "Tidak ada status persetujuan untuk diubah pada ulasan ini.",
    });
  }
);

router.delete(
  "/reviews/:id_ulasan",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_ulasan } = req.params;
      const result = await pool.query(
        "DELETE FROM ulasan WHERE id_ulasan = $1",
        [id_ulasan]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Ulasan tidak ditemukan." });
      }
      res.json({ message: "Ulasan berhasil dihapus." });
    } catch (error) {
      logger.error("Error deleting review:", error);
      res.status(500).json({ message: "Server error saat menghapus ulasan." });
    }
  }
);

module.exports = router;
