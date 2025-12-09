import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  testDir: './',
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: path.resolve(__dirname, './global-setup.ts'),
  globalTeardown: path.resolve(__dirname, './global-teardown.ts'),
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Separate projects to avoid any potential conflicts
  projects: [
    {
      name: 'e2e-tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  // Don't look for any setup files that might load Vitest
  testIgnore: ['**/*setup*', '**/*vitest*', '**/src/**'],
})

