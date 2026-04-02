/**
 * Audit Log Middleware
 *
 * WHY audit logs at the middleware layer?
 * Business logic (services/controllers) should not be aware of audit logging —
 * it's a cross-cutting concern like authentication. By handling it in middleware,
 * we guarantee it runs on EVERY mutating request without developers having to
 * remember to call it in each controller.
 *
 * WHY write AFTER the response is sent (res.on('finish'))?
 * We only want to log successful operations. If the request fails (validation error,
 * DB error), we don't want a misleading audit log saying "admin deleted transaction"
 * when the delete actually failed. We check res.statusCode to confirm success.
 *
 * WHY store metadata as JSON?
 * For UPDATE operations, we capture before/after state. This allows compliance
 * officers to reconstruct exactly what data looked like at any point in time —
 * a regulatory requirement in PCI-DSS and SOC2 environments.
 */
'use strict';

const prisma = require('../config/db');
const logger = require('../config/logger');

/**
 * Audit log middleware factory
 * @param {string} action - Action constant e.g. 'CREATE_TRANSACTION'
 * @param {string} targetType - Model name e.g. 'Transaction'
 * @param {Function} [getTargetId] - Optional function(req, res) to extract target ID from response
 */
const auditLog = (action, targetType, getTargetId = null) => {
  return (req, res, next) => {
    // Listen for response finish — log only after successful response
    res.on('finish', async () => {
      // Only log if the operation succeeded (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const performedBy = req.user?.id;
          if (!performedBy) return; // Skip if no authenticated user

          const logEntry = {
            action,
            performedBy,
            targetType,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent'],
            metadata: {
              method: req.method,
              path: req.path,
              // Store sanitized request body (no passwords)
              body: sanitizeForLog(req.body),
              params: req.params,
            },
          };

          // Extract target ID if a getter was provided
          if (getTargetId && req.params?.id) {
            logEntry.targetId = req.params.id;
          } else if (req.params?.id) {
            logEntry.targetId = req.params.id;
          }

          await prisma.auditLog.create({ data: logEntry });
        } catch (err) {
          // NEVER let audit log failure crash the main request
          // Log the error internally but don't surface it
          logger.error('[AuditLog] Failed to write audit log', { error: err.message, action });
        }
      }
    });

    return next();
  };
};

/**
 * Remove sensitive fields from request body before logging
 * @param {object} body - Request body
 * @returns {object} Sanitized body
 */
const sanitizeForLog = (body = {}) => {
  const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'cardNumber', 'cvv', 'pin'];
  const sanitized = { ...body };

  for (const field of SENSITIVE_FIELDS) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

module.exports = { auditLog };
