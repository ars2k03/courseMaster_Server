// middleware to authenticate JWT tokens and load current user from DB

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isBanned name email");

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    // Prefer live DB role over stale JWT claims
    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized" });
  }
};

module.exports = authMiddleware;
