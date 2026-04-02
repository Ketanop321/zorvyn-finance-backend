/**
 * Pagination Utility
 *
 * WHY centralize pagination logic?
 * Pagination has edge cases: negative pages, zero limits, limits over max.
 * By handling all of that here once, every list endpoint gets it for free.
 *
 * WHY max limit of 100?
 * Returning thousands of rows in one request can kill DB performance.
 * In production FinTech systems, this would be even lower (25-50) with
 * cursor-based pagination for audit logs. For this assignment, 100 is fine.
 */
'use strict';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parse and validate pagination query params
 * @param {object} query - req.query object
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
const parsePagination = (query = {}) => {
  let page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  // Guard against bad values
  if (page < 1) page = DEFAULT_PAGE;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

/**
 * Build pagination metadata for response
 * @param {number} total - Total record count from DB
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {{ page: number, limit: number, total: number, totalPages: number }}
 */
const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { parsePagination, buildPaginationMeta };
