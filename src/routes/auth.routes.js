/**
 * Auth Routes
 * All auth routes get the stricter rate limiter (5 req/15min)
 */
'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');
const { registerSchema, loginSchema } = require('../schemas/auth.schema');
const { auditLog } = require('../middleware/audit.middleware');
const { AUDIT_ACTIONS } = require('../constants');

// Apply auth rate limiter to ALL routes in this router
router.use(authLimiter);

// POST /api/auth/register — Public (for demo; would be ADMIN-only in production)
router.post(
  '/register',
  validate(registerSchema),
  auditLog(AUDIT_ACTIONS.USER_REGISTERED, 'User'),
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  auditLog(AUDIT_ACTIONS.USER_LOGGED_IN, 'User'),
  authController.login
);

// POST /api/auth/refresh — uses httpOnly cookie
router.post('/refresh', authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

module.exports = router;
