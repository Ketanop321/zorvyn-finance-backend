/**
 * Prisma Client Singleton
 *
 * WHY a singleton? In Node.js, every `require()` of the same module
 * returns the cached instance. But to be explicit and safe (especially
 * in test environments that can re-import modules), we attach the client
 * to `global` in development to avoid exhausting DB connections during
 * hot reloads with nodemon.
 *
 * WHY Prisma middleware for soft deletes?
 * Instead of adding `where: { isDeleted: false }` to EVERY query across
 * the codebase (which devs will forget), we intercept at the ORM level.
 * This is the "write it once, trust it everywhere" pattern.
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// Prevent multiple instances in development (nodemon hot-reloads)
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: [{ level: 'error', emit: 'event' }],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
  }
  prisma = global.__prisma;
}

// Log Prisma warnings and errors through Winston (not console.log)
prisma.$on('warn', (e) => logger.warn(`[Prisma] ${e.message}`));
prisma.$on('error', (e) => logger.error(`[Prisma] ${e.message}`));

/**
 * Soft-Delete Middleware
 * Automatically appends `isDeleted: false` to all Transaction queries
 * so deleted records are invisible by default across the entire app.
 *
 * To intentionally query deleted records (e.g., admin recovery tool),
 * you would bypass this by using raw SQL — which is an intentional friction
 * that prevents accidental data exposure.
 */
prisma.$use(async (params, next) => {
  if (params.model === 'Transaction') {
    const readActions = ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate', 'groupBy'];

    if (readActions.includes(params.action)) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};

      // Only append if not explicitly overridden
      if (params.args.where.isDeleted === undefined) {
        params.args.where.isDeleted = false;
      }
    }
  }

  return next(params);
});

module.exports = prisma;
