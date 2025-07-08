const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");

// ================================================================
// ADMIN ROUTES - ANNOUNCEMENT MANAGEMENT
// ================================================================

// GET all announcements
router.get(
  "/announcements",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const query = `
        SELECT 
          p.id_pengumuman, p.judul, p.status, p.berlaku_mulai, p.berlaku_sampai,
          u.username AS penulis,
          COALESCE(g.nama_gunung, j.nama_jalur, 'Umum') AS target
        FROM pengumuman p
        LEFT JOIN users u ON p.dibuat_oleh = u.id_user
        LEFT JOIN gunung g ON p.id_gunung = g.id_gunung
        LEFT JOIN jalur_pendakian j ON p.id_jalur = j.id_jalur
        ORDER BY p.dibuat_pada DESC
      `;
      const result = await pool.query(query);
      const announcementsWithDisplayStatus = result.rows.map((ann) => {
        let displayStatus = ann.status;
        if (ann.status === "Published") {
          const now = new Date();
          const mulai = new Date(ann.berlaku_mulai);
          const sampai = new Date(ann.berlaku_sampai);
          sampai.setHours(23, 59, 59, 999);
          if (now < mulai) {
            displayStatus = "Dijadwalkan";
          } else if (now >= mulai && now <= sampai) {
            displayStatus = "Sedang Berlangsung";
          } else {
            displayStatus = "Kadaluarsa";
          }
        }
        return { ...ann, displayStatus };
      });
      res.json(announcementsWithDisplayStatus);
    } catch (error) {
      logger.error("Error fetching announcements:", error);
      res
        .status(500)
        .json({ message: "Gagal mengambil data pengumuman dari server." });
    }
  }
);

router.post(
  "/announcements",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const {
      judul,
      isi_pengumuman,
      id_gunung,
      id_jalur,
      berlaku_mulai,
      berlaku_sampai,
      status,
    } = req.body;
    const dibuat_oleh = req.user.id;
    try {
      const finalIdGunung = id_gunung ? parseInt(id_gunung, 10) : null;
      const finalIdJalur = id_jalur ? parseInt(id_jalur, 10) : null;
      const finalBerlakuMulai = berlaku_mulai ? berlaku_mulai : null;
      const finalBerlakuSampai = berlaku_sampai ? berlaku_sampai : null;
      const result = await pool.query(
        "INSERT INTO pengumuman (judul, isi_pengumuman, id_gunung, id_jalur, berlaku_mulai, berlaku_sampai, dibuat_oleh, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [
          judul,
          isi_pengumuman,
          finalIdGunung,
          finalIdJalur,
          finalBerlakuMulai,
          finalBerlakuSampai,
          dibuat_oleh,
          status,
        ]
      );
      res.status(201).json({
        message: "Pengumuman berhasil dibuat!",
        announcement: result.rows[0],
      });
    } catch (error) {
      logger.error("Error creating announcement:", error);
      res
        .status(500)
        .json({ message: "Server error saat membuat pengumuman." });
    }
  }
);

router.put(
  "/announcements/:id_pengumuman",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id_pengumuman } = req.params;
    const {
      judul,
      isi_pengumuman,
      id_gunung,
      id_jalur,
      berlaku_mulai,
      berlaku_sampai,
      status,
    } = req.body;
    try {
      const finalIdGunung = id_gunung ? parseInt(id_gunung, 10) : null;
      const finalIdJalur = id_jalur ? parseInt(id_jalur, 10) : null;
      const result = await pool.query(
        "UPDATE pengumuman SET judul = $1, isi_pengumuman = $2, id_gunung = $3, id_jalur = $4, berlaku_mulai = $5, berlaku_sampai = $6, status = $7 WHERE id_pengumuman = $8 RETURNING *",
        [
          judul,
          isi_pengumuman,
          finalIdGunung,
          finalIdJalur,
          berlaku_mulai,
          berlaku_sampai,
          status,
          id_pengumuman,
        ]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Pengumuman tidak ditemukan." });
      }
      res.json({
        message: "Pengumuman berhasil diperbarui!",
        announcement: result.rows[0],
      });
    } catch (error) {
      logger.error("Error updating announcement:", error);
      res
        .status(500)
        .json({ message: "Server error saat memperbarui pengumuman." });
    }
  }
);

router.get(
  "/announcements/:id_pengumuman",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_pengumuman } = req.params;
      const result = await pool.query(
        "SELECT * FROM pengumuman WHERE id_pengumuman = $1",
        [id_pengumuman]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Pengumuman tidak ditemukan." });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error fetching single announcement:", error);
      res
        .status(500)
        .json({ message: "Server error saat mengambil detail pengumuman." });
    }
  }
);

router.delete(
  "/announcements/:id_pengumuman",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id_pengumuman } = req.params;
    try {
      const result = await pool.query(
        "DELETE FROM pengumuman WHERE id_pengumuman = $1 RETURNING judul",
        [id_pengumuman]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Pengumuman tidak ditemukan." });
      }
      res.json({
        message: `Pengumuman '${result.rows[0].judul}' berhasil dihapus.`,
      });
    } catch (error) {
      logger.error("Error deleting announcement:", error);
      res
        .status(500)
        .json({ message: "Server error saat menghapus pengumuman." });
    }
  }
);

module.exports = router;
