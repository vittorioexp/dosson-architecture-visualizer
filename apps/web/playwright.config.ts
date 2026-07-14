import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter @dosson-architecture-visualizer/api dev',
      url: 'http://localhost:4000/health/live',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @dosson-architecture-visualizer/dashboard dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
