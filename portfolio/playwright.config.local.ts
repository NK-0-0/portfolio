import { defineConfig, devices } from '@playwright/test';

/**
 * Local pre-deploy smoke suite (ROADMAP.md Milestone 4, issue 4.4).
 *
 * Unlike the sibling `playwright.config.ts` — whose baseURL is the *live*
 * GitHub Pages site and which therefore only ever tests whatever was last
 * deployed — this config builds the current working tree and serves it
 * locally, so a broken build is caught before it ships (the exact failure
 * mode where a stale live site fails the prod suite for the wrong reason).
 *
 * `webServer` builds + serves `dist/portfolio/browser` and Playwright waits
 * on the health-checked `url` before running, then tears it down. Artifacts
 * (outputDir + screenshots) are namespaced under local-only subfolders so a
 * local run never dirties the prod suite's tracked screenshots.
 *
 * Cross-browser matrix (ROADMAP Milestone 4, issue 4.7 / REQUIREMENTS NFR-9):
 * the smoke suite runs against Chromium, WebKit, and Firefox — the three
 * engines mapping to NFR-6's Chrome/Safari/Firefox support floor. GitHub
 * Actions' `ubuntu-latest` + `npx playwright install --with-deps` provides all
 * three; a sandboxed local box may be missing WebKit's system libs, in which
 * case run a subset with `--project=chromium --project=firefox`.
 */

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'local-build.spec.ts',
  timeout: 60_000,
  retries: 0,
  outputDir: 'test-results/local',
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'off',
    browserName: 'chromium',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    // Default base href (`/`) — served from the directory root, so tests
    // navigate to `/`, not `/portfolio/` like the deployed prod suite.
    command: `ng build --configuration production && npx http-server dist/portfolio/browser -p ${PORT} -s -c-1`,
    url: BASE_URL,
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
