const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");

// Konstanta enum untuk validasi
const ALLOWED_STATUS_JALUR = [
  "Belum Diketahui",
  "Buka",
  "Tutup Sementara",
  "Tutup",
];

// ===================================
// ADMIN ROUTES - TRAIL MANAGEMENT
// ===================================

// POST create trail
router.post("/jalur", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const {
      id_gunung,
      nama_jalur,
      lokasi_pintu_masuk,
      kesulitan_skala,
      keamanan_skala,
      kualitas_fasilitas_skala,
      kualitas_kemah_skala,
      keindahan_pemandangan_skala,
      estimasi_waktu_jam,
      deskripsi_jalur,
      status_jalur,
    } = req.body;
    if (!id_gunung || !nama_jalur)
      return res
        .status(400)
        .json({ message: "ID Gunung dan Nama Jalur wajib diisi." });
    // Validasi status_jalur
    if (!ALLOWED_STATUS_JALUR.includes(status_jalur)) {
      return res.status(400).json({
        message: `Status jalur tidak valid. Pilihan yang diperbolehkan: ${ALLOWED_STATUS_JALUR.join(
          ", "
        )}`,
      });
    }
    const result = await pool.query(
      `INSERT INTO jalur_pendakian (id_gunung, nama_jalur, lokasi_pintu_masuk, kesulitan_skala, keamanan_skala, kualitas_fasilitas_skala, kualitas_kemah_skala, keindahan_pemandangan_skala, estimasi_waktu_jam, deskripsi_jalur, status_jalur) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        id_gunung,
        nama_jalur,
        lokasi_pintu_masuk,
        kesulitan_skala,
        keamanan_skala,
        kualitas_fasilitas_skala,
        kualitas_kemah_skala,
        keindahan_pemandangan_skala,
        estimasi_waktu_jam,
        deskripsi_jalur,
        status_jalur,
      ]
    );
    res.status(201).json({
      message: "Jalur pendakian berhasil ditambahkan",
      jalur: result.rows[0],
    });
  } catch (error) {
    logger.error("Error add jalur:", error);
    if (error.code === "23505")
      return res
        .status(409)
        .json({ message: "Nama jalur ini sudah ada untuk gunung tersebut." });
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/jalur", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    console.log("🔍 GET /api/admin/jalur dipanggil");

    // Cek data jalur di database
    const checkQuery =
      "SELECT id_jalur, nama_jalur, id_gunung FROM jalur_pendakian LIMIT 3";
    const checkResult = await pool.query(checkQuery);
    console.log("🗃️ Raw data jalur dari DB:", checkResult.rows);

    const query = `
            SELECT 
                j.id_jalur, j.nama_jalur, j.id_gunung, g.nama_gunung, g.ketinggian_puncak_mdpl,
                j.kesulitan_skala, j.status_jalur, j.lokasi_pintu_masuk, j.estimasi_waktu_jam
            FROM jalur_pendakian j
            JOIN gunung g ON j.id_gunung = g.id_gunung
            ORDER BY j.id_jalur DESC;
        `;
    console.log("📝 Query:", query);
    const result = await pool.query(query);
    console.log("📊 Result jalur count:", result.rows.length);
    console.log("📋 Sample jalur data:", result.rows[0]);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching jalur:", error);
    logger.error("Error fetching all jalur:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data jalur." });
  }
});

router.get(
  "/jalur/:id_jalur",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_jalur } = req.params;
      const result = await pool.query(
        "SELECT * FROM jalur_pendakian WHERE id_jalur = $1",
        [id_jalur]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Data jalur tidak ditemukan." });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error fetching single jalur:", error);
      res
        .status(500)
        .json({ message: "Server error saat mengambil data jalur." });
    }
  }
);

router.put(
  "/jalur/:id_jalur",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_jalur } = req.params;
      const {
        id_gunung,
        nama_jalur,
        lokasi_pintu_masuk,
        kesulitan_skala,
        keamanan_skala,
        kualitas_fasilitas_skala,
        kualitas_kemah_skala,
        keindahan_pemandangan_skala,
        estimasi_waktu_jam,
        deskripsi_jalur,
        status_jalur,
      } = req.body;
      if (!id_gunung || !nama_jalur || !estimasi_waktu_jam) {
        return res.status(400).json({
          message: "Gunung, Nama Jalur, dan Estimasi Waktu wajib diisi.",
        });
      }
      // Validasi status_jalur
      if (!ALLOWED_STATUS_JALUR.includes(status_jalur)) {
        return res.status(400).json({
          message: `Status jalur tidak valid. Pilihan yang diperbolehkan: ${ALLOWED_STATUS_JALUR.join(
            ", "
          )}`,
        });
      }
      const result = await pool.query(
        `UPDATE jalur_pendakian SET 
                id_gunung = $1, nama_jalur = $2, lokasi_pintu_masuk = $3, kesulitan_skala = $4, 
                keamanan_skala = $5, kualitas_fasilitas_skala = $6, kualitas_kemah_skala = $7, 
                keindahan_pemandangan_skala = $8, estimasi_waktu_jam = $9, deskripsi_jalur = $10, 
                status_jalur = $11
            WHERE id_jalur = $12 RETURNING *`,
        [
          id_gunung,
          nama_jalur,
          lokasi_pintu_masuk,
          kesulitan_skala,
          keamanan_skala,
          kualitas_fasilitas_skala,
          kualitas_kemah_skala,
          keindahan_pemandangan_skala,
          estimasi_waktu_jam,
          deskripsi_jalur,
          status_jalur,
          id_jalur,
        ]
      );
      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Data jalur tidak ditemukan untuk diperbarui." });
      }
      res.json({
        message: "Data jalur berhasil diperbarui!",
        jalur: result.rows[0],
      });
    } catch (error) {
      logger.error("Error updating jalur:", error);
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ message: "Nama jalur ini sudah ada untuk gunung tersebut." });
      }
      res
        .status(500)
        .json({ message: "Server error saat memperbarui data jalur." });
    }
  }
);

router.delete(
  "/jalur/:id_jalur",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_jalur } = req.params;
      const result = await pool.query(
        "DELETE FROM jalur_pendakian WHERE id_jalur = $1 RETURNING nama_jalur",
        [id_jalur]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Data jalur tidak ditemukan." });
      }
      res.json({
        message: `Jalur '${result.rows[0].nama_jalur}' berhasil dihapus.`,
      });
    } catch (error) {
      logger.error("Error deleting jalur:", error);
      if (error.code === "23503") {
        return res.status(409).json({
          message:
            "Gagal menghapus: Hapus dulu data titik penting yang terkait dengan jalur ini.",
        });
      }
      res
        .status(500)
        .json({ message: "Server error saat menghapus data jalur." });
    }
  }
);

// Endpoint khusus untuk TambahPoi - memastikan field id_gunung ada
router.get(
  "/jalur-for-poi",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      console.log(
        "🔍 GET /api/admin/jalur-for-poi dipanggil (endpoint khusus POI)"
      );
      const query = `
            SELECT 
                j.id_jalur, 
                j.nama_jalur, 
                j.id_gunung,
                g.nama_gunung
            FROM jalur_pendakian j
            JOIN gunung g ON j.id_gunung = g.id_gunung
            ORDER BY g.nama_gunung, j.nama_jalur;
        `;
      const result = await pool.query(query);
      console.log("📊 Jalur for POI count:", result.rows.length);
      console.log("📋 Sample jalur for POI:", result.rows[0]);
      res.json(result.rows);
    } catch (error) {
      console.error("❌ Error fetching jalur for POI:", error);
      res
        .status(500)
        .json({ message: "Server error saat mengambil data jalur untuk POI." });
    }
  }
);

module.exports = router;
