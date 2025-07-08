const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");
const { uploadLaporan } = require("../config/multer");

// ===================================
// ROUTES - BUG REPORT MANAGEMENT
// ===================================

// POST create bug report
router.post(
  "/laporan-error",
  authenticateToken,
  uploadLaporan.single("screenshot"),
  async (req, res) => {
    const { judul_laporan, deskripsi_laporan, halaman_error } = req.body;
    const id_pelapor = req.user.id;
    const url_screenshot = req.file
      ? `/uploads/laporan-error/${req.file.filename}`
      : null;
    if (!judul_laporan || !deskripsi_laporan) {
      return res
        .status(400)
        .json({ message: "Judul dan Deskripsi laporan wajib diisi." });
    }
    try {
      const result = await pool.query(
        "INSERT INTO laporan_error (id_pelapor, judul_laporan, deskripsi_laporan, halaman_error, url_screenshot) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          id_pelapor,
          judul_laporan,
          deskripsi_laporan,
          halaman_error,
          url_screenshot,
        ]
      );
      res.status(201).json({
        message: "Laporan Anda telah berhasil dikirim. Terima kasih!",
        laporan: result.rows[0],
      });
    } catch (error) {
      logger.error("Error creating bug report:", error);
      res
        .status(500)
        .json({ message: "Terjadi kesalahan saat mengirim laporan." });
    }
  }
);

router.get(
  "/laporan-error",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const query = `
        SELECT l.*, u.username AS nama_pelapor
        FROM laporan_error l
        LEFT JOIN users u ON l.id_pelapor = u.id_user
        ORDER BY 
          CASE l.status_laporan WHEN 'Baru' THEN 1 WHEN 'Ditinjau' THEN 2 ELSE 3 END,
          l.dilaporkan_pada DESC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error) {
      logger.error("Error fetching bug reports:", error);
      res.status(500).json({ message: "Gagal mengambil data laporan." });
    }
  }
);

router.put(
  "/laporan-error/:id_laporan",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id_laporan } = req.params;
    const { status_laporan, prioritas, catatan_admin } = req.body;
    try {
      const diselesaikan_pada =
        status_laporan === "Selesai" ? new Date() : null;
      const result = await pool.query(
        "UPDATE laporan_error SET status_laporan = $1, prioritas = $2, catatan_admin = $3, diselesaikan_pada = $4 WHERE id_laporan = $5 RETURNING *",
        [
          status_laporan,
          prioritas,
          catatan_admin,
          diselesaikan_pada,
          id_laporan,
        ]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Laporan tidak ditemukan." });
      }
      res.json({
        message: "Status laporan berhasil diperbarui.",
        laporan: result.rows[0],
      });
    } catch (error) {
      logger.error("Error updating bug report:", error);
      res.status(500).json({ message: "Gagal memperbarui laporan." });
    }
  }
);

router.delete(
  "/laporan-error/:id_laporan",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id_laporan } = req.params;
    try {
      const fileResult = await pool.query(
        "SELECT url_screenshot FROM laporan_error WHERE id_laporan = $1",
        [id_laporan]
      );
      if (fileResult.rows.length > 0 && fileResult.rows[0].url_screenshot) {
        const filePath = path.join(
          __dirname,
          "public",
          fileResult.rows[0].url_screenshot
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      const result = await pool.query(
        "DELETE FROM laporan_error WHERE id_laporan = $1",
        [id_laporan]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Laporan tidak ditemukan." });
      }
      res.json({ message: "Laporan berhasil dihapus." });
    } catch (error) {
      logger.error("Error deleting bug report:", error);
      res.status(500).json({ message: "Gagal menghapus laporan." });
    }
  }
);

module.exports = router;
