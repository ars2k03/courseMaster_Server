// Optionally attach req.user when a valid Bearer token is present

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const optionalAuthMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.startsWith("Bearer ") ? header.split(" ")[1] : header;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isBanned name email");
    if (user && !user.isBanned) {
      req.user = {
        id: String(user._id),
        role: user.role,
        name: user.name,
        email: user.email,
      };
    }
  } catch {
    // ignore invalid tokens for public routes
  }

  next();
};

module.exports = optionalAuthMiddleware;
