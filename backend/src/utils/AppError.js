/**
 * Typed application error carrying an HTTP status, a machine-readable code and an
 * optional offending field. Thrown by services/controllers and rendered into a
 * consistent `{ success:false, message, errors? }` envelope by errorHandler.js.
 */
const ERROR_CODES = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LOCKED: 423,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

class AppError extends Error {
  constructor(message, { code = 'INTERNAL', statusCode, field, errors } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode || ERROR_CODES[code] || 500;
    if (field) this.field = field;
    if (errors) this.errors = errors;
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static validation(message, errors) {
    return new AppError(message || 'Validation failed', { code: 'VALIDATION_ERROR', errors });
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(message, { code: 'FORBIDDEN' });
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, { code: 'NOT_FOUND' });
  }
  static conflict(message = 'Conflict') {
    return new AppError(message, { code: 'CONFLICT' });
  }
  static locked(message = 'Account temporarily locked') {
    return new AppError(message, { code: 'LOCKED' });
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, { code: 'UNAUTHORIZED' });
  }
  static badRequest(message = 'Bad request', field) {
    return new AppError(message, { code: 'BAD_REQUEST', field });
  }
}

module.exports = AppError;
module.exports.ERROR_CODES = ERROR_CODES;
