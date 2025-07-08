const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const logger = require("../logger");
const path = require("path");
const fs = require("fs");

// Stats Controllers
const getStats = async (req, res) => {
  try {
    const [userCount, gunungCount, jalurCount, poiCount, artikelCount] =
      await Promise.all([
        pool.query("SELECT COUNT(*) FROM users"),
        pool.query("SELECT COUNT(*) FROM gunung"),
        pool.query("SELECT COUNT(*) FROM jalur_pendakian"),
        pool.query("SELECT COUNT(*) FROM titik_penting"),
        pool.query("SELECT COUNT(*) FROM artikel WHERE status = 'Published'"),
      ]);
    res.json({
      total_pengguna: parseInt(userCount.rows[0].count, 10),
      total_gunung: parseInt(gunungCount.rows[0].count, 10),
      total_jalur: parseInt(jalurCount.rows[0].count, 10),
      total_poi: parseInt(poiCount.rows[0].count, 10),
      total_artikel: parseInt(artikelCount.rows[0].count, 10),
    });
  } catch (error) {
    logger.error("Error fetching stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserGrowth = async (req, res) => {
  try {
    const query = `
      SELECT
          TO_CHAR(date_series, 'YYYY-MM-DD') AS tanggal,
          COUNT(u.id_user) AS jumlah
      FROM 
          generate_series(
              CURRENT_DATE - INTERVAL '6 days', 
              CURRENT_DATE, 
              '1 day'
          ) AS date_series
      LEFT JOIN 
          users u ON DATE_TRUNC('day', u.created_at) = date_series
      GROUP BY 
          date_series
      ORDER BY 
          date_series ASC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching user growth data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getPendingItems = async (req, res) => {
  try {
    const pendingReviewsRes = await pool.query(
      "SELECT COUNT(*) FROM ulasan WHERE status = 'pending'"
    );
    const pendingReportsRes = await pool.query(
      "SELECT COUNT(*) FROM laporan_error WHERE status_laporan = 'Baru'"
    );
    res.json({
      pending_reviews: parseInt(pendingReviewsRes.rows[0].count, 10),
      pending_reports: parseInt(pendingReportsRes.rows[0].count, 10),
    });
  } catch (error) {
    logger.error("Error fetching pending items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const query = `
          ( SELECT 'user_baru' as type, u.nama_lengkap as title, u.created_at as timestamp, u.peran::character varying as details FROM users u ORDER BY u.created_at DESC LIMIT 5 )
          UNION ALL
          ( SELECT 'artikel_baru' as type, a.judul as title, a.created_at as timestamp, us.nama_lengkap as details FROM artikel a JOIN users us ON a.id_penulis = us.id_user ORDER BY a.created_at DESC LIMIT 5 )
          ORDER BY timestamp DESC
          LIMIT 5;
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// User Management Controllers
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_user, nama_lengkap, username, email, peran, status, terakhir_online, domisili, instansi, nomor_telepon, url_foto_profil, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id_user } = req.params;
    const result = await pool.query(
      "SELECT id_user, nama_lengkap, username, email, peran, status, domisili, instansi, nomor_telepon, url_foto_profil FROM users WHERE id_user = $1",
      [id_user]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching single user:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

const createUser = async (req, res) => {
  try {
    const {
      nama_lengkap,
      username,
      email,
      password,
      domisili,
      instansi,
      nomor_telepon,
      peran,
      status,
    } = req.body;

    if (
      !nama_lengkap ||
      !username ||
      !email ||
      !password ||
      !peran ||
      !status
    ) {
      return res.status(400).json({
        message:
          "Field wajib (nama, username, email, password, peran, status) harus diisi.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const url_foto_profil = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : null;

    const newUserResult = await pool.query(
      `INSERT INTO users (nama_lengkap, username, email, password_hash, peran, status, domisili, instansi, nomor_telepon, url_foto_profil) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_user`,
      [
        nama_lengkap,
        username,
        email,
        hashedPassword,
        peran,
        status,
        domisili,
        instansi,
        nomor_telepon,
        url_foto_profil,
      ]
    );

    res.status(201).json({
      message: "Pengguna baru berhasil ditambahkan!",
      user: newUserResult.rows[0],
    });
  } catch (error) {
    logger.error("Error adding user:", error);
    if (error.code === "23505") {
      return res.status(409).json({
        message: `Gagal: ${
          error.constraint.includes("email") ? "Email" : "Username"
        } sudah terdaftar.`,
      });
    }
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat menambahkan pengguna.",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id_user } = req.params;
    const {
      nama_lengkap,
      email,
      domisili,
      instansi,
      nomor_telepon,
      peran,
      status,
    } = req.body;

    if (!nama_lengkap || !email || !peran || !status) {
      return res
        .status(400)
        .json({ message: "Nama, Email, Peran, dan Status wajib diisi." });
    }

    const result = await pool.query(
      `UPDATE users SET nama_lengkap = $1, email = $2, domisili = $3, instansi = $4, nomor_telepon = $5, peran = $6, status = $7 
       WHERE id_user = $8 RETURNING id_user, nama_lengkap, email, peran, status`,
      [
        nama_lengkap,
        email,
        domisili,
        instansi,
        nomor_telepon,
        peran,
        status,
        id_user,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    res.json({
      message: "Profil pengguna berhasil diperbarui!",
      user: result.rows[0],
    });
  } catch (error) {
    logger.error("Error updating user:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Email ini sudah digunakan oleh pengguna lain." });
    }
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat memperbarui pengguna.",
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id_user } = req.params;
    const { status } = req.body;

    if (!["Aktif", "Nonaktif", "Diblokir"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid." });
    }

    const result = await pool.query(
      "UPDATE users SET status = $1 WHERE id_user = $2 RETURNING id_user, status",
      [status, id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    res.json({
      message: `Status pengguna berhasil diubah menjadi ${status}`,
      user: result.rows[0],
    });
  } catch (error) {
    logger.error("Error updating user status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id_user } = req.params;

    const fileResult = await pool.query(
      "SELECT url_foto_profil FROM users WHERE id_user = $1",
      [id_user]
    );

    const result = await pool.query(
      "DELETE FROM users WHERE id_user = $1 RETURNING nama_lengkap",
      [id_user]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const url_foto_profil = fileResult.rows[0]?.url_foto_profil;
    if (url_foto_profil) {
      const filePath = path.join(__dirname, "../public", url_foto_profil);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      message: `Pengguna '${result.rows[0].nama_lengkap}' berhasil dihapus.`,
    });
  } catch (error) {
    logger.error("Error saat menghapus pengguna:", error);
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Gagal menghapus: Pengguna ini terikat dengan data lain (misalnya artikel). Hapus atau ubah data terkait terlebih dahulu.",
      });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

module.exports = {
  // Stats
  getStats,
  getUserGrowth,
  getPendingItems,
  getRecentActivity,
  // User Management
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};
