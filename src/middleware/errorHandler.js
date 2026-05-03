const { sendError } = require("../utils/response");

// 404 handler — must be registered AFTER all routes
const notFound = (req, res) => {
  sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

// Global error handler — must be the last middleware (4 args)
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, { statusCode: 400, message: "Validation error", errors });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, {
      statusCode: 409,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return sendError(res, {
      statusCode: 400,
      message: `Invalid value for field: ${err.path}`,
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  sendError(res, { statusCode, message });
};

module.exports = { notFound, errorHandler };
