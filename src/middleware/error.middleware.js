/**
 * Global Error Handler Middleware
 *
 * THE GOLDEN RULE: Never leak internal error details to clients in production.
 *   → Stack traces = roadmap for attackers
 *   → DB error messages = schema hints for SQL injection
 *   → File paths = server structure exposure
 *
 * HOW IT WORKS:
 * 1. AppError (isOperational: true) → Trusted, expected errors → send details to client
 * 2. Prisma errors → Map to user-friendly messages with appropriate status codes
 * 3. JWT errors → Already handled in auth middleware, but caught here as fallback
 * 4. Everything else → Log internally → send generic 500 to client
 *
 * This is the LAST middleware registered in app.js (must have 4 params: err, req, res, next)
 */
'use strict';

const AppError = require('../lib/AppError');
const ApiResponse = require('../lib/ApiResponse');
const logger = require('../config/logger');
const env = require('../config/env');

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // Always log errors internally (for monitoring/alerting)
  logger.error('[ErrorHandler]', {
    message: err.message,
    code: err.code,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    stack: env.isDev ? err.stack : undefined, // Only log stack in dev
  });

  // ── Trusted, Operational AppErrors ────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    return ApiResponse.error(
      res,
      err.statusCode,
      err.message,
      err.code,
      err.errors
    );
  }

  // ── Prisma Known Error Codes ───────────────────────────────────────────────
  // Docs: https://www.prisma.io/docs/reference/api-reference/error-reference
  if (err.code) {
    // Unique constraint violation (e.g., duplicate email, duplicate idempotency key)
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      if (field === 'idempotencyKey') {
        return ApiResponse.error(res, 409, 'Duplicate transaction detected. This request has already been processed.', 'DUPLICATE_IDEMPOTENCY_KEY');
      }
      return ApiResponse.error(res, 409, `A record with this ${field} already exists.`, 'CONFLICT');
    }

    // Record not found (e.g., update/delete on non-existent ID)
    if (err.code === 'P2025') {
      return ApiResponse.error(res, 404, 'The requested record was not found.', 'NOT_FOUND');
    }

    // Foreign key constraint failure
    if (err.code === 'P2003') {
      return ApiResponse.error(res, 400, 'Related record not found.', 'BAD_REQUEST');
    }
  }

  // ── Unknown / Programming Errors ──────────────────────────────────────────
  // In production: generic message only. In dev: show the real error for debugging.
  if (env.isDev) {
    return res.status(500).json({
      success: false,
      message: err.message,
      code: 'INTERNAL_ERROR',
      stack: err.stack,
    });
  }

  return ApiResponse.error(res, 500, 'An internal server error occurred. Our team has been notified.', 'INTERNAL_ERROR');
};

/**
 * 404 handler — catches unmatched routes
 * Must be registered BEFORE the global error handler in app.js
 */
const notFoundHandler = (req, res, next) => {
  return next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
