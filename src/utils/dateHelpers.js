/**
 * Date Helper Utilities
 * Used primarily for the dashboard monthly trend endpoint.
 */
'use strict';

/**
 * Get the start and end dates for the last N months
 * @param {number} months - Number of months to look back (default 6)
 * @returns {{ startDate: Date, endDate: Date }}
 */
const getLastNMonthsRange = (months = 6) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months + 1);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, endDate };
};

/**
 * Format a date to YYYY-MM string for grouping
 * @param {Date} date
 * @returns {string}
 */
const toYearMonth = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Generate an array of YYYY-MM strings for the last N months
 * (in ascending order) — used to fill in months with no transactions
 * @param {number} months
 * @returns {string[]}
 */
const generateMonthLabels = (months = 6) => {
  const labels = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(toYearMonth(d));
  }
  return labels;
};

module.exports = { getLastNMonthsRange, toYearMonth, generateMonthLabels };
