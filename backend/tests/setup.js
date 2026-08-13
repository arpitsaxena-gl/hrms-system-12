const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { beforeAll, afterAll, afterEach } = require('vitest');

// Secrets and config MUST be set before any application module (which reads
// process.env at import time) is loaded. Rate limits are relaxed so suites that
// hammer /auth are not throttled.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long_abcd';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars_wxyz';
process.env.TRANSACTIONS_ENABLED = 'true';
process.env.RATE_LIMIT_MAX = '100000';
process.env.LOGIN_RATE_LIMIT_MAX = '100000';

let replset;

beforeAll(async () => {
  // Replica set is required so multi-document transactions (leave/employee/payroll) work.
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replset.getUri());
}, 120000);

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replset) await replset.stop();
});
