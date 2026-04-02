/**
 * Application Constants
 *
 * WHY a constants file?
 * Hardcoded strings scattered across the codebase are a maintenance nightmare.
 * If 'ADMIN' is spelled 'Admin' in one file and 'ADMIN' in another, RBAC breaks
 * silently. One constants file = one source of truth.
 *
 * Convention: SCREAMING_SNAKE_CASE for all constants (industry standard).
 */
'use strict';

// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
});

// ─── User Status ──────────────────────────────────────────────────────────────
const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

// ─── Transaction Types ────────────────────────────────────────────────────────
const TRANSACTION_TYPES = Object.freeze({
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
});

// ─── Transaction Categories ───────────────────────────────────────────────────
const TRANSACTION_CATEGORIES = Object.freeze([
  'Salary',
  'Investment',
  'Operations',
  'Marketing',
  'Infrastructure',
  'Payroll',
  'Utilities',
  'Travel',
  'Other',
]);

// ─── Audit Actions ────────────────────────────────────────────────────────────
const AUDIT_ACTIONS = Object.freeze({
  // Auth
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',

  // User management
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  UPDATE_USER_STATUS: 'UPDATE_USER_STATUS',

  // Transactions
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
});

// ─── Error Codes ──────────────────────────────────────────────────────────────
const ERROR_CODES = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_IDEMPOTENCY_KEY: 'DUPLICATE_IDEMPOTENCY_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

module.exports = {
  ROLES,
  USER_STATUS,
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  AUDIT_ACTIONS,
  ERROR_CODES,
};
