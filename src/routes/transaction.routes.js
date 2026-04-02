/**
 * Transaction Routes
 *
 * Note the RBAC breakdown per endpoint:
 * - POST/PUT/DELETE: ADMIN only
 * - GET (list + single): ADMIN + ANALYST
 * - Dashboard GET: ADMIN + ANALYST + VIEWER (handled in dashboard.routes.js)
 *
 * This enforces the principle of least privilege.
 */
'use strict';

const express = require('express');
const router = express.Router();

const transactionController = require('../controllers/transaction.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { roleGuard } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { ROLES, AUDIT_ACTIONS } = require('../constants');
const {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} = require('../schemas/transaction.schema');

// All transaction routes require authentication
router.use(authenticate);

// POST /api/transactions — ADMIN only
router.post(
  '/',
  roleGuard([ROLES.ADMIN]),
  validate(createTransactionSchema),
  auditLog(AUDIT_ACTIONS.CREATE_TRANSACTION, 'Transaction'),
  transactionController.createTransaction
);

// GET /api/transactions — ADMIN + ANALYST
router.get(
  '/',
  roleGuard([ROLES.ADMIN, ROLES.ANALYST]),
  validate(listTransactionsQuerySchema, 'query'),
  transactionController.listTransactions
);

// GET /api/transactions/:id — ADMIN + ANALYST
router.get(
  '/:id',
  roleGuard([ROLES.ADMIN, ROLES.ANALYST]),
  transactionController.getTransaction
);

// PUT /api/transactions/:id — ADMIN only
router.put(
  '/:id',
  roleGuard([ROLES.ADMIN]),
  validate(updateTransactionSchema),
  auditLog(AUDIT_ACTIONS.UPDATE_TRANSACTION, 'Transaction'),
  transactionController.updateTransaction
);

// DELETE /api/transactions/:id — ADMIN only (soft delete)
router.delete(
  '/:id',
  roleGuard([ROLES.ADMIN]),
  auditLog(AUDIT_ACTIONS.DELETE_TRANSACTION, 'Transaction'),
  transactionController.deleteTransaction
);

module.exports = router;
