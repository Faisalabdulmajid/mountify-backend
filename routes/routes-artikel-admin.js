const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");
const { uploadArtikelImg } = require("../config/multer");
const { createSlug } = require("../utils/helpers");

// =================================================================
// ADMIN ROUTES - ARTICLE MANAGEMENT
// =================================================================

// GET all articles
router.get("/artikel", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*, 
        u.nama as penulis,
        COUNT(k.id_komentar) as jumlah_komentar
      FROM artikel a
      LEFT JOIN users u ON a.id_penulis = u.id_user
      LEFT JOIN komentar k ON a.id_artikel = k.id_artikel
      GROUP BY a.id_artikel, u.nama
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching articles:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data artikel." });
  }
});

// GET single article
router.get(
  "/artikel/:id",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT * FROM artikel WHERE id_artikel = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Artikel tidak ditemukan." });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error fetching single article:", error);
      res.status(500).json({ message: "Server error." });
    }
  }
);

// POST create article
router.post(
  "/artikel",
  authenticateToken,
  authorizeAdmin,
  uploadArtikelImg.single("foto_utama"),
  async (req, res) => {
    try {
      const { judul, isi_artikel, status, kategori } = req.body;
      const id_penulis = req.user.id;
      if (!judul || !isi_artikel) {
        return res
          .status(400)
          .json({ message: "Judul dan isi artikel wajib diisi." });
      }
      const slug = createSlug(judul);
      const url_gambar_utama = req.file
        ? `/uploads/artikel/${req.file.filename}`
        : null;
      const published_at = status === "Published" ? new Date() : null;
      const result = await pool.query(
        `INSERT INTO artikel (judul, slug, isi_artikel, id_penulis, status, kategori, url_gambar_utama, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          judul,
          slug,
          isi_artikel,
          id_penulis,
          status,
          kategori,
          url_gambar_utama,
          published_at,
        ]
      );
      res
        .status(201)
        .json({ message: "Artikel berhasil dibuat.", artikel: result.rows[0] });
    } catch (error) {
      logger.error("Error saat membuat artikel:", error);
      if (error.code === "23505" && error.constraint === "artikel_slug_key") {
        return res
          .status(409)
          .json({ message: "Judul artikel ini sudah ada (slug duplikat)." });
      }
      res.status(500).json({
        message: "Terjadi kesalahan pada server saat membuat artikel.",
      });
    }
  }
);

// GET all articles (additional endpoint)
router.get("/articles", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const query = `
        SELECT a.id_artikel, a.judul, a.status, a.updated_at, a.kategori, u.username AS penulis
        FROM artikel a
        LEFT JOIN users u ON a.id_penulis = u.id_user
        ORDER BY a.updated_at DESC
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error saat mengambil semua artikel:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single article (additional endpoint)
router.get(
  "/articles/:id_artikel",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_artikel } = req.params;
      const result = await pool.query(
        "SELECT id_artikel, judul, kategori, status, isi_artikel, url_gambar_utama FROM artikel WHERE id_artikel = $1",
        [id_artikel]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Artikel tidak ditemukan." });
      }
      res.json(result.rows[0]);
    } catch (error) {
      logger.error("Error saat mengambil satu artikel:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// PUT update article (additional endpoint)
router.put(
  "/articles/:id_artikel",
  authenticateToken,
  authorizeAdmin,
  uploadArtikelImg.single("foto_utama"),
  async (req, res) => {
    try {
      const { id_artikel } = req.params;
      const { judul, kategori, status, isi_artikel } = req.body;
      const slug = createSlug(judul);
      const oldData = await pool.query(
        "SELECT url_gambar_utama FROM artikel WHERE id_artikel = $1",
        [id_artikel]
      );
      let url_gambar_utama = oldData.rows[0]?.url_gambar_utama;
      if (req.file) {
        if (url_gambar_utama) {
          const oldPath = path.join(__dirname, "public", url_gambar_utama);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        url_gambar_utama = `/uploads/artikel/${req.file.filename}`;
      }
      const result = await pool.query(
        `UPDATE artikel SET 
           judul = $1, kategori = $2, status = $3, isi_artikel = $4, url_gambar_utama = $5, slug = $6
         WHERE id_artikel = $7 RETURNING *`,
        [
          judul,
          kategori,
          status,
          isi_artikel,
          url_gambar_utama,
          slug,
          id_artikel,
        ]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Artikel tidak ditemukan." });
      }
      res.json({
        message: "Artikel berhasil diperbarui!",
        artikel: result.rows[0],
      });
    } catch (error) {
      logger.error("Error saat memperbarui artikel:", error);
      if (error.code === "23505" && error.constraint === "artikel_slug_key") {
        return res
          .status(409)
          .json({ message: "Judul artikel ini sudah ada (slug duplikat)." });
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE article (additional endpoint)
router.delete(
  "/articles/:id_artikel",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_artikel } = req.params;
      const fileResult = await pool.query(
        "SELECT url_gambar_utama FROM artikel WHERE id_artikel = $1",
        [id_artikel]
      );
      const result = await pool.query(
        "DELETE FROM artikel WHERE id_artikel = $1 RETURNING judul",
        [id_artikel]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Artikel tidak ditemukan." });
      }
      const url_gambar_utama = fileResult.rows[0]?.url_gambar_utama;
      if (url_gambar_utama) {
        const filePath = path.join(__dirname, "public", url_gambar_utama);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      res.json({
        message: `Artikel '${result.rows[0].judul}' berhasil dihapus.`,
      });
    } catch (error) {
      logger.error("Error saat menghapus artikel:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
