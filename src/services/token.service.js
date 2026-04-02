/**
 * Token Service
 *
 * Centralizes ALL JWT and refresh token operations.
 * Controllers and auth services never touch jwt.sign/verify directly.
 *
 * WHY separate access + refresh secrets?
 * If your access token secret is compromised, an attacker can forge
 * access tokens. Having a different secret for refresh tokens means
 * they still can't get new access tokens after existing ones expire.
 * Dual-secret is defense-in-depth.
 */
'use strict';

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const prisma = require('../config/db');

/**
 * Generate a signed JWT access token
 * @param {object} payload - { userId, role }
 * @returns {string} Signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: 'zorvyn-api',
  });
};

/**
 * Generate a unique refresh token string (UUID) and persist it in DB
 * @param {string} userId
 * @returns {Promise<string>} The refresh token string
 */
const generateAndStoreRefreshToken = async (userId) => {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
};

/**
 * Validate a refresh token — checks exists, not revoked, not expired
 * @param {string} token - Refresh token string
 * @returns {Promise<import('@prisma/client').RefreshToken>} Valid token record
 * @throws {AppError} If token is invalid, revoked, or expired
 */
const validateRefreshToken = async (token) => {
  const AppError = require('../lib/AppError');

  const record = await prisma.refreshToken.findFirst({
    where: { token },
    include: { user: { select: { id: true, role: true, status: true } } },
  });

  if (!record) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  if (record.revoked) {
    throw AppError.unauthorized('Refresh token has been revoked. Please log in again.');
  }

  if (new Date() > record.expiresAt) {
    // Auto-revoke expired tokens
    await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
    throw AppError.unauthorized('Refresh token has expired. Please log in again.');
  }

  if (record.user.status === 'INACTIVE') {
    throw AppError.unauthorized('Your account has been deactivated.');
  }

  return record;
};

/**
 * Revoke a refresh token (logout)
 * @param {string} token
 */
const revokeRefreshToken = async (token) => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

/**
 * Revoke all refresh tokens for a user (force logout all sessions)
 * @param {string} userId
 */
const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};

/**
 * Set the refresh token as an httpOnly cookie on the response
 * @param {object} res - Express response
 * @param {string} token - Refresh token value
 */
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,          // JS cannot access this cookie — XSS protection
    secure: env.isProd,      // HTTPS only in production
    sameSite: 'Strict',      // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/api/auth',       // Only sent to auth routes — minimizes exposure
  });
};

/**
 * Clear the refresh token cookie (logout)
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

module.exports = {
  generateAccessToken,
  generateAndStoreRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
