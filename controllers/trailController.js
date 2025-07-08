const pool = require("../config/database");
const logger = require("../logger");

// Konstanta enum untuk validasi
const ALLOWED_STATUS_JALUR = [
  "Belum Diketahui",
  "Buka",
  "Tutup Sementara",
  "Tutup",
];

// Get all trails with mountain info
const getAllTrails = async (req, res) => {
  try {
    const query = `
      SELECT 
          j.id_jalur, j.nama_jalur, g.nama_gunung, g.ketinggian_puncak_mdpl,
          j.kesulitan_skala, j.status_jalur, j.lokasi_pintu_masuk, j.estimasi_waktu_jam,
          j.ketersediaan_sumber_air_skala, j.variasi_lanskap_skala, j.perlindungan_angin_kemah_skala,
          j.jaringan_komunikasi_skala, j.tingkat_insiden_skala
      FROM jalur_pendakian j
      JOIN gunung g ON j.id_gunung = g.id_gunung
      ORDER BY j.id_jalur DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all jalur:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data jalur." });
  }
};

// Get single trail by ID
const getTrailById = async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
};

// Create new trail
const createTrail = async (req, res) => {
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
      ketersediaan_sumber_air_skala,
      variasi_lanskap_skala,
      perlindungan_angin_kemah_skala,
      jaringan_komunikasi_skala,
      tingkat_insiden_skala,
    } = req.body;

    if (!id_gunung || !nama_jalur) {
      return res
        .status(400)
        .json({ message: "ID Gunung dan Nama Jalur wajib diisi." });
    }

    if (!ALLOWED_STATUS_JALUR.includes(status_jalur)) {
      return res.status(400).json({
        message: `Status jalur tidak valid. Pilih salah satu: ${ALLOWED_STATUS_JALUR.join(
          ", "
        )}`,
      });
    }

    const result = await pool.query(
      `INSERT INTO jalur_pendakian (id_gunung, nama_jalur, lokasi_pintu_masuk, kesulitan_skala, keamanan_skala, kualitas_fasilitas_skala, kualitas_kemah_skala, keindahan_pemandangan_skala, estimasi_waktu_jam, deskripsi_jalur, status_jalur, ketersediaan_sumber_air_skala, variasi_lanskap_skala, perlindungan_angin_kemah_skala, jaringan_komunikasi_skala, tingkat_insiden_skala) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
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
        ketersediaan_sumber_air_skala,
        variasi_lanskap_skala,
        perlindungan_angin_kemah_skala,
        jaringan_komunikasi_skala,
        tingkat_insiden_skala,
      ]
    );

    res.status(201).json({
      message: "Jalur pendakian berhasil ditambahkan",
      jalur: result.rows[0],
    });
  } catch (error) {
    logger.error("Error add jalur:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Nama jalur ini sudah ada untuk gunung tersebut." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Update trail
const updateTrail = async (req, res) => {
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
      ketersediaan_sumber_air_skala,
      variasi_lanskap_skala,
      perlindungan_angin_kemah_skala,
      jaringan_komunikasi_skala,
      tingkat_insiden_skala,
    } = req.body;

    if (!id_gunung || !nama_jalur) {
      return res
        .status(400)
        .json({ message: "ID Gunung dan Nama Jalur wajib diisi." });
    }

    if (!ALLOWED_STATUS_JALUR.includes(status_jalur)) {
      return res.status(400).json({
        message: `Status jalur tidak valid. Pilih salah satu: ${ALLOWED_STATUS_JALUR.join(
          ", "
        )}`,
      });
    }

    const result = await pool.query(
      `UPDATE jalur_pendakian 
       SET id_gunung = $1, nama_jalur = $2, lokasi_pintu_masuk = $3, kesulitan_skala = $4, 
           keamanan_skala = $5, kualitas_fasilitas_skala = $6, kualitas_kemah_skala = $7, 
           keindahan_pemandangan_skala = $8, estimasi_waktu_jam = $9, deskripsi_jalur = $10, 
           status_jalur = $11, ketersediaan_sumber_air_skala = $12, variasi_lanskap_skala = $13, 
           perlindungan_angin_kemah_skala = $14, jaringan_komunikasi_skala = $15, 
           tingkat_insiden_skala = $16
       WHERE id_jalur = $17 RETURNING *`,
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
        ketersediaan_sumber_air_skala,
        variasi_lanskap_skala,
        perlindungan_angin_kemah_skala,
        jaringan_komunikasi_skala,
        tingkat_insiden_skala,
        id_jalur,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data jalur tidak ditemukan." });
    }

    res.json({
      message: "Data jalur berhasil diperbarui",
      jalur: result.rows[0],
    });
  } catch (error) {
    logger.error("Error update jalur:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Nama jalur ini sudah ada untuk gunung tersebut." });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Delete trail
const deleteTrail = async (req, res) => {
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
    logger.error("Error delete jalur:", error);
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Gagal menghapus: Jalur ini memiliki data terkait (ulasan, POI). Hapus data terkait terlebih dahulu.",
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllTrails,
  getTrailById,
  createTrail,
  updateTrail,
  deleteTrail,
};
