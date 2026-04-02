/**
 * Dashboard Tests
 */
'use strict';

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { cleanupByDomain, disconnectPrisma } = require('./helpers');

const TEST_DOMAIN = 'dash-test.dev';
let adminToken;

beforeAll(async () => {
  await cleanupByDomain(TEST_DOMAIN);

  await request(app).post('/api/auth/register').send({
    name: 'Dash Admin',
    email: `admin@${TEST_DOMAIN}`,
    password: 'DashAdmin@123',
    role: 'ADMIN',
  });

  const loginRes = await request(app).post('/api/auth/login').send({
    email: `admin@${TEST_DOMAIN}`,
    password: 'DashAdmin@123',
  });
  adminToken = loginRes.body.data.accessToken;

  // Seed known transactions for math verification
  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('X-Idempotency-Key', uuidv4())
    .send({ amount: 100000, type: 'INCOME', category: 'Salary', date: new Date().toISOString() });

  await request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${adminToken}`)
    .set('X-Idempotency-Key', uuidv4())
    .send({ amount: 40000, type: 'EXPENSE', category: 'Operations', date: new Date().toISOString() });
});

afterAll(async () => {
  await cleanupByDomain(TEST_DOMAIN);
  await disconnectPrisma();
});

describe('Dashboard Endpoints', () => {
  describe('GET /api/dashboard/summary', () => {
    it('returns correct structure with numeric values', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const { data } = res.body;
      expect(data).toHaveProperty('totalIncome');
      expect(data).toHaveProperty('totalExpenses');
      expect(data).toHaveProperty('netBalance');
      expect(data).toHaveProperty('transactionCount');
      expect(typeof data.totalIncome).toBe('number');
      expect(typeof data.totalExpenses).toBe('number');
      expect(typeof data.netBalance).toBe('number');
    });

    it('netBalance = totalIncome - totalExpenses (math check)', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { totalIncome, totalExpenses, netBalance } = res.body.data;
      expect(totalIncome).toBeGreaterThanOrEqual(100000);
      expect(totalExpenses).toBeGreaterThanOrEqual(40000);
      expect(netBalance).toBeCloseTo(totalIncome - totalExpenses, 2);
    });
  });

  describe('GET /api/dashboard/category-breakdown', () => {
    it('returns array with category, total, count, type', async () => {
      const res = await request(app)
        .get('/api/dashboard/category-breakdown')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const item = res.body.data[0];
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('total');
      expect(item).toHaveProperty('count');
      expect(item).toHaveProperty('type');
    });
  });

  describe('GET /api/dashboard/monthly-trend', () => {
    it('returns exactly 6 months of data in YYYY-MM format', async () => {
      const res = await request(app)
        .get('/api/dashboard/monthly-trend')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(6);

      const item = res.body.data[0];
      expect(item).toHaveProperty('month');
      expect(item).toHaveProperty('income');
      expect(item).toHaveProperty('expenses');
      expect(item).toHaveProperty('net');
      expect(item.month).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe('GET /api/dashboard/recent-activity', () => {
    it('returns at most 10 recent transactions', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-activity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });
  });
});
