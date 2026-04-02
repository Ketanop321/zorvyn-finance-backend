/**
 * Jest Setup File — Runs inside EACH test worker process
 * This file is specified in jest.config.js as `setupFiles`
 * It executes BEFORE any test file imports happen, so setting
 * DATABASE_URL here guarantees Prisma picks it up.
 */
'use strict';

require('dotenv').config();

// Set test environment — consumed by rate limiter middleware to bypass limits
process.env.NODE_ENV = 'test';

// Override DATABASE_URL with TEST_DATABASE_URL so all Prisma clients
// in test files connect to the test database, not the dev database.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
