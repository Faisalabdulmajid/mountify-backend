const {
  saveSearchHistory: saveHistoryModel,
  getSearchHistory,
} = require("../models/searchHistory");

// POST /api/search-history
async function saveSearchHistory(req, res) {
  try {
    const userId = req.user.id; // pastikan middleware auth mengisi req.user
    const { searchTerm, filters } = req.body;
    await saveHistoryModel(userId, searchTerm, filters);
    res.status(201).json({ message: "Search history saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/search-history
async function getUserSearchHistory(req, res) {
  try {
    const userId = req.user.id;
    const history = await getSearchHistory(userId, 10);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  saveSearchHistory,
  getUserSearchHistory,
};
