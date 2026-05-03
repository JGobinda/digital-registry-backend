const User = require("../models/User");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { sendSuccess, sendError } = require("../utils/response");

// ─────────────────────────────────────────────────
// POST /auth/register
// ─────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, { statusCode: 409, message: "Email already registered." });
    }

    const user = await User.create({ name, email, password, role });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Persist hashed refresh token (store raw; compare via exact match)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, {
      statusCode: 201,
      message: "Registration successful",
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshToken");
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, { statusCode: 401, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return sendError(res, { statusCode: 401, message: "Account has been deactivated." });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, {
      message: "Login successful",
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return sendError(res, { statusCode: 400, message: "Refresh token is required." });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return sendError(res, { statusCode: 401, message: "Invalid or expired refresh token." });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    sendSuccess(res, {
      message: "Token refreshed",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    });
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return sendError(res, { statusCode: 401, message: "Invalid refresh token." });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });
    sendSuccess(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────
// GET /auth/me
// ─────────────────────────────────────────────────
const getMe = async (req, res) => {
  sendSuccess(res, { data: req.user });
};

// ─────────────────────────────────────────────────
// PATCH /auth/change-password
// ─────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return sendError(res, { statusCode: 401, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, { message: "Password changed successfully. Please log in again." });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, changePassword };
