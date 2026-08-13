/**
 * Centralized environment configuration and boot-time secret enforcement.
 *
 * This is the single source of truth for environment access. No inline
 * `process.env.X || 'fallback'` for security-sensitive values may exist
 * anywhere else in the codebase (SEC-2).
 */
const logger = require('../utils/logger');

const MIN_SECRET_LENGTH = 32;

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',

  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,

  // Multi-document atomicity requires a replica set (Atlas provides one).
  // Set TRANSACTIONS_ENABLED=false only for a standalone local dev MongoDB.
  TRANSACTIONS_ENABLED:
    String(process.env.TRANSACTIONS_ENABLED || 'true').toLowerCase() !== 'false',

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

const isProd = () => env.NODE_ENV === 'production';

/**
 * Fail fast at boot if signing secrets are missing or too weak.
 * Exits the process (never serves traffic) when misconfigured (SEC-2).
 */
function assertSecrets() {
  const problems = [];
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = env[key];
    if (!value) problems.push(`${key} is not set`);
    else if (value.length < MIN_SECRET_LENGTH)
      problems.push(`${key} must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (env.JWT_SECRET && env.JWT_REFRESH_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    problems.push('JWT_SECRET and JWT_REFRESH_SECRET must be different values');
  }
  if (problems.length) {
    logger.error(
      `FATAL: insecure JWT configuration — ${problems.join('; ')}. Refusing to start.`
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

module.exports = { env, assertSecrets, isProd, MIN_SECRET_LENGTH };
