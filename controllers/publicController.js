const pool = require("../config/database");
const logger = require("../logger");

// Get all mountains (public)
const getAllMountains = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_gunung, nama_gunung, ketinggian_puncak_mdpl, lokasi_administratif, url_thumbnail FROM gunung ORDER BY nama_gunung"
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching public mountains:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all trails (public)
const getAllTrails = async (req, res) => {
  try {
    const query = `
      SELECT 
          j.id_jalur, j.nama_jalur, g.nama_gunung, g.ketinggian_puncak_mdpl,
          j.kesulitan_skala, g.url_thumbnail
      FROM jalur_pendakian j
      JOIN gunung g ON j.id_gunung = g.id_gunung          
      ORDER BY g.nama_gunung, j.nama_jalur;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all public trails:", error);
    res
      .status(500)
      .json({ message: "Server error saat mengambil data semua jalur." });
  }
};

// Get trails by mountain ID (public)
const getTrailsByMountain = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM jalur_pendakian WHERE id_gunung = $1 ORDER BY nama_jalur",
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching trails by mountain:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all announcements (public)
const getAllAnnouncements = async (req, res) => {
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
          dibuat_pada DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all public announcements:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengambil pengumuman.",
    });
  }
};

// Get latest announcements (public)
const getLatestAnnouncements = async (req, res) => {
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
};

// Get announcement by ID (public)
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT
          id_pengumuman,
          judul,
          isi_pengumuman,
          dibuat_pada AS tanggal_publikasi,
          berlaku_mulai,
          berlaku_sampai
      FROM 
          pengumuman
      WHERE 
          id_pengumuman = $1
          AND status = 'Published' 
          AND NOW() BETWEEN berlaku_mulai AND berlaku_sampai
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pengumuman tidak ditemukan atau sudah tidak berlaku.",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching announcement by ID:", error);
    res.status(500).json({
      message:
        "Terjadi kesalahan pada server saat mengambil detail pengumuman.",
    });
  }
};

// Get all articles (public)
const getAllArticles = async (req, res) => {
  try {
    const query = `
      SELECT
        id_artikel,
        judul,
        ringkasan,
        isi_artikel,
        penulis,
        dibuat_pada AS tanggal_publikasi,
        slug
      FROM artikel
      WHERE status = 'Published'
      ORDER BY dibuat_pada DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    logger.error("Error fetching all public articles:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengambil artikel.",
    });
  }
};

