/**
 * Auth Tests
 */
'use strict';

const request = require('supertest');
const app = require('../app');
const { cleanupByDomain, disconnectPrisma } = require('./helpers');

const TEST_DOMAIN = 'zorvyn-test.dev';
const TEST_USER = {
  name: 'Test Admin',
  email: `test.admin@${TEST_DOMAIN}`,
  password: 'TestAdmin@123',
  role: 'ADMIN',
};

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanupByDomain(TEST_DOMAIN);
  });

  afterAll(async () => {
    await cleanupByDomain(TEST_DOMAIN);
    await disconnectPrisma();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return access token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(TEST_USER.email);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should return 409 if email already exists', async () => {
      await request(app).post('/api/auth/register').send(TEST_USER);
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: 'not-an-email' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 for weak password (no uppercase)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: `new@${TEST_DOMAIN}`, password: 'weakpassword1!' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject unknown fields (mass assignment protection)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...TEST_USER, email: `hacker@${TEST_DOMAIN}`, isAdmin: true, extraField: 'x' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(TEST_USER);
    });

    it('should login and return access token + set httpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(TEST_USER.email);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.body.data).not.toHaveProperty('refreshToken');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPassword@999' })
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: `nobody@${TEST_DOMAIN}`, password: 'SomePass@123' })
        .expect(401);

      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for missing password field', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER.email })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
