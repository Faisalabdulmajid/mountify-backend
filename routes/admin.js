const express = require("express");
const {
  getStats,
  getUserGrowth,
  getPendingItems,
  getRecentActivity,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
} = require("../controllers/adminController");
const { authenticateToken, authorizeAdmin } = require("../middleware/auth");
const { uploadAvatar } = require("../config/multer");
const router = express.Router();

// Stats routes
router.get("/stats", authenticateToken, authorizeAdmin, getStats);
router.get(
  "/stats/user-growth",
  authenticateToken,
  authorizeAdmin,
  getUserGrowth
);
router.get(
  "/pending-items",
  authenticateToken,
  authorizeAdmin,
  getPendingItems
);
router.get(
  "/recent-activity",
  authenticateToken,
  authorizeAdmin,
  getRecentActivity
);

// User management routes
router.get("/users", authenticateToken, authorizeAdmin, getAllUsers);
router.get("/users/:id_user", authenticateToken, authorizeAdmin, getUserById);
router.post(
  "/users",
  authenticateToken,
  authorizeAdmin,
  uploadAvatar.single("avatar"),
  createUser
);
router.put("/users/:id_user", authenticateToken, authorizeAdmin, updateUser);
router.put(
  "/users/:id_user/status",
  authenticateToken,
  authorizeAdmin,
  updateUserStatus
);
router.delete("/users/:id_user", authenticateToken, authorizeAdmin, deleteUser);

module.exports = router;
