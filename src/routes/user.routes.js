/**
 * User Routes — ADMIN only
 */
'use strict';

const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { roleGuard } = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { ROLES, AUDIT_ACTIONS } = require('../constants');
const {
  createUserSchema,
  updateUserSchema,
  patchUserStatusSchema,
  listUsersQuerySchema,
} = require('../schemas/user.schema');

// All user routes require authentication AND ADMIN role
router.use(authenticate, roleGuard([ROLES.ADMIN]));

// GET /api/users
router.get('/', validate(listUsersQuerySchema, 'query'), userController.listUsers);

// POST /api/users
router.post(
  '/',
  validate(createUserSchema),
  auditLog(AUDIT_ACTIONS.CREATE_USER, 'User'),
  userController.createUser
);

// PUT /api/users/:id
router.put(
  '/:id',
  validate(updateUserSchema),
  auditLog(AUDIT_ACTIONS.UPDATE_USER, 'User'),
  userController.updateUser
);

// PATCH /api/users/:id/status
router.patch(
  '/:id/status',
  validate(patchUserStatusSchema),
  auditLog(AUDIT_ACTIONS.UPDATE_USER_STATUS, 'User'),
  userController.patchUserStatus
);

module.exports = router;
