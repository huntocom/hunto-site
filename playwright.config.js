// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright config for hunto.com browser testing.
 *
 * The site is password-gated (password: "Fart") using sessionStorage.
 * Each test uses a shared setup that unlocks the gate before running.
 *
 * Run: npx playwright test
 * Run headed: npx playwright test --headed
 * Run UI mode: npx playwright test --ui
 */
module.exports = defineConfig({
  testDir: './tests',

  /* Maximum time one test can run */
  timeout: 60_000,

  /* Expect timeout for assertions */
  expect: { timeout: 10_000 },

  /* Run tests sequentially in CI, parallel locally */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry failed tests once on CI */
  retries: process.env.CI ? 1 : 0,

  /* Reporter */
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    /* Base URL — all page.goto('/') calls resolve against this */
    baseURL: 'https://hunto.com',

    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'on-first-retry',

    /* Default viewport */
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
