const request = require('supertest');
const { describe, it, expect } = require('vitest');
const { createApp } = require('../src/app');

const app = createApp();

async function registerToken(email) {
  const res = await request(app).post('/api/auth/register').send({ firstName: 'V', lastName: 'U', email, password: 'secret1' });
  return res.body.data.token;
}

describe('Validation layer (SEC-11 / SEC-9)', () => {
  it('rejects a leave with endDate before startDate with a field-level error', async () => {
    const token = await registerToken('val1@test.com');
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${token}`)
      .send({ leaveType: 'annual', startDate: '2026-09-05', endDate: '2026-09-01', reason: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'endDate')).toBe(true);
  });

  it('rejects a leave with an invalid leaveType', async () => {
    const token = await registerToken('val2@test.com');
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${token}`)
      .send({ leaveType: 'vacation', startDate: '2026-09-01', endDate: '2026-09-02', reason: 'x' });
    expect(res.status).toBe(400);
  });

  it('ignores non-allow-listed query keys on list endpoints (no operator injection)', async () => {
    const token = await registerToken('val3@test.com');
    const res = await request(app)
      .get('/api/leaves?status=pending&evilKey=1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
