import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/production',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL:
      process.env.PSINOTE_PRODUCTION_URL
      || 'https://fhenriquefcruz.github.io/psinote/',
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
