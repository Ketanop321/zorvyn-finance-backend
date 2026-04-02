/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * WHY a factory function (roleGuard) instead of separate middleware per role?
 * A factory lets routes declare their required roles inline:
 *   router.post('/', authenticate, roleGuard(['ADMIN']), ...)
 * This is declarative — you can read the route definition and immediately
 * know exactly who can access it. Hardcoded role-check functions would
 * scatter that logic and make it hard to audit.
 *
 * WHY use the ROLES constant instead of string literals?
 * If you typo 'ADMINN' in a string, Node.js won't catch it at runtime until
 * an ADMIN actually hits that route. Using a constant object means the typo
 * fails at import time (or at least gives you IDE autocomplete).
 */
'use strict';

const AppError = require('../lib/AppError');
const { ROLES } = require('../constants');

/**
 * RBAC guard middleware factory
 * @param {string[]} allowedRoles - Array of role strings allowed to access the route
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/transactions', authenticate, roleGuard([ROLES.ADMIN]), handler)
 * router.get('/transactions', authenticate, roleGuard([ROLES.ADMIN, ROLES.ANALYST]), handler)
 */
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    // authenticate middleware must run first — this depends on req.user
    if (!req.user) {
      return next(AppError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    return next();
  };
};

module.exports = { roleGuard };
