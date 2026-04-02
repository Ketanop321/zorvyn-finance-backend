/**
 * ApiResponse — Standardized Response Envelope
 *
 * WHY a consistent response format?
 * In a FinTech API, every consumer (mobile app, dashboard, partner API)
 * must be able to rely on a predictable structure. If success responses
 * look different across endpoints, consuming code becomes brittle and
 * error-prone. This class enforces the contract project-wide.
 *
 * Format:
 * Success: { success: true, message, data, pagination? }
 * Error:   { success: false, message, code, errors? }
 */
'use strict';

class ApiResponse {
  /**
   * Send a successful response
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code (default 200)
   * @param {string} message - Human-readable success message
   * @param {*} data - Payload (object or array)
   * @param {object|null} pagination - Pagination metadata if applicable
   */
  static success(res, statusCode = 200, message = 'Success', data = null, pagination = null) {
    const body = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      body.pagination = pagination;
    }

    return res.status(statusCode).json(body);
  }

  /**
   * Send an error response
   * @param {object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code
   * @param {Array|null} errors - Field-level validation errors
   */
  static error(res, statusCode = 500, message = 'An error occurred', code = 'INTERNAL_ERROR', errors = null) {
    const body = {
      success: false,
      message,
      code,
    };

    if (errors && errors.length > 0) {
      body.errors = errors;
    }

    return res.status(statusCode).json(body);
  }

  /**
   * Convenience: 201 Created
   */
  static created(res, message, data) {
    return ApiResponse.success(res, 201, message, data);
  }

  /**
   * Convenience: 204 No Content (for deletes)
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
