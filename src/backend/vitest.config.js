import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/helpers/globalSetup.js'],
    env: { NODE_ENV: 'test', BCRYPT_ROUNDS: '4', LOGIN_MAX_ATTEMPTS: '1000' },
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
