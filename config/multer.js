const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Konfigurasi upload dari environment variables
const UPLOAD_MAX_FILE_SIZE =
  parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 3 * 1024 * 1024; // Default 3MB
const UPLOAD_PATH = process.env.UPLOAD_PATH || "./public/uploads";
const ALLOWED_TYPES = process.env.UPLOAD_ALLOWED_TYPES
  ? process.env.UPLOAD_ALLOWED_TYPES.split(",")
  : ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];

// File type validation for uploads
const allowedImageTypes = ALLOWED_TYPES;

function fileFilter(req, file, cb) {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipe file tidak diizinkan. Hanya file dengan tipe berikut yang diperbolehkan: ${allowedImageTypes.join(
          ", "
        )}`
      ),
      false
    );
  }
}

// Multer Configuration (File Upload)
const createStorage = (folder) => {
  const dir = path.join(__dirname, `../${UPLOAD_PATH}/${folder}/`);
  fs.mkdirSync(dir, { recursive: true });
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(
        null,
        `${folder.slice(0, -1)}-${uniqueSuffix}${path.extname(
          file.originalname
        )}`
      );
    },
  });
};

// Konfigurasi limit file size yang aman
const defaultLimits = { fileSize: UPLOAD_MAX_FILE_SIZE };
const avatarLimits = {
  fileSize: Math.min(UPLOAD_MAX_FILE_SIZE, 2 * 1024 * 1024),
}; // Max 2MB untuk avatar

// Multer Upload Configurations with fileFilter and limits
const uploadAvatar = multer({
  storage: createStorage("avatars"),
  fileFilter,
  limits: avatarLimits,
});

const uploadThumbnail = multer({
  storage: createStorage("thumbnails"),
  fileFilter,
  limits: avatarLimits,
});

const uploadArtikelImg = multer({
  storage: createStorage("artikel"),
  fileFilter,
  limits: defaultLimits,
});

const uploadGaleri = multer({
  storage: createStorage("galeri"),
  fileFilter,
  limits: defaultLimits,
});

const uploadPoi = multer({
  storage: createStorage("poi"),
  fileFilter,
  limits: avatarLimits,
});

const uploadLaporan = multer({
  storage: createStorage("laporan-error"),
  fileFilter,
  limits: avatarLimits,
});

module.exports = {
  uploadAvatar,
  uploadThumbnail,
  uploadArtikelImg,
  uploadGaleri,
  uploadPoi,
  uploadLaporan,
  fileFilter,
  allowedImageTypes,
  UPLOAD_MAX_FILE_SIZE,
  UPLOAD_PATH,
};
