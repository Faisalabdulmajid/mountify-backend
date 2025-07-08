const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../config/jwt");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token akses diperlukan" });
  }

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Token tidak valid atau kadaluarsa" });
    }
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.peran !== "superadmin" && req.user.peran !== "admin") {
    return res.status(403).json({
      message: "Akses ditolak. Hanya untuk administrator.",
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
};
