const request = require('supertest');
const { describe, it, expect } = require('vitest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');
const { seedEmployee } = require('./helpers');

const app = createApp();

describe('Auth & authorization hardening', () => {
  it('SEC-1: register ignores a client-supplied role and always creates an employee', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstName: 'A', lastName: 'B', email: 'sec1@test.com', password: 'secret1', role: 'admin' });
    expect(res.status).toBe(201);
    const user = await User.findByEmail('sec1@test.com');
    expect(user.role).toBe('employee');
    expect(res.body.data.user.role).toBe('employee');
  });

  it('rejects an invalid register body with field-level errors', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('SEC-4: an employee cannot read another employee (403) but can read self (200)', async () => {
    const a = await seedEmployee({});
    const b = await seedEmployee({});
    const tokenA = a.user.generateAuthToken();
    const other = await request(app).get(`/api/employees/${b.emp._id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(other.status).toBe(403);
    const self = await request(app).get(`/api/employees/${a.emp._id}`).set('Authorization', `Bearer ${tokenA}`);
    expect(self.status).toBe(200);
  });

  it('SEC-4: admin can read any employee', async () => {
    const admin = await seedEmployee({ role: 'admin' });
    const target = await seedEmployee({});
    const token = admin.user.generateAuthToken();
    const res = await request(app).get(`/api/employees/${target.emp._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('SEC-8: repeated failed logins lock the account and return 423', async () => {
    await request(app).post('/api/auth/register').send({ firstName: 'L', lastName: 'K', email: 'lock@test.com', password: 'secret1' });
    let last;
    for (let i = 0; i < 6; i += 1) {
      last = await request(app).post('/api/auth/login').send({ email: 'lock@test.com', password: 'wrong-password' });
    }
    expect([401, 423]).toContain(last.status);
    const locked = await request(app).post('/api/auth/login').send({ email: 'lock@test.com', password: 'secret1' });
    expect(locked.status).toBe(423);
  });

  it('SEC-7: a revoked refresh token can no longer be used', async () => {
    const reg = await request(app).post('/api/auth/register').send({ firstName: 'R', lastName: 'T', email: 'refresh@test.com', password: 'secret1' });
    const { token, refreshToken } = reg.body.data;
    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).send({ refreshToken });
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });
});
