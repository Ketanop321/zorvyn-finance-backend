/**
 * Transaction Controller
 *
 * Note: Idempotency key is extracted from the X-Idempotency-Key header
 * at the controller level (it's an HTTP header, not business logic).
 */
'use strict';

const transactionService = require('../services/transaction.service');
const ApiResponse = require('../lib/ApiResponse');

/**
 * POST /api/transactions
 */
const createTransaction = async (req, res) => {
  const idempotencyKey = req.headers['x-idempotency-key'];
  const { transaction, isDuplicate } = await transactionService.createTransaction(
    req.body,
    idempotencyKey,
    req.user.id
  );

  if (isDuplicate) {
    return ApiResponse.success(res, 200, 'Transaction already processed (idempotent response)', transaction);
  }

  return ApiResponse.created(res, 'Transaction created successfully', transaction);
};

/**
 * GET /api/transactions
 */
const listTransactions = async (req, res) => {
  const { transactions, pagination } = await transactionService.listTransactions(req.query);
  return ApiResponse.success(res, 200, 'Transactions retrieved successfully', transactions, pagination);
};

/**
 * GET /api/transactions/:id
 */
const getTransaction = async (req, res) => {
  const transaction = await transactionService.getTransaction(req.params.id);
  return ApiResponse.success(res, 200, 'Transaction retrieved successfully', transaction);
};

/**
 * PUT /api/transactions/:id
 */
const updateTransaction = async (req, res) => {
  const transaction = await transactionService.updateTransaction(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'Transaction updated successfully', transaction);
};

/**
 * DELETE /api/transactions/:id  (soft delete)
 */
const deleteTransaction = async (req, res) => {
  const transaction = await transactionService.softDeleteTransaction(req.params.id, req.user.id);
  return ApiResponse.success(res, 200, 'Transaction deleted successfully', transaction);
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
};
