const express = require("express");
const router = express.Router(); // 1. Buat instance Router

// Middleware (asumsikan ini diimpor atau sudah ada di scope)
const { authenticateToken, authorizeAdmin } = require("../middleware/auth"); // Contoh path
const pool = require("../config/database"); // Sesuaikan path ke database config
const logger = require("../logger"); // Contoh path ke logger

// ===================================
// ADMIN ROUTES - POI MANAGEMENT
// ===================================
router.get("/poi", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const query = `
            SELECT 
                p.id_titik, p.nama_titik, p.tipe_titik, p.koordinat, 
                p.deskripsi, p.ketersediaan_air, p.kapasitas_tenda,
                g.nama_gunung, j.nama_jalur, j.id_gunung, p.id_jalur
            FROM titik_penting p
            LEFT JOIN jalur_pendakian j ON p.id_jalur = j.id_jalur
            LEFT JOIN gunung g ON j.id_gunung = g.id_gunung
            ORDER BY p.id_titik DESC;
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all POI:", error);
    res.status(500).json({ message: "Server error saat mengambil data POI." });
  }
});

router.get(
  "/poi/:id_titik",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_titik } = req.params;
      const result = await pool.query(
        "SELECT * FROM titik_penting WHERE id_titik = $1",
        [id_titik]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Data POI tidak ditemukan." });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error fetching single POI:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

router.post("/poi", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const {
      nama_titik,
      tipe_titik,
      id_jalur,
      koordinat,
      deskripsi,
      ketersediaan_air,
      kapasitas_tenda,
    } = req.body;
    if (!nama_titik || !tipe_titik) {
      return res
        .status(400)
        .json({ message: "Nama dan Tipe POI wajib diisi." });
    }
    let koordinatWKT = null;
    if (koordinat && koordinat.includes(",")) {
      const [lat, lon] = koordinat.split(",").map((c) => parseFloat(c.trim()));
      if (!isNaN(lon) && !isNaN(lat)) {
        koordinatWKT = `POINT(${lon} ${lat})`;
      }
    }
    const finalIdJalur = id_jalur ? parseInt(id_jalur, 10) : null;
    const result = await pool.query(
      `INSERT INTO titik_penting (nama_titik, tipe_titik, id_jalur, koordinat, deskripsi, ketersediaan_air, kapasitas_tenda) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        nama_titik,
        tipe_titik,
        finalIdJalur,
        koordinatWKT,
        deskripsi,
        ketersediaan_air,
        kapasitas_tenda,
      ]
    );
    res.status(201).json({
      message: "Titik Penting (POI) berhasil ditambahkan!",
      poi: result.rows[0],
    });
  } catch (error) {
    logger.error("Error adding POI:", error);
    res.status(500).json({ message: "Server error saat menambahkan POI." });
  }
});

router.put(
  "/poi/:id_titik",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_titik } = req.params;
      const {
        nama_titik,
        tipe_titik,
        id_jalur,
        koordinat,
        deskripsi,
        ketersediaan_air,
        kapasitas_tenda,
      } = req.body;
      let koordinatWKT = null;
      if (koordinat && koordinat.includes(",")) {
        const [lat, lon] = koordinat
          .split(",")
          .map((c) => parseFloat(c.trim()));
        if (!isNaN(lon) && !isNaN(lat)) {
          koordinatWKT = `POINT(${lon} ${lat})`;
        }
      }
      const finalIdJalur = id_jalur ? parseInt(id_jalur, 10) : null;
      const result = await pool.query(
        `UPDATE titik_penting SET 
             nama_titik = $1, tipe_titik = $2, id_jalur = $3, koordinat = $4, deskripsi = $5, ketersediaan_air = $6, kapasitas_tenda = $7
             WHERE id_titik = $8 RETURNING *`,
        [
          nama_titik,
          tipe_titik,
          finalIdJalur,
          koordinatWKT,
          deskripsi,
          ketersediaan_air,
          kapasitas_tenda,
          id_titik,
        ]
      );
      if (result.rowCount === 0)
        return res.status(404).json({ message: "Data POI tidak ditemukan." });
      res.json({
        message: "Data POI berhasil diperbarui!",
        poi: result.rows[0],
      });
    } catch (error) {
      logger.error("Error updating POI:", error);
      res.status(500).json({ message: "Server error saat memperbarui POI." });
    }
  }
);

router.delete(
  "/poi/:id_titik",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_titik } = req.params;
      const result = await pool.query(
        "DELETE FROM titik_penting WHERE id_titik = $1 RETURNING nama_titik",
        [id_titik]
      );
      if (result.rowCount === 0)
        return res.status(404).json({ message: "Data POI tidak ditemukan." });
      res.json({
        message: `POI '${result.rows[0].nama_titik}' berhasil dihapus.`,
      });
    } catch (error) {
      logger.error("Error deleting POI:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// 3. Ekspor router agar bisa digunakan di file lain
module.exports = router;
