/**
 * Auth Zod Schemas
 *
 * WHY .strict()? Rejects any fields not in the schema.
 * A client sending { email, password, role: 'ADMIN' } should NOT
 * have that 'role' field silently ignored — it should be rejected.
 * This prevents mass assignment attacks where attackers try to
 * set privileged fields through user-facing endpoints.
 */
'use strict';

const { z } = require('zod');

const registerSchema = z
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

    role: z
      .enum(['ADMIN', 'ANALYST', 'VIEWER'])
      .optional()
      .default('VIEWER'),
  })
  .strict(); // Reject unknown fields

const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .toLowerCase()
      .trim(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .strict();

module.exports = { registerSchema, loginSchema };
