const express = require("express");
const {
  getProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");
const { uploadAvatar } = require("../config/multer");
const router = express.Router();

// Direct profile routes (without /profile prefix since this is mounted at /api/profile)
router.get("/", authenticateToken, getProfile);
router.put("/", authenticateToken, updateProfile);
router.put("/password", authenticateToken, updatePassword);
router.put(
  "/avatar",
  authenticateToken,
  uploadAvatar.single("avatar"),
  updateAvatar
);

module.exports = router;
