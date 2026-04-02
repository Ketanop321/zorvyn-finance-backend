/**
 * Auth Service
 *
 * ALL business logic for authentication lives here.
 * Controllers are thin — they call a service function and send the response.
 *
 * WHY don't controllers hash passwords or call jwt.sign?
 * Single Responsibility Principle: controllers handle HTTP concerns
 * (reading req, sending res). Services handle business logic.
 * If you need to change bcrypt rounds, you change it in ONE place.
 */
'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const env = require('../config/env');
const AppError = require('../lib/AppError');
const tokenService = require('./token.service');

/**
 * Register a new user
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
const register = async ({ name, email, password, role }) => {
  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists.', 'CONFLICT');
  }

  // Hash password — saltRounds=12 intentionally slow to deter brute-force
  const hashedPassword = await bcrypt.hash(password, env.bcrypt.saltRounds);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
  });

  // Generate tokens
  const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await tokenService.generateAndStoreRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

/**
 * Login with email and password
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
const login = async ({ email, password }) => {
  // Always fetch user (even if not found) before comparing password
  // WHY? Timing attacks — if we return immediately on "not found",
  // an attacker can tell valid emails from invalid ones by response time.
  const user = await prisma.user.findUnique({ where: { email } });

  // Use a dummy compare if user not found to maintain constant time
  const passwordToCompare = user?.password || '$2b$12$invalidhashfortimingnormalization';
  const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

  if (!user || !isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  if (user.status === 'INACTIVE') {
    throw AppError.unauthorized('Your account has been deactivated. Please contact an administrator.');
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await tokenService.generateAndStoreRefreshToken(user.id);

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Refresh access token using a valid refresh token
 * @param {string} refreshToken
 * @returns {Promise<{ accessToken: string, newRefreshToken: string }>}
 */
const refresh = async (refreshToken) => {
  const record = await tokenService.validateRefreshToken(refreshToken);

  // Rotate refresh token — old one is revoked, new one issued
  // WHY rotation? If a refresh token is stolen and used, the legitimate
  // user's next refresh attempt will fail (token already used/revoked),
  // alerting us to a potential compromise.
  await tokenService.revokeRefreshToken(refreshToken);
  const newRefreshToken = await tokenService.generateAndStoreRefreshToken(record.userId);

  const accessToken = tokenService.generateAccessToken({
    userId: record.user.id,
    role: record.user.role,
  });

  return { accessToken, newRefreshToken };
};

/**
 * Logout — revoke the refresh token
 * @param {string} refreshToken
 */
const logout = async (refreshToken) => {
  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
  }
};

module.exports = { register, login, refresh, logout };
