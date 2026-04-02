/**
 * Validation Middleware Factory
 *
 * WHY a factory function instead of inline validation?
 * Using validate(schema) as middleware keeps controllers clean — they only
 * contain business logic, not validation boilerplate. This is the
 * Single Responsibility Principle in action.
 *
 * WHY Zod over Joi or express-validator?
 * Zod is TypeScript-first and generates types from schemas. Even in JS,
 * it gives us precise error messages per field, .strict() to reject
 * unknown fields (preventing mass assignment attacks), and easy
 * schema composition.
 */
'use strict';

const ApiResponse = require('../lib/ApiResponse');

/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * On failure, sends a 400 with field-level errors.
 * On success, replaces req.body with the parsed (typed + sanitized) data.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Which part of request to validate
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return ApiResponse.error(
        res,
        400,
        'Validation failed. Please check your input.',
        'VALIDATION_ERROR',
        errors
      );
    }

    // Replace with Zod-parsed data (strips unknown fields, coerces types)
    req[source] = result.data;
    return next();
  };
};

module.exports = validate;
