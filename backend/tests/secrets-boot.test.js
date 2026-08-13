// SCRUM-80 / SEC-2 — Boot-time secret enforcement (AC-5).
// The app must refuse to start (process.exit(1)) when JWT signing secrets are
// missing, too weak, or identical. assertSecrets() EXITS the process rather than
// throwing, so the failure paths spy on process.exit instead of expecting a throw.
// Deterministic: pure function over the exported (mutable) `env` object; no DB.
const { describe, it, expect, vi, afterEach } = require('vitest');
const { assertSecrets, env, MIN_SECRET_LENGTH } = require('../src/config/env');

// Restore the valid secrets configured by tests/setup.js after each mutation so
// no other suite inherits a broken env.
const GOOD_SECRET = env.JWT_SECRET;
const GOOD_REFRESH = env.JWT_REFRESH_SECRET;

afterEach(() => {
  env.JWT_SECRET = GOOD_SECRET;
  env.JWT_REFRESH_SECRET = GOOD_REFRESH;
  vi.restoreAllMocks();
});

describe('SEC-2: assertSecrets boot guard (AC-5)', () => {
  it('passes and does not exit when secrets are valid, distinct, and >= min length', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    expect(GOOD_SECRET.length).toBeGreaterThanOrEqual(MIN_SECRET_LENGTH);
    assertSecrets();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('refuses to start (exit 1) when JWT_SECRET is missing', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    env.JWT_SECRET = undefined;
    expect(() => assertSecrets()).toThrow(/process\.exit called/);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('refuses to start (exit 1) when a secret is shorter than the minimum length', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    env.JWT_SECRET = 'too-short';
    expect(() => assertSecrets()).toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('refuses to start (exit 1) when access and refresh secrets are identical', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    env.JWT_REFRESH_SECRET = env.JWT_SECRET;
    expect(() => assertSecrets()).toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
