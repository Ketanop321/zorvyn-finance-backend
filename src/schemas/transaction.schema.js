/**
 * Transaction Zod Schemas
 *
 * WHY validate amount as a positive number?
 * A negative transaction amount makes no business sense and could be
 * used to manipulate balance calculations — e.g., creating an "EXPENSE"
 * of -50000 would effectively add money to the balance.
 *
 * WHY coerce date to a Date object?
 * Clients send ISO 8601 strings. Zod's z.coerce.date() handles the
 * string-to-Date conversion, so we always work with Date objects downstream.
 */
'use strict';

const { z } = require('zod');

const createTransactionSchema = z
  .object({
    amount: z
      .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be a positive number')
      .max(99999999999.99, 'Amount exceeds maximum allowed value'),

    type: z.enum(['INCOME', 'EXPENSE'], {
      required_error: 'Transaction type is required',
      invalid_type_error: "Type must be either 'INCOME' or 'EXPENSE'",
    }),

    category: z
      .string({ required_error: 'Category is required' })
      .min(1, 'Category cannot be empty')
      .max(100, 'Category name too long')
      .trim(),

    date: z.coerce.date({
      required_error: 'Transaction date is required',
      invalid_type_error: 'Date must be a valid date string (ISO 8601)',
    }),

    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
  })
  .strict();

const updateTransactionSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be a positive number')
      .max(99999999999.99, 'Amount exceeds maximum allowed value')
      .optional(),

    type: z
      .enum(['INCOME', 'EXPENSE'], {
        invalid_type_error: "Type must be either 'INCOME' or 'EXPENSE'",
      })
      .optional(),

    category: z
      .string()
      .min(1, 'Category cannot be empty')
      .max(100, 'Category name too long')
      .trim()
      .optional(),

    date: z.coerce.date({ invalid_type_error: 'Date must be a valid date string' }).optional(),

    description: z
      .string()
      .max(500, 'Description cannot exceed 500 characters')
      .trim()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

// Query params schema for GET /transactions (all optional filters)
const listTransactionsQuerySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
};
