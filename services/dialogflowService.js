const dialogflow = require("@google-cloud/dialogflow");
const path = require("path");
const fs = require("fs");
const logger = require("../logger");

class DialogflowService {
  constructor() {
    // Gunakan environment variables untuk konfigurasi
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID;
    this.languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || "id-ID";

    // Cek apakah konfigurasi Dialogflow lengkap
    if (!this.projectId) {
      logger.error(
        "❌ Error: DIALOGFLOW_PROJECT_ID tidak ditemukan di environment variables!"
      );
      return;
    }

    // Gunakan environment variable untuk path credentials
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credentialsPath) {
      this.keyFilename = path.resolve(credentialsPath);
    } else {
      logger.warn(
        "⚠️  GOOGLE_APPLICATION_CREDENTIALS tidak diset, menggunakan default application credentials"
      );
      this.keyFilename = null;
    }

    this.sessionClient = null;
    this.initializeClient();
  }

  initializeClient() {
    try {
      // Opsi konfigurasi Dialogflow
      const clientOptions = {};

      // Jika ada file kunci, gunakan file tersebut
      if (this.keyFilename) {
        if (!fs.existsSync(this.keyFilename)) {
          logger.error(
            "❌ FILE KUNCI DIALOGFLOW TIDAK DITEMUKAN:",
            this.keyFilename
          );
          logger.error(
            "Pastikan GOOGLE_APPLICATION_CREDENTIALS mengarah ke file yang benar"
          );
          return;
        }
        clientOptions.keyFilename = this.keyFilename;
      }
      // Jika tidak ada file kunci, gunakan default application credentials
      // (untuk deployment di Google Cloud atau environment dengan service account otomatis)

      this.sessionClient = new dialogflow.SessionsClient(clientOptions);
      logger.info("✅ Dialogflow client berhasil diinisialisasi");
      logger.info(`📝 Project ID: ${this.projectId}`);
      logger.info(`🌐 Language Code: ${this.languageCode}`);
    } catch (error) {
      logger.error("❌ Error menginisialisasi Dialogflow client:", error);
    }
  }

  async detectIntent(text, sessionId) {
    if (!this.sessionClient) {
      throw new Error("Dialogflow client not initialized");
    }

    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: { text: text, languageCode: this.languageCode },
      },
    };

    try {
      const responses = await this.sessionClient.detectIntent(request);
      return responses[0].queryResult;
    } catch (error) {
      logger.error("Error detecting intent:", error);
      throw error;
    }
  }

  isReady() {
    return this.sessionClient !== null;
  }
}

module.exports = new DialogflowService();