// Get article by slug (public)
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const query = `
      SELECT
        id_artikel,
        judul,
        ringkasan,
        isi_artikel,
        penulis,
        dibuat_pada AS tanggal_publikasi,
        slug
      FROM artikel
      WHERE status = 'Published' AND slug = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Artikel tidak ditemukan." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Error fetching article by slug:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengambil detail artikel.",
    });
  }
};

// POST laporan error (public, harus login)
const postLaporanError = async (req, res) => {
  try {
    const { judul_laporan, deskripsi_laporan, halaman_error } = req.body;
    const id_pelapor = req.user.id;
    const url_screenshot = req.file
      ? `/uploads/laporan-error/${req.file.filename}`
      : null;
    if (!judul_laporan || !deskripsi_laporan) {
      return res
        .status(400)
        .json({ message: "Judul dan Deskripsi laporan wajib diisi." });
    }
    const result = await pool.query(
      "INSERT INTO laporan_error (id_pelapor, judul_laporan, deskripsi_laporan, halaman_error, url_screenshot) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        id_pelapor,
        judul_laporan,
        deskripsi_laporan,
        halaman_error,
        url_screenshot,
      ]
    );
    res.status(201).json({
      message: "Laporan Anda telah berhasil dikirim. Terima kasih!",
      laporan: result.rows[0],
    });
  } catch (error) {
    logger.error("Error creating bug report (public):", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat mengirim laporan." });
  }
};

// Get mountain detail by ID (public)
const getMountainDetailPublic = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({ message: "ID gunung tidak valid." });
    }
    const result = await pool.query(
      "SELECT * FROM gunung WHERE id_gunung = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data gunung tidak ditemukan." });
    }
    let gunung = result.rows[0];
    // Hilangkan field tingkat kesulitan gunung jika ada
    if (gunung.hasOwnProperty("tingkat_kesulitan"))
      delete gunung.tingkat_kesulitan;
    if (gunung.hasOwnProperty("kesulitan")) delete gunung.kesulitan;

    // Proses lokasi_administratif agar provinsi tidak diulang
    if (
      gunung.lokasi_administratif &&
      typeof gunung.lokasi_administratif === "string"
    ) {
      try {
        // Split lokasi menjadi array
        let lokasiArr = gunung.lokasi_administratif
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        // Ekstrak provinsi dari setiap elemen
        let provinsiSet = new Set();
        let kabupatenArr = [];
        lokasiArr.forEach((lok) => {
          let parts = lok.split(",");
          if (parts.length > 1) {
            let prov = parts[1].trim();
            provinsiSet.add(prov);
            kabupatenArr.push(parts[0].trim());
          } else {
            kabupatenArr.push(lok.trim());
          }
        });
        // Jika hanya satu provinsi, gabungkan kabupaten dan provinsi sekali di akhir
        if (provinsiSet.size === 1) {
          gunung.lokasi_administratif =
            kabupatenArr.join("; ") + ", " + Array.from(provinsiSet)[0];
        } else {
          // Jika lebih dari satu provinsi, tampilkan seperti semula
          gunung.lokasi_administratif = lokasiArr.join("; ");
        }
      } catch (e) {
        // Jika parsing gagal, biarkan lokasi_administratif apa adanya
      }
    }
    // Tambahkan penjelasan untuk field utama
    gunung.penjelasan_field = {
      nama_gunung: "Nama resmi gunung.",
      ketinggian_puncak_mdpl:
        "Ketinggian puncak gunung di atas permukaan laut (mdpl).",
      lokasi_administratif:
        "Wilayah administratif (kabupaten/kota, provinsi) tempat gunung berada.",
      url_thumbnail: "Gambar representatif gunung.",
    };

    // Query jalur pendakian untuk gunung ini
    let jalurResult = { rows: [] };
    try {
      jalurResult = await pool.query(
        "SELECT * FROM jalur_pendakian WHERE id_gunung = $1 ORDER BY nama_jalur",
        [id]
      );
    } catch (e) {
      // Jika error, jalurResult.rows tetap []
    }
    gunung.jalur_pendakian = jalurResult.rows;

    // Pastikan field deskripsi_singkat selalu ada (string kosong jika null/undefined)
    if (!gunung.deskripsi_singkat) {
      gunung.deskripsi_singkat = "";
    }
    // Pastikan field url_thumbnail selalu ada (string kosong jika null/undefined)
    if (!gunung.url_thumbnail) {
      gunung.url_thumbnail = "";
    }
    // Pastikan field lokasi_administratif selalu ada (string kosong jika null/undefined)
    if (!gunung.lokasi_administratif) {
      gunung.lokasi_administratif = "";
    }
    // Pastikan field galeri/foto selalu ada (array kosong jika null/undefined)
    if (!gunung.galeri && !gunung.gallery && !gunung.foto) {
      gunung.galeri = [];
    } else if (typeof gunung.galeri === "string") {
      // Jika galeri berupa string JSON, coba parse
      try {
        gunung.galeri = JSON.parse(gunung.galeri);
        if (!Array.isArray(gunung.galeri)) gunung.galeri = [];
      } catch (e) {
        logger.error("Error parsing galeri field:", e);
        gunung.galeri = [];
      }
    } else if (!Array.isArray(gunung.galeri)) {
      gunung.galeri = [];
    }

    res.json(gunung);
  } catch (error) {
    logger.error("Error fetching public mountain detail:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get trail detail by ID (public)
const getTrailDetailPublic = async (req, res) => {
  try {
    const { id_jalur } = req.params;
    const result = await pool.query(
      `SELECT j.*, g.id_gunung, g.nama_gunung, g.ketinggian_puncak_mdpl, g.url_thumbnail
       FROM jalur_pendakian j
       JOIN gunung g ON j.id_gunung = g.id_gunung
       WHERE j.id_jalur = $1`,
      [id_jalur]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Data jalur tidak ditemukan." });
    }
    const row = result.rows[0];
    // Strukturkan response agar lebih rapi
    const response = {
      jalur: {
        id_jalur: row.id_jalur,
        nama_jalur: row.nama_jalur,
        kesulitan_skala: row.kesulitan_skala,
        panjang_jalur_km: row.panjang_jalur_km,
        estimasi_waktu: row.estimasi_waktu,
        deskripsi: row.deskripsi || "",
        titik_mulai: row.titik_mulai || "",
        titik_akhir: row.titik_akhir || "",
        elevasi_awal: row.elevasi_awal,
        elevasi_akhir: row.elevasi_akhir,
        status: row.status,
        // Tambahkan field lain jika ada
      },
      gunung: {
        id_gunung: row.id_gunung,
        nama_gunung: row.nama_gunung,
        ketinggian_puncak_mdpl: row.ketinggian_puncak_mdpl,
        url_thumbnail: row.url_thumbnail || "",
      },
      penjelasan_field: {
        nama_jalur: "Nama jalur pendakian.",
        kesulitan_skala:
          "Tingkat kesulitan jalur (misal: Mudah, Sedang, Sulit).",
        panjang_jalur_km: "Panjang jalur dalam kilometer.",
        estimasi_waktu: "Estimasi waktu tempuh jalur (jam/menit).",
        deskripsi: "Deskripsi singkat jalur.",
        titik_mulai: "Titik awal pendakian.",
        titik_akhir: "Titik akhir jalur (biasanya puncak atau pos terakhir).",
        elevasi_awal: "Ketinggian titik awal (mdpl).",
        elevasi_akhir: "Ketinggian titik akhir (mdpl).",
        status: "Status jalur (misal: Dibuka, Ditutup, Perlu konfirmasi).",
        nama_gunung: "Nama gunung yang memiliki jalur ini.",
        ketinggian_puncak_mdpl: "Ketinggian puncak gunung (mdpl).",
        url_thumbnail: "Gambar representatif gunung.",
      },
    };
    res.json(response);
  } catch (error) {
    logger.error("Error fetching public trail detail:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllMountains,
  getAllTrails,
  getTrailsByMountain,
  getAllAnnouncements,
  getLatestAnnouncements,
  getAnnouncementById,
  getAllArticles,
  getArticleBySlug,
  postLaporanError,
  getMountainDetailPublic,
  getTrailDetailPublic,
};
