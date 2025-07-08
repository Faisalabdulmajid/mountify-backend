const express = require("express");
const {
  dialogflowProxy,
  chatbotWebhook,
} = require("../controllers/chatbotController");
const router = express.Router();

router.post("/dialogflow-proxy", dialogflowProxy);
router.post("/webhook", chatbotWebhook);

module.exports = router;
