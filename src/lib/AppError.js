/**
 * AppError — Custom Error Class
 *
 * WHY extend Error instead of using plain objects?
 * - instanceof checks work correctly in the global error handler
 * - Stack traces are preserved automatically
 * - isOperational flag lets us distinguish:
 *     → isOperational: true  = expected errors (validation, 404, 401)
 *       → safe to send details to client
 *     → isOperational: false = programming bugs / unexpected crashes
 *       → NEVER leak details — log internally, send generic 500
 *
 * WHY 'code' property?
 * Frontend and API consumers need machine-readable error codes to
 * handle errors programmatically (e.g., redirect on UNAUTHORIZED,
 * show field errors on VALIDATION_ERROR). This is production thinking.
 */
'use strict';

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message (sent to client)
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Machine-readable error code (e.g., 'UNAUTHORIZED')
   * @param {Array}  errors - Optional array of field-level validation errors
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', errors = null) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;       // field-level errors for validation cases
    this.isOperational = true;  // marks this as a trusted, expected error

    // Captures proper stack trace, excluding this constructor from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Common Error Factories ───────────────────────────────────────────────────
// WHY factories? DRY principle — one place to define all standard errors.
// Developers call AppError.notFound('User') instead of remembering status codes.

AppError.badRequest = (message, errors = null) =>
  new AppError(message, 400, 'BAD_REQUEST', errors);

AppError.unauthorized = (message = 'Authentication required') =>
  new AppError(message, 401, 'UNAUTHORIZED');

AppError.forbidden = (message = 'You do not have permission to perform this action') =>
  new AppError(message, 403, 'FORBIDDEN');

AppError.notFound = (resource = 'Resource') =>
  new AppError(`${resource} not found`, 404, 'NOT_FOUND');

AppError.conflict = (message, code = 'CONFLICT') =>
  new AppError(message, 409, code);

AppError.validation = (errors) =>
  new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);

AppError.rateLimitExceeded = () =>
  new AppError('Too many requests. Please try again later.', 429, 'RATE_LIMIT_EXCEEDED');

AppError.internal = (message = 'An internal server error occurred') =>
  new AppError(message, 500, 'INTERNAL_ERROR');

module.exports = AppError;
