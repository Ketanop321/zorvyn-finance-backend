/**
 * User Management Zod Schemas
 */
'use strict';

const { z } = require('zod');

const createUserSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

    role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional().default('VIEWER'),
  })
  .strict();

const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim()
      .optional(),

    email: z
      .string()
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim()
      .optional(),

    role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

const patchUserStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      required_error: 'Status is required',
      invalid_type_error: "Status must be either 'ACTIVE' or 'INACTIVE'",
    }),
  })
  .strict();

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  role: z.enum(['ADMIN', 'ANALYST', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  patchUserStatusSchema,
  listUsersQuerySchema,
};
