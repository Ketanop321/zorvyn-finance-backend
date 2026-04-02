/**
 * Express Application Factory
 *
 * WHY separate app.js from server.js?
 * When using Supertest for integration tests, Supertest needs the Express
 * app object — not a running server. If server.js called app.listen() at
 * import time, every test file would try to start a server on port 3000
 * and crash with EADDRINUSE.
 *
 * Separation pattern:
 *   app.js   → creates and configures Express app (importable for tests)
 *   server.js → imports app + calls listen() (only run in production/dev)
 *
 * This is the industry standard pattern for testable Express apps.
 */
'use strict';

require('dotenv').config();
require('express-async-errors'); // Must be required before routes — patches Express to forward async errors

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { globalLimiter } = require('./src/middleware/rateLimiter.middleware');
const { errorHandler, notFoundHandler } = require('./src/middleware/error.middleware');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const transactionRoutes = require('./src/routes/transaction.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();

// ─── Security Middleware (applied first) ──────────────────────────────────────

/**
 * Helmet: Sets various HTTP headers to protect against common web vulnerabilities.
 * - X-XSS-Protection
 * - X-Frame-Options: DENY (clickjacking protection)
 * - X-Content-Type-Options: nosniff
 * - Strict-Transport-Security (HSTS in production)
 * - Content-Security-Policy: strict (blocks inline scripts)
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

/**
 * CORS: Only allow requests from explicitly whitelisted origins.
 * NEVER use wildcard * in a FinTech API — it allows any website to
 * make authenticated requests on behalf of your users.
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (env.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      logger.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
      return callback(new Error('Not allowed by CORS policy'));
    },
    credentials: true, // Allow cookies (needed for refresh token)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  })
);

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size — prevents payload flooding
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────
// Morgan logs HTTP requests; Winston logs application events
app.use(morgan(env.isDev ? 'dev' : 'combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Simple endpoint for load balancers and uptime monitors
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zorvyn Finance API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Error Handling (must be last) ────────────────────────────────────────────
app.use(notFoundHandler); // 404 for unmatched routes
app.use(errorHandler);    // Global error handler

module.exports = app;
