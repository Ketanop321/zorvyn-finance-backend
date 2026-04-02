/**
 * User Controller — ADMIN only
 */
'use strict';

const userService = require('../services/user.service');
const ApiResponse = require('../lib/ApiResponse');

/**
 * GET /api/users
 */
const listUsers = async (req, res) => {
  const { users, pagination } = await userService.listUsers(req.query);
  return ApiResponse.success(res, 200, 'Users retrieved successfully', users, pagination);
};

/**
 * POST /api/users
 */
const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  return ApiResponse.created(res, 'User created successfully', user);
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return ApiResponse.success(res, 200, 'User updated successfully', user);
};

/**
 * PATCH /api/users/:id/status
 */
const patchUserStatus = async (req, res) => {
  const user = await userService.patchUserStatus(req.params.id, req.body.status);
  return ApiResponse.success(res, 200, `User status updated to ${req.body.status}`, user);
};

module.exports = { listUsers, createUser, updateUser, patchUserStatus };
