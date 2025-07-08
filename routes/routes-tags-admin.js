const express = require("express");
const router = express.Router();

// Import dependencies
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const pool = require("../config/database");
const logger = require("../logger");

// ===================================
// ADMIN ROUTES - TAGS MANAGEMENT
// ===================================

// GET all tags
router.get("/tags", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const query = `
        SELECT 
          t.id_tag, t.nama_tag, COUNT(at.id_artikel) AS jumlah_artikel
        FROM tags t
        LEFT JOIN artikel_tags at ON t.id_tag = at.id_tag
        GROUP BY t.id_tag, t.nama_tag
        ORDER BY t.nama_tag ASC
      `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching tags:", error);
    res.status(500).json({ message: "Server error saat mengambil data tags." });
  }
});

router.post("/tags", authenticateToken, authorizeAdmin, async (req, res) => {
  const { nama_tag } = req.body;
  if (!nama_tag || nama_tag.trim() === "") {
    return res.status(400).json({ message: "Nama tag wajib diisi." });
  }
  try {
    const result = await pool.query(
      "INSERT INTO tags (nama_tag) VALUES ($1) RETURNING *",
      [nama_tag.trim()]
    );
    res.status(201).json({
      message: "Tag baru berhasil ditambahkan!",
      tag: result.rows[0],
    });
  } catch (error) {
    logger.error("Error adding tag:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "Nama tag ini sudah ada." });
    }
    res.status(500).json({ message: "Server error saat menambahkan tag." });
  }
});

router.put(
  "/tags/:id_tag",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id_tag } = req.params;
    const { nama_tag } = req.body;
    if (!nama_tag || nama_tag.trim() === "") {
      return res.status(400).json({ message: "Nama tag wajib diisi." });
    }
    try {
      const result = await pool.query(
        "UPDATE tags SET nama_tag = $1 WHERE id_tag = $2 RETURNING *",
        [nama_tag.trim(), id_tag]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Tag tidak ditemukan." });
      }
      res.json({ message: "Tag berhasil diperbarui!", tag: result.rows[0] });
    } catch (error) {
      logger.error("Error updating tag:", error);
      if (error.code === "23505") {
        return res.status(409).json({ message: "Nama tag ini sudah ada." });
      }
      res.status(500).json({ message: "Server error saat memperbarui tag." });
    }
  }
);

router.delete(
  "/tags/:id_tag",
  authenticateToken,
  authorizeAdmin,
  async (req, res) => {
    const { id_tag } = req.params;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM artikel_tags WHERE id_tag = $1", [
        id_tag,
      ]);
      const deleteResult = await client.query(
        "DELETE FROM tags WHERE id_tag = $1 RETURNING nama_tag",
        [id_tag]
      );
      if (deleteResult.rowCount === 0) {
        throw new Error("Tag tidak ditemukan untuk dihapus.");
      }
      await client.query("COMMIT");
      res.json({
        message: `Tag '${deleteResult.rows[0].nama_tag}' berhasil dihapus.`,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error deleting tag:", error);
      res.status(500).json({ message: "Server error saat menghapus tag." });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
