import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 35_000,
  expect: {
    timeout: 7_000
  },
  fullyParallel: false,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173/psinote/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/psinote/',
    reuseExistingServer: !CI,
    timeout: 120_000,
    env: {
      ...process.env,
      VITE_USE_FIREBASE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-psinote-e2e',
      VITE_FIREBASE_STORAGE_BUCKET: 'demo-psinote-e2e.appspot.com'
    }
  },
  projects: [
    {
      name: 'desktop-chromium',
      testIgnore: /mobile\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 }
      }
    },
    {
      name: 'mobile-375',
      testMatch: /mobile\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'mobile-390',
      testMatch: /mobile\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'mobile-430',
      testMatch: /mobile\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true
      }
    }
  ]
});
