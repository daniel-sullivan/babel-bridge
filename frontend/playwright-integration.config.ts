import { defineConfig, devices } from '@playwright/test';

/**
 * Simplified integration test configuration that avoids rate limiting conflicts
 * by using a single conservative approach
 */
export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false, // Serial execution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 120000, // 2 minutes
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    actionTimeout: 30000,
  },

  projects: [
    {
      name: 'integration-tests',
      testMatch: ['**/integration.spec.ts'], // Use the single consolidated test file
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    // Single backend instance with rate limiting disabled for stable testing
    {
      command: 'cd .. && go run main.go',
      port: 8082,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
      env: {
        ENGINE: 'mock',
        PORT: '8082',
        SECRET_KEY: 'test-secret-key-integration',
        GIN_MODE: 'test',
        RATE_LIMIT_DISABLED: 'true', // Disable rate limiting for integration tests
      },
    },
    // Frontend dev server
    {
      command: 'cross-env INTEGRATION_TEST=true npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
      env: {
        INTEGRATION_TEST: 'true'
      }
    },
  ],
});
