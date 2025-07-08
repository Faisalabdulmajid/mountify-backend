const recommendationService = require("../services/recommendationService");
const logger = require("../logger");

const getRecommendations = async (req, res) => {
  try {
    const preferensiPengguna = req.body;
    logger.info(
      "Menerima & MEMPROSES permintaan rekomendasi GUNUNG via form:",
      preferensiPengguna
    );

    const finalResult = await recommendationService.getRecommendations(
      preferensiPengguna
    );

    // Kirim hasil rekomendasi gunung ke frontend
    res.json({
      recommendations: finalResult.rekomendasi_gunung || [],
      metadata: finalResult.metadata || {},
    });
  } catch (error) {
    logger.error("Error pada endpoint rekomendasi-gunung:", error);
    res.status(500).json({
      message: error.message || "Terjadi kesalahan pada server.",
      recommendations: [],
    });
  }
};

const getTrailRecommendations = async (req, res) => {
  try {
    const preferensiPengguna = req.body;
    logger.info(
      "Menerima & MEMPROSES permintaan rekomendasi JALUR via form:",
      preferensiPengguna
    );

    const finalResult = await recommendationService.getRecommendations(
      preferensiPengguna
    );

    // Kirim hasil rekomendasi jalur ke frontend
    res.json({
      recommendations: finalResult.rekomendasi_jalur || [],
      metadata: finalResult.metadata || {},
    });
  } catch (error) {
    logger.error("Error pada endpoint rekomendasi-jalur:", error);
    res.status(500).json({
      message: error.message || "Terjadi kesalahan pada server.",
      recommendations: [],
    });
  }
};

module.exports = {
  getRecommendations,
  getTrailRecommendations,
};
