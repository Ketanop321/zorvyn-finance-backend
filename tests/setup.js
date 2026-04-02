/**
 * Jest Global Setup — Test Database Initialization
 *
 * This file runs in a SEPARATE Node process before tests start.
 * It can set env vars for itself, but those don't propagate to test workers.
 * To pass env vars to test workers, we use jest.config.js `testEnvironment` options,
 * or we set them in a jest setup file that runs IN the worker (setupFilesAfterFramework).
 *
 * This file only handles: running migrations on the test DB.
 */
'use strict';

const { execSync } = require('child_process');
require('dotenv').config();

module.exports = async () => {
  const testDbUrl = process.env.TEST_DATABASE_URL;

  if (!testDbUrl) {
    throw new Error('TEST_DATABASE_URL is not set in .env');
  }

  console.log('\n🔧 Running migrations on test database...');
  try {
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    console.log('✅ Test database migrations complete\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.stderr?.toString() || err.message);
    throw err;
  }
};
