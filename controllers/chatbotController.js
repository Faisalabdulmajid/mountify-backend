const dialogflowService = require("../services/dialogflowService");
const recommendationService = require("../services/recommendationService");
const logger = require("../logger");

const dialogflowProxy = async (req, res) => {
  try {
    const { text, sessionId } = req.body;

    if (!dialogflowService.isReady()) {
      return res.status(500).json({
        message: "Konfigurasi server untuk chatbot belum lengkap.",
      });
    }

    const result = await dialogflowService.detectIntent(text, sessionId);

    res.status(200).json({
      fulfillmentText: result.fulfillmentText,
      fulfillmentMessages: result.fulfillmentMessages,
    });
  } catch (error) {
    logger.error("ERROR (Dialogflow Proxy):", error);
    res.status(500).json({ message: "Error berkomunikasi dengan Dialogflow" });
  }
};

const chatbotWebhook = async (req, res) => {
  try {
    // 1. Ambil parameter dari request Dialogflow
    const params = req.body.queryResult.parameters;
    logger.info("Webhook dipanggil dengan parameter dari Dialogflow:", params);

    // 2. Terjemahkan parameter Dialogflow ke format yang dimengerti Python
    const filtersForPython =
      recommendationService.translateDialogflowParams(params);

    // 3. Dapatkan rekomendasi dari service
    const finalResult = await recommendationService.getRecommendations(
      filtersForPython
    );

    // 4. Format hasil dari Python ke dalam format respon Dialogflow
    const recommendations = finalResult.rekomendasi_gunung || [];
    const response =
      recommendationService.formatDialogflowResponse(recommendations);

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error pada chatbot webhook:", error);
    res.json({
      fulfillmentText:
        "Maaf, terjadi masalah saat menghitung rekomendasi. Coba lagi nanti.",
    });
  }
};

module.exports = {
  dialogflowProxy,
  chatbotWebhook,
};
