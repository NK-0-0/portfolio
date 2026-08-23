import { expect, test } from '@playwright/test';

/**
 * Post-deploy smoke checks against the live GitHub Pages site.
 *
 * Deliberately thin: this suite answers "did the deploy land and is the world
 * running", not "is the behaviour correct" — that is the local suite's job
 * (`e2e/local-build.spec.ts`), which runs against a build of the current tree.
 *
 * Run with `npx playwright test`. Not wired into CI; it is a manual gate for
 * after a Pages deploy has finished.
 */
test.describe('deployed site', () => {
  test('serves the app and paints the world without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/portfolio/');

    await expect(page).toHaveTitle(/Pixel World/);
    await expect(page.locator('app-pixel-world canvas')).toBeVisible();

    // The hill panel is the landing state; if it never opens, the render loop
    // is not publishing state to the overlay.
    await expect(page.locator('[data-panel="0"]')).toHaveClass(/is-open/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('exposes the chapter navigation', async ({ page }) => {
    await page.goto('/portfolio/');
    const nav = page.getByRole('navigation', { name: 'Chapters' });
    await expect(nav.getByRole('button')).toHaveCount(6);
  });
});
