// src/middleware/errorHandler.js
const Logger = require("../utils/logger");

// Validation error from express-validator
function handleValidationError(errors, res) {
  return res.status(400).json({
    success: false,
    error: "Validation failed",
    details: errors.array().map(e => ({ field: e.path, message: e.msg })),
  });
}

// Global error handler (add as last middleware in express)
function globalErrorHandler(err, req, res, next) {
  Logger.error(`Unhandled error on ${req.method} ${req.path}`, err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
}

// 404 handler
function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
}

module.exports = { handleValidationError, globalErrorHandler, notFoundHandler };
