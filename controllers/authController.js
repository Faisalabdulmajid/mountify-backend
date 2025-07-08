const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { JWT_SECRET_KEY, JWT_EXPIRES_IN } = require("../config/jwt");
const logger = require("../logger");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Konfigurasi transporter Nodemailer (gunakan variabel .env)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const register = async (req, res) => {
  try {
    const { nama_lengkap, username, email, password, domisili, instansi } =
      req.body;

    if (!nama_lengkap || !username || !email || !password) {
      return res.status(400).json({ message: "Field wajib harus diisi." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserResult = await pool.query(
      `INSERT INTO users (nama_lengkap, username, email, password_hash, peran, domisili, instansi) 
       VALUES ($1, $2, $3, $4, 'user', $5, $6) 
       RETURNING id_user, nama_lengkap, username, email, peran, status`,
      [nama_lengkap, username, email, hashedPassword, domisili, instansi]
    );

    res.status(201).json({
      message: "Registrasi berhasil!",
      user: newUserResult.rows[0],
    });
  } catch (error) {
    logger.error("Registration error:", error);
    if (error.code === "23505") {
      return res.status(409).json({
        message: `Gagal: ${
          error.constraint.includes("email") ? "Email" : "Username"
        } sudah terdaftar.`,
      });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

const login = async (req, res) => {
  try {
    console.log("🔑 Login attempt:", {
      email: req.body.email,
      hasPassword: !!req.body.password,
    });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi." });
    }

    const userResult = await pool.query(
      "SELECT id_user, nama_lengkap, email, password_hash, peran, status, url_foto_profil FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const user = userResult.rows[0];
    if (user.status !== "Aktif") {
      return res.status(403).json({
        message: `Akun Anda berstatus: ${user.status}. Hubungi admin.`,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    const payload = { id: user.id_user, email: user.email, peran: user.peran };
    const token = jwt.sign(payload, JWT_SECRET_KEY, {
      expiresIn: JWT_EXPIRES_IN,
    });

    await pool.query(
      "UPDATE users SET terakhir_online = NOW() WHERE id_user = $1",
      [user.id_user]
    );

    res.json({
      message: "Login berhasil!",
      token,
      user: {
        id: user.id_user,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        peran: user.peran,
        url_foto_profil: user.url_foto_profil,
      },
    });
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

// Forgot Password Handler
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email wajib diisi." });
  }
  try {
    // Cek apakah email terdaftar
    const userResult = await pool.query(
      "SELECT id_user, email FROM users WHERE email = $1",
      [email]
    );
    if (userResult.rows.length === 0) {
      // Untuk keamanan, tetap kirim pesan sukses walau email tidak ditemukan
      return res.json({
        message: "Jika email terdaftar, link reset telah dikirim.",
      });
    }
    // Generate token reset
    const resetToken = jwt.sign({ email }, JWT_SECRET_KEY, { expiresIn: "1h" });
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    // Kirim email reset password
    await transporter.sendMail({
      from: `"Mountify Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password Mountify",
      html: `<p>Klik link berikut untuk reset password:</p><a href="${resetLink}">${resetLink}</a>`,
    });
    return res.json({
      message: "Jika email terdaftar, link reset telah dikirim.",
    });
  } catch (err) {
    logger.error("Forgot password error:", err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
};
