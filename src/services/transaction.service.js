/**
 * Transaction Service
 *
 * Handles all financial transaction operations.
 * This is the core of the FinTech backend — every function here has
 * real-world financial implications and must be handled carefully.
 *
 * Key concepts:
 * - Idempotency: Prevents duplicate charges (network retries)
 * - Soft deletes: Regulators require financial records to be preserved
 * - Decimal: Exact monetary arithmetic (no floating point errors)
 * - DB-level filtering: The Prisma middleware in db.js auto-appends isDeleted=false
 *
 * @module transaction.service
 */
'use strict';

const prisma = require('../config/db');
const AppError = require('../lib/AppError');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// Fields returned for all transaction responses
const TRANSACTION_SELECT = {
  id: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  description: true,
  idempotencyKey: true,
  isDeleted: true,
  deletedAt: true,
  createdBy: true,
  deletedBy: true,
  createdAt: true,
  updatedAt: true,
  creator: { select: { id: true, name: true, email: true } },
};

/**
 * Create a new transaction with idempotency key check
 * @param {object} data - Transaction data
 * @param {string} idempotencyKey - From X-Idempotency-Key header
 * @param {string} createdBy - Authenticated user ID
 * @returns {Promise<{ transaction: object, isDuplicate: boolean }>}
 */
const createTransaction = async (data, idempotencyKey, createdBy) => {
  if (!idempotencyKey) {
    throw AppError.badRequest('X-Idempotency-Key header is required for transaction creation');
  }

  // Check if this idempotency key was already used
  // WHY: A client might retry a failed request (network timeout). Without this check,
  // the customer gets charged twice. This is one of the most critical FinTech patterns.
  const existing = await prisma.$queryRaw`
    SELECT id, amount, type, category, date, description, "idempotencyKey", "isDeleted", "createdAt"
    FROM transactions
    WHERE "idempotencyKey" = ${idempotencyKey}
    LIMIT 1
  `;

  if (existing && existing.length > 0) {
    // Return the original response — idempotent!
    return { transaction: existing[0], isDuplicate: true };
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      idempotencyKey,
      createdBy,
    },
    select: TRANSACTION_SELECT,
  });

  return { transaction, isDuplicate: false };
};

/**
 * List transactions with optional filters and pagination
 * @param {object} query - req.query: { type, category, dateFrom, dateTo, page, limit }
 * @returns {Promise<{ transactions: object[], pagination: object }>}
 */
const listTransactions = async (query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);

  const where = {
    // isDeleted: false is auto-appended by Prisma middleware in db.js
  };

  if (query.type) where.type = query.type;
  if (query.category) where.category = { contains: query.category, mode: 'insensitive' };

  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
    if (query.dateTo) where.date.lte = new Date(query.dateTo);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: TRANSACTION_SELECT,
      skip,
      take,
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Get a single transaction by ID
 * @param {string} id - Transaction UUID
 * @returns {Promise<object>} Transaction
 */
const getTransaction = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    select: TRANSACTION_SELECT,
  });

  if (!transaction) throw AppError.notFound('Transaction');
  return transaction;
};

/**
 * Update a transaction
 * @param {string} id - Transaction UUID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated transaction
 */
const updateTransaction = async (id, data) => {
  await getTransaction(id); // Throws 404 if not found

  const transaction = await prisma.transaction.update({
    where: { id },
    data,
    select: TRANSACTION_SELECT,
  });

  return transaction;
};

/**
 * Soft delete a transaction
 * WHY soft delete? Financial records must be preserved for audits.
 * Hard deleting a transaction could constitute evidence tampering
 * in a financial fraud investigation. The isDeleted flag + timestamp
 * creates an audit trail of when and by whom a record was "removed".
 *
 * @param {string} id - Transaction UUID
 * @param {string} deletedBy - Authenticated user ID
 * @returns {Promise<object>} Soft-deleted transaction
 */
const softDeleteTransaction = async (id, deletedBy) => {
  // Use raw query to bypass the isDeleted=false middleware — we need to find it even if deleted
  const existing = await prisma.$queryRaw`
    SELECT id FROM transactions WHERE id = ${id} LIMIT 1
  `;

  if (!existing || existing.length === 0) throw AppError.notFound('Transaction');

  // Use raw update to bypass the Prisma middleware filter
  await prisma.$executeRaw`
    UPDATE transactions
    SET "isDeleted" = true, "deletedAt" = NOW(), "deletedBy" = ${deletedBy}, "updatedAt" = NOW()
    WHERE id = ${id}
  `;

  // Return the updated record (including isDeleted=true) for the response
  const deleted = await prisma.$queryRaw`
    SELECT id, amount, type, category, date, description, "idempotencyKey", "isDeleted", "deletedAt", "deletedBy", "createdBy", "createdAt", "updatedAt"
    FROM transactions
    WHERE id = ${id}
    LIMIT 1
  `;

  return deleted[0];
};

module.exports = {
  createTransaction,
  listTransactions,
  getTransaction,
  updateTransaction,
  softDeleteTransaction,
};
