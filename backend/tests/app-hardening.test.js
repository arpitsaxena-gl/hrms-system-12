// SCRUM-80 / SEC-6, SEC-10 — App-level hardening & consistent contract (AC-11, AC-13).
// Verifies the re-enabled Helmet CSP header is present, the health probe works,
// unknown routes return the consistent { success:false } envelope, and no
// server error leaks an internal stack in the standard error shape.
// Deterministic: pure HTTP assertions against the app factory, no DB writes.
const request = require('supertest');
const { describe, it, expect } = require('vitest');
const { createApp } = require('../src/app');

const app = createApp();

describe('SEC-6/SEC-10: app hardening & response contract', () => {
  it('SEC-6: sends a Content-Security-Policy header (Helmet re-enabled)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
  });

  it('exposes a health probe returning status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('SEC-10: unknown routes return the consistent { success:false } envelope (404)', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe('string');
  });

  it('SEC-10: a validation error responds with the typed { success:false, errors } shape and no stack', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.stack).toBeUndefined();
  });
});
