import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    hookTimeout: 120000,
    testTimeout: 30000,
    // Fork pool keeps each file isolated; the shared in-memory replica set is
    // created once per file in setup.js.
    pool: 'forks',
  },
});
