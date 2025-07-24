const pool = require("../config/database");

// Simpan historis pencarian
async function saveSearchHistory(userId, searchTerm, filters) {
  const query = `INSERT INTO search_history (user_id, search_term, filters, created_at) VALUES ($1, $2, $3, NOW())`;
  await pool.query(query, [userId, searchTerm, JSON.stringify(filters)]);
}

// Ambil historis pencarian user
async function getSearchHistory(userId, limit = 10) {
  const query = `SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`;
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
}

module.exports = {
  saveSearchHistory,
  getSearchHistory,
};
