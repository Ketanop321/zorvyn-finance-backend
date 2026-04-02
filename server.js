/**
 * Server Entry Point
 *
 * This is the ONLY file that calls app.listen().
 * It handles:
 * - Graceful startup
 * - Graceful shutdown (SIGTERM/SIGINT)
 * - Unhandled rejection catching
 *
 * WHY graceful shutdown?
 * In production, when a server is restarted (deploy, crash recovery),
 * in-flight requests should be allowed to complete before the process exits.
 * Abruptly killing the process could corrupt in-progress DB transactions.
 */
'use strict';

const app = require('./app');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const prisma = require('./src/config/db');

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Zorvyn Finance API started`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const gracefulShutdown = async (signal) => {
  logger.info(`[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('[Server] HTTP server closed. Disconnecting from database...');

    try {
      await prisma.$disconnect();
      logger.info('[Server] Database disconnected. Exiting.');
      process.exit(0);
    } catch (err) {
      logger.error('[Server] Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('[Server] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Kubernetes / Docker stop
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C in terminal

// ─── Unhandled Rejections & Exceptions ───────────────────────────────────────

/**
 * WHY catch unhandled rejections?
 * In older Node.js versions, unhandled Promise rejections crashed silently.
 * In Node 15+, they crash the process. Either way, we want to log it
 * and shut down cleanly rather than leaving the server in an undefined state.
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Server] Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  // In production, restart the process (PM2/Kubernetes will handle this)
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception — FATAL', {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1); // Uncaught exceptions leave the process in unknown state
});

module.exports = server;
