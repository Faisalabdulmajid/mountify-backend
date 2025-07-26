const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const logger = require("../logger");

class RecommendationService {
  constructor() {
    // Gunakan fuzzy_engine.py yang sudah dimodifikasi untuk database integration
    this.pythonScriptPath = path.join(
      __dirname,
      "../rekomendasi_api",
      "fuzzy_engine.py"
    );
  }

  async getRecommendations(preferences) {
    try {
      return await new Promise((resolve, reject) => {
        if (!fs.existsSync(this.pythonScriptPath)) {
          logger.error(
            "Error: Script Python tidak ditemukan di",
            this.pythonScriptPath
          );
          return reject(
            new Error("Konfigurasi server rekomendasi belum lengkap.")
          );
        }

        const preferencesJson = JSON.stringify(preferences);
        const pythonProcess = spawn("python", [
          this.pythonScriptPath,
          preferencesJson,
        ]);

        let resultData = "";
        let errorData = "";

        pythonProcess.stdout.on("data", (data) => {
          resultData += data.toString();
          console.log("[PYTHON STDOUT]", data.toString()); // DEBUG: tampilkan output Python stdout
        });

        pythonProcess.stderr.on("data", (data) => {
          errorData += data.toString();
          console.error("[PYTHON STDERR]", data.toString()); // DEBUG: tampilkan output Python stderr
        });

        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            logger.error(`Proses Python error dengan kode: ${code}`);
            logger.error("Pesan error dari Python:", errorData);
            return reject(
              new Error(
                "Terjadi kesalahan saat menjalankan sistem rekomendasi."
              )
            );
          }

          try {
            const finalResult = JSON.parse(resultData);

            // Log untuk debugging
            logger.info("✅ Python engine response received successfully");
            logger.debug("Response metadata:", finalResult.metadata);

            resolve(finalResult);
          } catch (parseError) {
            logger.error(
              "Gagal mem-parsing JSON dari skrip Python:",
              parseError
            );
            logger.error("Data mentah yang diterima:", resultData);
            reject(
              new Error(
                "Terjadi kesalahan format data dari sistem rekomendasi."
              )
            );
          }
        });
      });
    } catch (err) {
      logger.error(
        "Promise error di getRecommendations:",
        err && err.stack ? err.stack : err
      );
      throw err;
    }
  }

  translateDialogflowParams(params) {
    const filtersForPython = {};

    if (params.kesulitan === "pemula") {
      filtersForPython.max_kesulitan_skala = 4;
    } else if (params.kesulitan === "menengah") {
      filtersForPython.max_kesulitan_skala = 7;
    }

    if (params.keamanan === "aman") {
      filtersForPython.min_keamanan_skala = 6;
    }

    // Anda bisa menambahkan penerjemah untuk parameter lain di sini
    // if (params.durasi === 'tektok') { filtersForPython.max_estimasi_waktu_jam = 18; }

    return filtersForPython;
  }

  formatDialogflowResponse(recommendations) {
    if (recommendations.length === 0) {
      return {
        fulfillmentText:
          "Maaf, saya tidak menemukan rekomendasi yang cocok dengan preferensi Anda. Coba ubah kriteria pencarianmu.",
      };
    }

    const cardMessages = recommendations.slice(0, 3).map((rec) => ({
      card: {
        title: rec.nama_gunung,
        subtitle: `Skor Rekomendasi: ${rec.skor_agregat}`,
        imageUri: "https://example.com/default-gunung.jpg",
        buttons: [
          { text: "Lihat Detail", postback: `/gunung/${rec.id_gunung}` },
        ],
      },
    }));

    return {
      fulfillmentMessages: [
        {
          text: {
            text: [
              "Tentu, berdasarkan preferensimu, ini beberapa rekomendasi yang paling cocok:",
            ],
          },
        },
        ...cardMessages,
      ],
    };
  }
}

module.exports = new RecommendationService();
