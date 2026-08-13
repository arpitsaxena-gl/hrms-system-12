const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { isProd } = require('../config/env');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  let errors = err.errors;

  logger.error(
    `${statusCode} - ${err.code || err.name || 'Error'} - ${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`
  );

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.code === 11000) {
    // Duplicate key. Do NOT leak the offending field/value in production (SEC-10).
    statusCode = 409;
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : null;
    message =
      isProd() || !field
        ? 'Duplicate value violates a unique constraint'
        : `Duplicate value for field: ${field}`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors || {}).map((e) => ({ field: e.path, message: e.message }));
    message = 'Validation failed';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  }

  const body = { success: false, message };
  if (errors && errors.length) body.errors = errors;
  if (!isProd()) body.stack = err.stack;

  res.status(statusCode || 500).json(body);
};

module.exports = errorHandler;
