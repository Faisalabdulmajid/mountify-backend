const express = require("express");
const router = express.Router();

// Import dependencies
const pool = require("../config/database");
const logger = require("../logger");

// ===================================
// PUBLIC ROUTES (GET DATA)
// ===================================
router.get("/gunung", async (req, res) => {
  try {
    console.log("🔍 GET /api/gunung dipanggil");
    const result = await pool.query(
      "SELECT id_gunung, nama_gunung, ketinggian_puncak_mdpl, lokasi_administratif, url_thumbnail FROM gunung ORDER BY nama_gunung"
    );
    console.log("📊 Result gunung count:", result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching gunung:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/jalur", async (req, res) => {
  try {
    const query = `
            SELECT 
                j.id_jalur, j.nama_jalur, g.nama_gunung, g.ketinggian_puncak_mdpl,
                j.kesulitan_skala, g.url_thumbnail, j.id_gunung
            FROM jalur_pendakian j
            JOIN gunung g ON j.id_gunung = g.id_gunung          
            ORDER BY g.nama_gunung, j.nama_jalur;
        `;
    const result = await pool.query(query);
    console.log("📋 Public jalur data fetched:", result.rows.length, "records");
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all public trails:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data semua jalur." });
  }
});

router.get("/gunung/:id/jalur", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT *, id_gunung FROM jalur_pendakian WHERE id_gunung = $1 ORDER BY nama_jalur",
      [id]
    );
    console.log(
      `📋 Public jalur for gunung ${id}:`,
      result.rows.length,
      "records"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/pengumuman", async (req, res) => {
  try {
    const query = `
            SELECT
                id_pengumuman, judul, isi_pengumuman AS ringkasan, dibuat_pada AS tanggal_publikasi
            FROM pengumuman
            WHERE status = 'Published' AND NOW() BETWEEN berlaku_mulai AND berlaku_sampai
            ORDER BY dibuat_pada DESC;
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching public announcements:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengambil pengumuman.",
    });
  }
});

router.get("/pengumuman/terbaru", async (req, res) => {
  try {
    const query = `
        SELECT
            id_pengumuman,
            judul,
            isi_pengumuman AS ringkasan,
            dibuat_pada AS tanggal_publikasi
        FROM 
            pengumuman
        WHERE 
            status = 'Published' 
            AND NOW() BETWEEN berlaku_mulai AND berlaku_sampai
        ORDER BY 
            dibuat_pada DESC
        LIMIT 3; 
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching latest public announcements:", error);
    res.status(500).json({
      message:
        "Terjadi kesalahan pada server saat mengambil pengumuman terbaru.",
    });
  }
});

router.get("/pengumuman/:id_pengumuman", async (req, res) => {
  try {
    const { id_pengumuman } = req.params;
    const query = `
            SELECT
                p.id_pengumuman, p.judul, p.isi_pengumuman,
                p.dibuat_pada AS tanggal_publikasi, u.nama_lengkap AS nama_penulis
            FROM pengumuman p
            JOIN users u ON p.dibuat_oleh = u.id_user
            WHERE p.id_pengumuman = $1 AND p.status = 'Published'
        `;
    const result = await pool.query(query, [id_pengumuman]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan atau belum dipublikasikan.",
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching single announcement:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// --- Endpoint untuk mengambil SEMUA artikel yang sudah dipublikasikan ---
router.get("/artikel", async (req, res) => {
  try {
    const query = `
            SELECT
                a.id_artikel,
                a.judul,
                a.slug,
                a.isi_artikel AS ringkasan,
                a.url_gambar_utama,
                a.published_at AS tanggal_publikasi,
                u.nama_lengkap AS penulis,
                a.kategori
            FROM artikel a
            JOIN users u ON a.id_penulis = u.id_user
            WHERE a.status = 'Published'
            ORDER BY a.published_at DESC;
        `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching public articles:", error);
    res.status(500).json({ message: "Gagal mengambil data artikel." });
  }
});

// --- Endpoint untuk mengambil DETAIL satu artikel berdasarkan SLUG ---
router.get("/artikel/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    // Query untuk detail artikel
    const articleQuery = `
            SELECT
                a.id_artikel, a.judul, a.slug, a.isi_artikel, a.url_gambar_utama,
                a.published_at AS tanggal_publikasi, a.kategori,
                u.nama_lengkap AS penulis
            FROM artikel a
            JOIN users u ON a.id_penulis = u.id_user
            WHERE a.slug = $1 AND a.status = 'Published';
        `;
    const articleResult = await pool.query(articleQuery, [slug]);

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }

    const article = articleResult.rows[0];

    // Query untuk mengambil tags terkait
    const tagsQuery = `
            SELECT t.nama_tag
            FROM tags t
            JOIN artikel_tags at ON t.id_tag = at.id_tag
            WHERE at.id_artikel = $1;
        `;
    const tagsResult = await pool.query(tagsQuery, [article.id_artikel]);

    article.tags = tagsResult.rows.map((row) => row.nama_tag);

    res.json(article);
  } catch (error) {
    logger.error("Error fetching single article:", error);
    res.status(500).json({ message: "Gagal mengambil detail artikel." });
  }
});

module.exports = router;
