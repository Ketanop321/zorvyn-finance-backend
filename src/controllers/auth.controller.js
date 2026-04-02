/**
 * Auth Controller
 *
 * Thin HTTP handlers — each function does exactly three things:
 * 1. Extract data from req
 * 2. Call the service
 * 3. Send ApiResponse
 *
 * NO business logic here. NO Prisma calls here. NO bcrypt here.
 * If a junior dev needs to find "what does login do?", they look at
 * auth.service.js — not this file.
 */
'use strict';

const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');
const ApiResponse = require('../lib/ApiResponse');

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  tokenService.setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.created(res, 'Account created successfully', {
    user,
    accessToken,
  });
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  tokenService.setRefreshTokenCookie(res, refreshToken);

  return ApiResponse.success(res, 200, 'Login successful', {
    user,
    accessToken,
  });
};

/**
 * POST /api/auth/refresh
 * Reads refresh token from httpOnly cookie
 */
const refresh = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    // Use AppError through next — but since we're using express-async-errors,
    // any thrown error is automatically forwarded to the error handler
    const AppError = require('../lib/AppError');
    throw AppError.unauthorized('No refresh token provided');
  }

  const { accessToken, newRefreshToken } = await authService.refresh(refreshToken);
  tokenService.setRefreshTokenCookie(res, newRefreshToken);

  return ApiResponse.success(res, 200, 'Token refreshed successfully', { accessToken });
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  await authService.logout(refreshToken);
  tokenService.clearRefreshTokenCookie(res);

  return ApiResponse.success(res, 200, 'Logged out successfully', null);
};

module.exports = { register, login, refresh, logout };
