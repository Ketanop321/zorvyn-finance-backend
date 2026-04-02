/**
 * Transaction Tests — Validation, Idempotency, Soft Delete
 */
'use strict';

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../app');
const { cleanupByDomain, disconnectPrisma } = require('./helpers');

const TEST_DOMAIN = 'tx-test.dev';
let adminToken;

beforeAll(async () => {
  await cleanupByDomain(TEST_DOMAIN);
  await request(app).post('/api/auth/register').send({
    name: 'TX Admin',
    email: `admin@${TEST_DOMAIN}`,
    password: 'TxAdmin@123',
    role: 'ADMIN',
  });
  const res = await request(app).post('/api/auth/login').send({
    email: `admin@${TEST_DOMAIN}`,
    password: 'TxAdmin@123',
  });
  adminToken = res.body.data.accessToken;
});

afterAll(async () => {
  await cleanupByDomain(TEST_DOMAIN);
  await disconnectPrisma();
});

const authHeader = () => ({ Authorization: `Bearer ${adminToken}` });

const validTx = () => ({
  amount: 75000,
  type: 'INCOME',
  category: 'Salary',
  date: new Date().toISOString(),
  description: 'Test transaction',
});

describe('Transaction Validation', () => {
  it('returns 400 when amount is missing', async () => {
    const { amount, ...noAmount } = validTx();
    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', uuidv4())
      .send(noAmount)
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.some((e) => e.field === 'amount')).toBe(true);
  });

  it('returns 400 when amount is negative', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', uuidv4())
      .send({ ...validTx(), amount: -5000 })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when amount is zero', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', uuidv4())
      .send({ ...validTx(), amount: 0 })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when type is invalid', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', uuidv4())
      .send({ ...validTx(), type: 'CREDIT' })
      .expect(400);

    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when X-Idempotency-Key header is missing', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .send(validTx())
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('Transaction Idempotency', () => {
  it('returns 200 (not 201) for duplicate idempotency key', async () => {
    const key = uuidv4();

    const first = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', key)
      .send(validTx())
      .expect(201);

    const second = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', key)
      .send(validTx())
      .expect(200);

    // Both responses reference the SAME transaction ID
    expect(first.body.data.id).toBe(second.body.data.id);
  });
});

describe('Soft Delete', () => {
  it('soft-delete: isDeleted=true, GET by ID returns 404', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', uuidv4())
      .send(validTx())
      .expect(201);

    const txId = createRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set(authHeader())
      .expect(200);

    expect(deleteRes.body.data.isDeleted).toBe(true);
    expect(deleteRes.body.data.deletedAt).not.toBeNull();

    await request(app)
      .get(`/api/transactions/${txId}`)
      .set(authHeader())
      .expect(404);
  });

  it('deleted transactions do NOT appear in list', async () => {
    const createRes = await request(app)
      .post('/api/transactions')
      .set(authHeader())
      .set('X-Idempotency-Key', uuidv4())
      .send({ ...validTx(), description: 'Will be deleted' })
      .expect(201);

    const txId = createRes.body.data.id;
    await request(app).delete(`/api/transactions/${txId}`).set(authHeader());

    const listRes = await request(app)
      .get('/api/transactions')
      .set(authHeader())
      .expect(200);

    const ids = listRes.body.data.map((t) => t.id);
    expect(ids).not.toContain(txId);
  });
});
