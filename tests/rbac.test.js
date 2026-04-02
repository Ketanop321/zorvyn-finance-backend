/**
 * RBAC Tests
 */
'use strict';

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { cleanupByDomain, disconnectPrisma } = require('./helpers');

const TEST_DOMAIN = 'rbac-test.dev';
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const registerAndLogin = async (role) => {
  const email = `${role.toLowerCase()}@${TEST_DOMAIN}`;
  await request(app).post('/api/auth/register').send({
    name: `Test ${role}`,
    email,
    password: 'TestPass@123',
    role,
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'TestPass@123' });
  return res.body.data.accessToken;
};

describe('RBAC — Role-Based Access Control', () => {
  let adminToken, analystToken, viewerToken;

  beforeAll(async () => {
    await cleanupByDomain(TEST_DOMAIN);
    adminToken = await registerAndLogin('ADMIN');
    analystToken = await registerAndLogin('ANALYST');
    viewerToken = await registerAndLogin('VIEWER');
  });

  afterAll(async () => {
    await cleanupByDomain(TEST_DOMAIN);
    await disconnectPrisma();
  });

  describe('POST /api/transactions (ADMIN only)', () => {
    const txPayload = {
      amount: 50000,
      type: 'INCOME',
      category: 'Salary',
      date: new Date().toISOString(),
    };

    it('ADMIN can create a transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set(auth(adminToken))
        .set('X-Idempotency-Key', uuidv4())
        .send(txPayload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('ANALYST cannot create a transaction — returns 403', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set(auth(analystToken))
        .set('X-Idempotency-Key', uuidv4())
        .send(txPayload)
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('VIEWER cannot create a transaction — returns 403', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set(auth(viewerToken))
        .set('X-Idempotency-Key', uuidv4())
        .send(txPayload)
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Unauthenticated request returns 401', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('X-Idempotency-Key', uuidv4())
        .send(txPayload)
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/transactions (ANALYST + ADMIN)', () => {
    it('ADMIN can list transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('ANALYST can list transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set(auth(analystToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('VIEWER cannot list transactions — returns 403', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set(auth(viewerToken))
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/users (ADMIN only)', () => {
    it('ADMIN can list users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('ANALYST cannot list users — returns 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set(auth(analystToken))
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('VIEWER cannot list users — returns 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set(auth(viewerToken))
        .expect(403);

      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/dashboard/summary (all roles)', () => {
    it('VIEWER can access dashboard summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set(auth(viewerToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('ANALYST can access dashboard summary', async () => {
      const res = await request(app)
        .get('/api/dashboard/summary')
        .set(auth(analystToken))
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
