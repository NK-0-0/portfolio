import { defineConfig, devices } from '@playwright/test';

/**
 * Post-deploy smoke suite, run by hand against the *live* GitHub Pages site.
 *
 * `testMatch` is explicit: without it this config would also pick up
 * `local-build.spec.ts` and run the local suite against production, where the
 * long in-world walks and canvas pixel reads make no sense. The local dev-loop
 * suite is `playwright.config.local.ts` (`npm run e2e:local`).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'portfolio.spec.ts',
  timeout: 60_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://nk-0-0.github.io',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    // Capture console errors so tests can assert on them
    browserName: 'chromium',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
