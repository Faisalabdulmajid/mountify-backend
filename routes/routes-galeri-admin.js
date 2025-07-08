const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");
const { uploadGaleri } = require("../config/multer");

// ===================================
// ADMIN ROUTES - GALLERY MANAGEMENT
// ===================================

// GET all gallery items
router.get("/gallery", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const query = `
        SELECT 
          g.id_foto AS id_galeri, g.url_foto AS url_gambar, g.judul, g.deskripsi_foto AS deskripsi,
          g.diunggah_pada AS uploaded_at, gn.nama_gunung, u.username AS penulis
        FROM galeri g
        LEFT JOIN gunung gn ON g.id_gunung = gn.id_gunung
        LEFT JOIN users u ON g.id_penulis = u.id_user
        ORDER BY g.diunggah_pada DESC
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching gallery items:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data galeri." });
  }
});

router.post(
  "/gallery",
  authenticateToken,
  authorizeAdmin,
  uploadGaleri.single("foto"),
  async (req, res) => {
    try {
      const { judul, deskripsi, id_gunung } = req.body;
      const id_penulis = req.user.id;
      if (!req.file || !judul) {
        return res
          .status(400)
          .json({ message: "Judul dan File Gambar wajib diisi." });
      }
      // Sanitasi input
      const cleanJudul = sanitizeInput(judul);
      const cleanDeskripsi = sanitizeInput(deskripsi);
      const url_foto = `/uploads/galeri/${req.file.filename}`;
      const finalIdGunung = id_gunung ? parseInt(id_gunung, 10) : null;
      const result = await pool.query(
        `INSERT INTO galeri (judul, deskripsi_foto, id_gunung, url_foto, id_penulis) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [cleanJudul, cleanDeskripsi, finalIdGunung, url_foto, id_penulis]
      );
      res
        .status(201)
        .json({ message: "Foto berhasil diunggah!", item: result.rows[0] });
    } catch (error) {
      logger.error("Error uploading gallery item:", error);
      res.status(500).json({ message: "Gagal mengunggah foto." });
    }
  }
);

router.delete(
  "/gallery/:id_galeri",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    try {
      const { id_galeri } = req.params;
      const fileResult = await pool.query(
        "SELECT url_foto FROM galeri WHERE id_foto = $1",
        [id_galeri]
      );
      if (fileResult.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "Item galeri tidak ditemukan." });
      }
      const url_gambar = fileResult.rows[0].url_foto;
      const deleteResult = await pool.query(
        "DELETE FROM galeri WHERE id_foto = $1 RETURNING judul",
        [id_galeri]
      );
      if (url_gambar) {
        const filePath = path.join(__dirname, "public", url_gambar);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.json({
        message: `Foto '${deleteResult.rows[0].judul}' berhasil dihapus.`,
      });
    } catch (error) {
      logger.error("Error deleting gallery item:", error);
      res.status(500).json({ message: "Server error saat menghapus foto." });
    }
  }
);

module.exports = router;
