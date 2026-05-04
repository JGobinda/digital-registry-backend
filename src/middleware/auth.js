const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");
const { sendError } = require("../utils/response");

/**
 * Protect routes — verify JWT and attach user to req
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, {
        statusCode: 401,
        message: "Access denied. No token provided.",
      });
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Confirm user still exists
    const user = await User.findById(decoded.id).select("+passwordChangedAt");
    console.log("user: ", user)
    if (!user) {
      return sendError(res, { statusCode: 401, message: "User no longer exists." });
    }

    // 4. Check account is active
    if (!user.isActive) {
      return sendError(res, { statusCode: 401, message: "Account has been deactivated." });
    }

    // 5. Check password hasn't changed since token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return sendError(res, {
        statusCode: 401,
        message: "Password was recently changed. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, { statusCode: 401, message: "Token expired. Please log in again." });
    }
    if (err.name === "JsonWebTokenError") {
      return sendError(res, { statusCode: 401, message: "Invalid token." });
    }
    next(err);
  }
};

/**
 * Restrict access to specific roles
 * Usage: restrict("admin") or restrict("admin", "moderator")
 */
const restrict = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access denied. Required role: ${roles.join(" or ")}.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrict };
