/**
 * Rate Limiter Middleware
 *
 * WHY two separate limiters?
 * - Global: Protects ALL routes from general abuse / DDoS attempts
 * - Auth: Auth routes are the most attack-prone (brute-force password attacks,
 *   credential stuffing). Stricter limits here protect user accounts.
 *
 * In production, you'd use Redis as the store (express-rate-limit + ioredis)
 * so limits persist across server restarts and work in multi-instance setups.
 * For this assignment, the in-memory store is sufficient.
 */
'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const ApiResponse = require('../lib/ApiResponse');

// In test environment, use extremely high limits so tests don't hit 429.
// Rate limiters are tested as a separate concern (not in integration tests).
const isTestEnv = process.env.NODE_ENV === 'test';
const TEST_MAX = 10000;

/**
 * Global rate limiter — applied to all routes
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: isTestEnv ? TEST_MAX : env.rateLimit.max,
  standardHeaders: true,                 // Returns RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(res, 429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED');
  },
});

/**
 * Auth route rate limiter — applied only to /api/auth/*
 * 5 requests per 15 minutes per IP
 * This prevents brute-force attacks against login
 */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: isTestEnv ? TEST_MAX : env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      429,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      'RATE_LIMIT_EXCEEDED'
    );
  },
});

/**
 * Dashboard rate limiter — dashboard queries are expensive (aggregations)
 * 30 requests per 15 minutes per IP
 */
const dashboardLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: isTestEnv ? TEST_MAX : 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(res, 429, 'Dashboard rate limit exceeded. Please slow down.', 'RATE_LIMIT_EXCEEDED');
  },
});

module.exports = { globalLimiter, authLimiter, dashboardLimiter };
