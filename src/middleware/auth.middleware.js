/**
 * Authentication Middleware
 *
 * WHY Bearer tokens in Authorization header (not cookies)?
 * Access tokens are short-lived (15min) and designed to be sent with every
 * API request. Bearer in the Authorization header is the OAuth 2.0 standard.
 * The refresh token is in an httpOnly cookie for security (JS cannot access it).
 *
 * WHY verify token HERE and not in the service layer?
 * Middleware runs before the request reaches the controller/service. Failing
 * fast at the middleware layer means unauthorized requests never touch the DB.
 */
'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../lib/AppError');
const prisma = require('../config/db');

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the full user object to req.user on success.
 * Throws UNAUTHORIZED (401) if token is missing, expired, or invalid.
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(AppError.unauthorized('No authentication token provided'));
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Your session has expired. Please log in again.'));
    }
    return next(AppError.unauthorized('Invalid authentication token'));
  }

  // Fetch user from DB to ensure they still exist and are ACTIVE
  // WHY check DB on every request? If an admin deactivates a user, their
  // existing token should stop working immediately — not after it expires.
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user) {
    return next(AppError.unauthorized('User no longer exists'));
  }

  if (user.status === 'INACTIVE') {
    return next(AppError.unauthorized('Your account has been deactivated. Please contact an administrator.'));
  }

  req.user = user;
  return next();
};

module.exports = { authenticate };
