const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");
const { uploadThumbnail } = require("../config/multer");

// ===================================
// ADMIN ROUTES - MOUNTAIN MANAGEMENT
// ===================================

// POST create mountain
router.post(
  "/gunung",
  authenticateToken,
  authorizeAdmin,
  uploadThumbnail.single("url_thumbnail"),
  async (req, res) => {
    try {
      const {
        nama_gunung,
        ketinggian_puncak_mdpl,
        lokasi_administratif,
        deskripsi_singkat,
        variasi_jalur_skala,
      } = req.body;
      if (!nama_gunung || !ketinggian_puncak_mdpl)
        return res
          .status(400)
          .json({ message: "Nama dan ketinggian wajib diisi." });

      // Validasi variasi_jalur_skala (0-10)
      if (
        variasi_jalur_skala &&
        (variasi_jalur_skala < 0 || variasi_jalur_skala > 10)
      ) {
        return res
          .status(400)
          .json({ message: "Variasi jalur skala harus antara 0-10." });
      }

      const url_thumbnail = req.file
        ? `/uploads/thumbnails/${req.file.filename}`
        : null;
      const result = await pool.query(
        "INSERT INTO gunung (nama_gunung, ketinggian_puncak_mdpl, lokasi_administratif, deskripsi_singkat, url_thumbnail, variasi_jalur_skala) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [
          nama_gunung,
          ketinggian_puncak_mdpl,
          lokasi_administratif,
          deskripsi_singkat,
          url_thumbnail,
          variasi_jalur_skala || null,
        ]
      );
      res.status(201).json({
        message: "Gunung berhasil ditambahkan",
        gunung: result.rows[0],
      });
    } catch (error) {
      logger.error("Error add gunung:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET all mountains
router.get("/gunung", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Jika error GROUP BY, gunakan GROUP BY semua kolom non-agregat!
    const query = `
        SELECT 
          g.*, 
          COUNT(DISTINCT j.id_jalur) AS jumlah_jalur,
          COALESCE(AVG(u.rating), 0) AS rating_rata_rata,
          COUNT(DISTINCT u.id_ulasan) AS jumlah_ulasan
        FROM gunung g
        LEFT JOIN jalur_pendakian j ON g.id_gunung = j.id_gunung
        LEFT JOIN ulasan u ON j.id_jalur = u.id_jalur
        GROUP BY g.id_gunung
        ORDER BY g.id_gunung DESC;
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    // Log error lebih detail untuk debugging
    logger.error("Error fetching admin gunung data:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET single mountain
router.get(
  "/gunung/:id_gunung",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_gunung } = req.params;
      if (!id_gunung || isNaN(parseInt(id_gunung, 10))) {
        return res.status(400).json({ message: "ID gunung tidak valid." });
      }
      const result = await pool.query(
        "SELECT * FROM gunung WHERE id_gunung = $1",
        [id_gunung]
      );
      if (result.rows.length === 0)
        return res
          .status(404)
          .json({ message: "Data gunung tidak ditemukan." });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error fetching single gunung:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT update mountain
router.put(
  "/gunung/:id_gunung",
  authenticateToken,
  authorizeAdmin,
  uploadThumbnail.single("url_thumbnail"),
  async (req, res) => {
    try {
      const { id_gunung } = req.params;
      const {
        nama_gunung,
        ketinggian_puncak_mdpl,
        lokasi_administratif,
        deskripsi_singkat,
        variasi_jalur_skala,
      } = req.body;
      const oldDataResult = await pool.query(
        "SELECT url_thumbnail FROM gunung WHERE id_gunung = $1",
        [id_gunung]
      );
      let url_thumbnail = oldDataResult.rows[0]?.url_thumbnail;
      if (req.file) {
        if (url_thumbnail) {
          const oldPath = path.join(__dirname, "public", url_thumbnail);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        url_thumbnail = `/uploads/thumbnails/${req.file.filename}`;
      }

      // Validasi variasi_jalur_skala (0-10)
      if (
        variasi_jalur_skala &&
        (variasi_jalur_skala < 0 || variasi_jalur_skala > 10)
      ) {
        return res
          .status(400)
          .json({ message: "Variasi jalur skala harus antara 0-10." });
      }

      const result = await pool.query(
        `UPDATE gunung SET nama_gunung = $1, ketinggian_puncak_mdpl = $2, lokasi_administratif = $3, deskripsi_singkat = $4, url_thumbnail = $5, variasi_jalur_skala = $6 WHERE id_gunung = $7 RETURNING *`,
        [
          nama_gunung,
          ketinggian_puncak_mdpl,
          lokasi_administratif,
          deskripsi_singkat,
          url_thumbnail,
          variasi_jalur_skala || null,
          id_gunung,
        ]
      );
      if (result.rows.length === 0)
        return res
          .status(404)
          .json({ message: "Data gunung tidak ditemukan." });
      res.json({
        message: "Data gunung berhasil diperbarui!",
        gunung: result.rows[0],
      });
    } catch (error) {
      logger.error("Error updating gunung:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE mountain
router.delete(
  "/gunung/:id_gunung",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_gunung } = req.params;
      const fileResult = await pool.query(
        "SELECT url_thumbnail FROM gunung WHERE id_gunung = $1",
        [id_gunung]
      );
      const result = await pool.query(
        "DELETE FROM gunung WHERE id_gunung = $1 RETURNING *",
        [id_gunung]
      );
      if (result.rows.length === 0)
        return res.status(404).json({ message: "Gunung tidak ditemukan." });
      const url_thumbnail = fileResult.rows[0]?.url_thumbnail;
      if (url_thumbnail) {
        const filePath = path.join(__dirname, "public", url_thumbnail);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      res.json({
        message: `'${result.rows[0].nama_gunung}' berhasil dihapus.`,
      });
    } catch (error) {
      logger.error("Error deleting gunung:", error);
      if (error.code === "23503")
        return res.status(409).json({
          message:
            "Gagal menghapus: Hapus dulu data jalur pendakian yang terkait.",
        });
      res.status(500).json({ message: "Server error" });
    }
  }
);

// POST bulk delete mountains
router.post(
  "/gunung/bulk-delete",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ID tidak valid atau kosong." });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const fileResult = await client.query(
        "SELECT url_thumbnail FROM gunung WHERE id_gunung = ANY($1::int[])",
        [ids]
      );
      const deleteResult = await client.query(
        "DELETE FROM gunung WHERE id_gunung = ANY($1::int[]) RETURNING nama_gunung",
        [ids]
      );
      if (deleteResult.rowCount === 0)
        throw new Error("Tidak ada data yang cocok untuk dihapus.");
      for (const row of fileResult.rows) {
        if (row.url_thumbnail) {
          const filePath = path.join(__dirname, "public", row.url_thumbnail);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
      await client.query("COMMIT");
      res.json({
        message: `${deleteResult.rowCount} data gunung berhasil dihapus.`,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error bulk deleting gunung:", error);
      if (error.code === "23503")
        return res.status(409).json({
          message:
            "Gagal menghapus massal: Salah satu gunung memiliki data jalur terkait.",
        });
      res
        .status(500)
        .json({ message: "Server error saat proses hapus massal." });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
