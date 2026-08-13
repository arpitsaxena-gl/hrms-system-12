// SCRUM-80 / SEC-11, SEC-9 — Consistent request validation (AC-9).
// Field-level cases derived directly from analysis_output.json
// validation_classifications (input / business / conditional) and the Joi
// schemas under src/validators. Every write route rejects invalid input with
// HTTP 400 and a field-level `errors` array BEFORE the controller runs, strips
// unknown fields, and ignores out-of-allow-list query filters.
const request = require('supertest');
const { describe, it, expect } = require('vitest');
const { createApp } = require('../src/app');
const { seedEmployee, uniqueEmail } = require('./helpers');

const app = createApp();

const validRegister = () => ({
  firstName: 'V', lastName: 'A', email: uniqueEmail(), password: 'secret1',
});

describe('SEC-11/SEC-9: field-level request validation (AC-9)', () => {
  // input: password minlength 6 (validation_classifications.input[0])
  it('rejects registration with a too-short password (400 + errors)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister(), password: '123' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  // input: email format (validation_classifications.input[1])
  it('rejects registration with a malformed email (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister(), email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  // input: stripUnknown — unexpected fields are dropped, request still succeeds
  it('strips an unknown field on registration instead of rejecting (201)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegister(), isAdminBackdoor: true });
    expect(res.status).toBe(201);
    expect(res.body.data.user.isAdminBackdoor).toBeUndefined();
  });

  // employee.schema: required refs missing -> 400 before controller
  it('rejects employee creation missing required department/designation (400 + errors)', async () => {
    const admin = await seedEmployee({ role: 'admin' });
    const token = admin.user.generateAuthToken();
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'X', lastName: 'Y', email: uniqueEmail(), password: 'secret1' });
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  // employee.schema: role must be within the allowed enum
  it('rejects employee creation with an out-of-enum role (400)', async () => {
    const admin = await seedEmployee({ role: 'admin' });
    const token = admin.user.generateAuthToken();
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'X', lastName: 'Y', email: uniqueEmail(), password: 'secret1',
        department: 'a'.repeat(24), designation: 'b'.repeat(24),
        joiningDate: '2026-01-01', role: 'superking',
      });
    expect(res.status).toBe(400);
  });

  // leave.schema: endDate must not precede startDate (input/format cross-check)
  it('rejects a leave request whose endDate precedes startDate (400)', async () => {
    const { user } = await seedEmployee({});
    const token = user.generateAuthToken();
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${token}`)
      .send({ leaveType: 'annual', startDate: '2026-02-10', endDate: '2026-02-01', reason: 'trip' });
    expect(res.status).toBe(400);
  });

  // payroll.schema: month bounded 1..12 (validation_classifications business/period)
  it('rejects a payroll run with an out-of-range month (400)', async () => {
    const admin = await seedEmployee({ role: 'admin' });
    const token = admin.user.generateAuthToken();
    const res = await request(app)
      .post('/api/payroll/process')
      .set('Authorization', `Bearer ${token}`)
      .send({ month: 13, year: 2026 });
    expect(res.status).toBe(400);
  });

  // payroll.schema: year bounded (>= 2000)
  it('rejects a payroll run with an out-of-range year (400)', async () => {
    const admin = await seedEmployee({ role: 'admin' });
    const token = admin.user.generateAuthToken();
    const res = await request(app)
      .post('/api/payroll/process')
      .set('Authorization', `Bearer ${token}`)
      .send({ month: 5, year: 1990 });
    expect(res.status).toBe(400);
  });

  // SEC-9: list query filters outside the allow-list are ignored, not errored
  it('ignores an unknown query filter on a scoped list without failing (200)', async () => {
    const { user } = await seedEmployee({});
    const token = user.generateAuthToken();
    const res = await request(app)
      .get('/api/leaves?bogusFilter=1&status=pending')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
