import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'e2e/**/*.spec.ts',
  fullyParallel: process.env['LIVE_BACKEND'] ? false : true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['LIVE_BACKEND'] ? 1 : (process.env['CI'] ? 2 : 0),
  workers: process.env['LIVE_BACKEND'] ? 1 : (process.env['CI'] ? 1 : undefined),
  reporter: 'html',
  timeout: process.env['LIVE_BACKEND'] ? 60000 : 30000,

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    video: process.env['RECORD_VIDEO'] === 'true' ? 'on' : 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: process.env['CI']
    ? {
        command: 'ng serve',
        url: 'http://localhost:4200',
        reuseExistingServer: false,
      }
    : undefined,
});
