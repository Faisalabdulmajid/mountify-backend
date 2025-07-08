const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const logger = require("../logger");
const path = require("path");
const fs = require("fs");

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_user, nama_lengkap, username, email, peran, status, domisili, instansi, nomor_telepon, url_foto_profil, created_at FROM users WHERE id_user = $1",
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching profile:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, nama_lengkap, email, domisili, instansi, nomor_telepon } =
      req.body;
    const { id } = req.user;

    const result = await pool.query(
      `UPDATE users SET username = $1, nama_lengkap = $2, email = $3, domisili = $4, instansi = $5, nomor_telepon = $6, updated_at = NOW() 
       WHERE id_user = $7 RETURNING id_user, username, nama_lengkap, email`,
      [username, nama_lengkap, email, domisili, instansi, nomor_telepon, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    res.json({ message: "Profil berhasil diperbarui!", user: result.rows[0] });
  } catch (error) {
    logger.error("Error updating profile data:", error);
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "Email atau username sudah digunakan." });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id } = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Semua field wajib diisi." });
    }

    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id_user = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Password saat ini salah." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id_user = $2",
      [hashedPassword, id]
    );

    res.json({ message: "Password berhasil diperbarui!" });
  } catch (error) {
    logger.error("Error updating password:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File avatar tidak ditemukan." });
    }

    const id_user = req.user.id;
    const newAvatarPath = `/uploads/avatars/${req.file.filename}`;

    const oldDataResult = await pool.query(
      "SELECT url_foto_profil FROM users WHERE id_user = $1",
      [id_user]
    );
    const oldAvatarPath = oldDataResult.rows[0]?.url_foto_profil;

    const result = await pool.query(
      "UPDATE users SET url_foto_profil = $1, updated_at = NOW() WHERE id_user = $2 RETURNING id_user, url_foto_profil",
      [newAvatarPath, id_user]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    if (oldAvatarPath) {
      const fullOldPath = path.join(__dirname, "../public", oldAvatarPath);
      if (fs.existsSync(fullOldPath)) {
        fs.unlinkSync(fullOldPath);
      }
    }

    res.json({
      message: "Foto profil berhasil diperbarui!",
      user: result.rows[0],
    });
  } catch (error) {
    logger.error("Error updating avatar:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat memperbarui avatar.",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
};
