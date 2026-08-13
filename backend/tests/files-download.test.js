// SCRUM-80 / SEC-5 — Authenticated file download replaces open static /uploads (AC-4).
// Verifies: (a) unauthenticated access is rejected, (b) an authenticated
// non-owner cannot retrieve a file they do not own / that does not exist,
// (c) path-traversal payloads never return file contents, and (d) legacy
// /uploads links redirect to the guarded endpoint. Deterministic (no files on
// disk are required — the guard/404 fires before any read succeeds).
const request = require('supertest');
const { describe, it, expect } = require('vitest');
const { createApp } = require('../src/app');
const { seedEmployee } = require('./helpers');

const app = createApp();

describe('SEC-5: protected file download (AC-4)', () => {
  it('rejects an unauthenticated download with 401', async () => {
    const res = await request(app).get('/api/files/avatar/anything.png');
    expect(res.status).toBe(401);
  });

  it('does not serve a file the requester does not own (403/404, never 200)', async () => {
    const { user } = await seedEmployee({});
    const token = user.generateAuthToken();
    const res = await request(app)
      .get('/api/files/avatar/not-my-file.png')
      .set('Authorization', `Bearer ${token}`);
    expect([403, 404]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });

  it('rejects a path-traversal filename without returning contents (>= 400)', async () => {
    const { user } = await seedEmployee({});
    const token = user.generateAuthToken();
    const traversal = encodeURIComponent('../../server.js');
    const res = await request(app)
      .get(`/api/files/avatar/${traversal}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).not.toBe(200);
  });

  it('redirects legacy /uploads links to the guarded /api/files endpoint (307)', async () => {
    const res = await request(app).get('/uploads/avatar/legacy.png');
    expect(res.status).toBe(307);
    expect(res.headers.location).toBe('/api/files/avatar/legacy.png');
  });
});
