const pool = require("../config/database");
const logger = require("../logger");
const path = require("path");
const fs = require("fs");

// Get all mountains with stats
const getAllMountains = async (req, res) => {
  try {
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
    logger.error("Error fetching admin gunung data:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    });
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Get single mountain by ID
const getMountainById = async (req, res) => {
  try {
    const { id_gunung } = req.params;
    if (!id_gunung || isNaN(parseInt(id_gunung, 10))) {
      return res.status(400).json({ message: "ID gunung tidak valid." });
    }
    const result = await pool.query(
      "SELECT * FROM gunung WHERE id_gunung = $1",
      [id_gunung]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data gunung tidak ditemukan." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching single gunung:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new mountain
const createMountain = async (req, res) => {
  try {
    const {
      nama_gunung,
      ketinggian_puncak_mdpl,
      lokasi_administratif,
      deskripsi_singkat,
    } = req.body;

    if (!nama_gunung || !ketinggian_puncak_mdpl) {
      return res
        .status(400)
        .json({ message: "Nama dan ketinggian wajib diisi." });
    }

    const url_thumbnail = req.file
      ? `/uploads/thumbnails/${req.file.filename}`
      : null;

    const result = await pool.query(
      "INSERT INTO gunung (nama_gunung, ketinggian_puncak_mdpl, lokasi_administratif, deskripsi_singkat, url_thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        nama_gunung,
        ketinggian_puncak_mdpl,
        lokasi_administratif,
        deskripsi_singkat,
        url_thumbnail,
      ]
    );
    res.status(201).json({
      message: "Gunung berhasil ditambahkan",
      gunung: result.rows[0],
    });
  } catch (error) {
    if (
      error.code === "23505" &&
      error.constraint === "gunung_nama_gunung_key"
    ) {
      // Duplicate nama_gunung
      return res
        .status(400)
        .json({
          message: `Gunung dengan nama '${req.body.nama_gunung}' sudah ada.`,
        });
    }
    logger.error("Error add gunung:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update mountain
const updateMountain = async (req, res) => {
  try {
    const { id_gunung } = req.params;
    const {
      nama_gunung,
      ketinggian_puncak_mdpl,
      lokasi_administratif,
      deskripsi_singkat,
    } = req.body;

    if (!nama_gunung || !ketinggian_puncak_mdpl) {
      return res
        .status(400)
        .json({ message: "Nama dan ketinggian wajib diisi." });
    }

    let updateQuery = `
      UPDATE gunung 
      SET nama_gunung = $1, ketinggian_puncak_mdpl = $2, lokasi_administratif = $3, deskripsi_singkat = $4
    `;
    let values = [
      nama_gunung,
      ketinggian_puncak_mdpl,
      lokasi_administratif,
      deskripsi_singkat,
    ];

    // Handle thumbnail upload if provided
    if (req.file) {
      // Get old thumbnail to delete
      const oldResult = await pool.query(
        "SELECT url_thumbnail FROM gunung WHERE id_gunung = $1",
        [id_gunung]
      );

      const url_thumbnail = `/uploads/thumbnails/${req.file.filename}`;
      updateQuery += `, url_thumbnail = $5 WHERE id_gunung = $6 RETURNING *`;
      values.push(url_thumbnail, id_gunung);

      // Delete old thumbnail file
      if (oldResult.rows.length > 0 && oldResult.rows[0].url_thumbnail) {
        const oldPath = path.join(
          __dirname,
          "../public",
          oldResult.rows[0].url_thumbnail
        );
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    } else {
      updateQuery += ` WHERE id_gunung = $5 RETURNING *`;
      values.push(id_gunung);
    }

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data gunung tidak ditemukan." });
    }

    res.json({
      message: "Data gunung berhasil diperbarui",
      gunung: result.rows[0],
    });
  } catch (error) {
    logger.error("Error update gunung:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete mountain
const deleteMountain = async (req, res) => {
  try {
    const { id_gunung } = req.params;

    // Get thumbnail to delete
    const fileResult = await pool.query(
      "SELECT url_thumbnail FROM gunung WHERE id_gunung = $1",
      [id_gunung]
    );

    const result = await pool.query(
      "DELETE FROM gunung WHERE id_gunung = $1 RETURNING nama_gunung",
      [id_gunung]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Data gunung tidak ditemukan." });
    }

    // Delete thumbnail file
    const url_thumbnail = fileResult.rows[0]?.url_thumbnail;
    if (url_thumbnail) {
      const filePath = path.join(__dirname, "../public", url_thumbnail);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      message: `Gunung '${result.rows[0].nama_gunung}' berhasil dihapus.`,
    });
  } catch (error) {
    logger.error("Error delete gunung:", error);
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Gagal menghapus: Gunung ini memiliki data terkait (jalur, ulasan). Hapus data terkait terlebih dahulu.",
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllMountains,
  getMountainById,
  createMountain,
  updateMountain,
  deleteMountain,
};
