/**
 * User Service
 *
 * All user management operations. ADMIN-only in production.
 *
 * @module user.service
 */
'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const env = require('../config/env');
const AppError = require('../lib/AppError');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

// Fields we always select (never return password hash to clients)
const USER_SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * List all users with optional role/status filter and pagination
 * @param {object} query - req.query
 * @returns {Promise<{ users: object[], pagination: object }>}
 */
const listUsers = async (query = {}) => {
  const { skip, take, page, limit } = parsePagination(query);

  const where = {};
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT_FIELDS,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Get a single user by ID
 * @param {string} id - User UUID
 * @returns {Promise<object>} User object
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT_FIELDS,
  });

  if (!user) throw AppError.notFound('User');
  return user;
};

/**
 * Create a new user (ADMIN action)
 * @param {{ name: string, email: string, password: string, role?: string }} data
 * @returns {Promise<object>} Created user
 */
const createUser = async ({ name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists.', 'CONFLICT');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcrypt.saltRounds);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
    select: USER_SELECT_FIELDS,
  });

  return user;
};

/**
 * Update user details (ADMIN action)
 * @param {string} id - User UUID
 * @param {object} data - Fields to update
 * @returns {Promise<object>} Updated user
 */
const updateUser = async (id, data) => {
  await getUserById(id); // Throws 404 if not found

  // If email is being updated, check for conflicts
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id } },
    });
    if (existing) {
      throw AppError.conflict('An account with this email already exists.', 'CONFLICT');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: USER_SELECT_FIELDS,
  });

  return user;
};

/**
 * Toggle user ACTIVE/INACTIVE status (ADMIN action)
 * @param {string} id - User UUID
 * @param {'ACTIVE'|'INACTIVE'} status
 * @returns {Promise<object>} Updated user
 */
const patchUserStatus = async (id, status) => {
  await getUserById(id); // Throws 404 if not found

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: USER_SELECT_FIELDS,
  });

  return user;
};

module.exports = { listUsers, getUserById, createUser, updateUser, patchUserStatus };
