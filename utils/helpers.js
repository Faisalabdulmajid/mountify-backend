const sanitizeHtml = require("sanitize-html");

// Fungsi helper untuk membuat slug otomatis dari judul
function createSlug(title) {
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, "") // Hapus karakter non-alfanumerik kecuali -
    .replace(/\-\-+/g, "-"); // Ganti beberapa - dengan satu -
}

// Helper untuk sanitasi input user
function sanitizeInput(input) {
  if (typeof input === "string") {
    // Escape tag, bukan hapus seluruh tag
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }
  return input;
}

module.exports = {
  createSlug,
  sanitizeInput,
};
