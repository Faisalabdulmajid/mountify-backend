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

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.put("/profile/password", authenticateToken, updatePassword);
router.put(
  "/profile/avatar",
  authenticateToken,
  uploadAvatar.single("avatar"),
  updateAvatar
);

module.exports = router;
