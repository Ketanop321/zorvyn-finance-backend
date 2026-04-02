/**
 * Dashboard Controller
 */
'use strict';

const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../lib/ApiResponse');

/**
 * GET /api/dashboard/summary
 */
const getSummary = async (req, res) => {
  const summary = await dashboardService.getSummary();
  return ApiResponse.success(res, 200, 'Dashboard summary retrieved', summary);
};

/**
 * GET /api/dashboard/category-breakdown
 */
const getCategoryBreakdown = async (req, res) => {
  const breakdown = await dashboardService.getCategoryBreakdown();
  return ApiResponse.success(res, 200, 'Category breakdown retrieved', breakdown);
};

/**
 * GET /api/dashboard/monthly-trend
 */
const getMonthlyTrend = async (req, res) => {
  const trend = await dashboardService.getMonthlyTrend();
  return ApiResponse.success(res, 200, 'Monthly trend retrieved (last 6 months)', trend);
};

/**
 * GET /api/dashboard/recent-activity
 */
const getRecentActivity = async (req, res) => {
  const activity = await dashboardService.getRecentActivity();
  return ApiResponse.success(res, 200, 'Recent activity retrieved', activity);
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrend, getRecentActivity };
