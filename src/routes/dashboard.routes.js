/**
 * Dashboard Routes
 * All roles can view dashboard (VIEWER, ANALYST, ADMIN)
 * These are read-only aggregation endpoints
 */
'use strict';

const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { roleGuard } = require('../middleware/role.middleware');
const { dashboardLimiter } = require('../middleware/rateLimiter.middleware');
const { ROLES } = require('../constants');

// All dashboard routes: must be authenticated, any role allowed, with dashboard rate limit
router.use(authenticate, roleGuard([ROLES.ADMIN, ROLES.ANALYST, ROLES.VIEWER]), dashboardLimiter);

// GET /api/dashboard/summary
router.get('/summary', dashboardController.getSummary);

// GET /api/dashboard/category-breakdown
router.get('/category-breakdown', dashboardController.getCategoryBreakdown);

// GET /api/dashboard/monthly-trend
router.get('/monthly-trend', dashboardController.getMonthlyTrend);

// GET /api/dashboard/recent-activity
router.get('/recent-activity', dashboardController.getRecentActivity);

module.exports = router;
