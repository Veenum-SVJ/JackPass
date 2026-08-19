import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration.
 *
 * Runs against the local dev stack: the Express API server (:9001) and the
 * Vite dev server (:9003, which proxies /api → :9001). Tests mock the external
 * Supabase/Paystack/AI endpoints at the network layer (see e2e/helpers/mocks.ts)
 * so the suite is deterministic and needs no real credentials.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:9003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:server',
      url: 'http://localhost:9001/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
    },
    {
      command: 'npm run dev:client',
      url: 'http://localhost:9003',
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
    },
  ],
});
