import { expect, test, type Page } from '@playwright/test';

/**
 * Pre-deploy smoke suite for the pixel world, run against a locally built
 * production bundle (see playwright.config.local.ts).
 *
 * The world is a canvas, so these tests assert on the DOM overlay — which
 * panel is open, what the HUD says — plus one pixel check that the canvas is
 * actually painting rather than sitting blank.
 */

/** Wait for the world's first painted frame and the fonts it labels with. */
async function ready(page: Page): Promise<void> {
  await page.waitForSelector('app-pixel-world canvas');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

/** Panels fade via CSS, so "open" means the class, not just presence. */
function panel(page: Page, index: number) {
  return page.locator(`[data-panel="${index}"]`);
}

test.describe('pixel world', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ready(page);
  });

  test('paints a non-blank world canvas', async ({ page }) => {
    const canvas = page.locator('app-pixel-world canvas');
    await expect(canvas).toBeVisible();

    // Sample the sky: if the renderer never ran, this stays transparent.
    const pixel = await page.evaluate(() => {
      const cv = document.querySelector('app-pixel-world canvas') as HTMLCanvasElement;
      const ctx = cv.getContext('2d');
      const d = ctx!.getImageData(Math.round(cv.width / 2), 40, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] };
    });
    expect(pixel.a).toBe(255);
    expect(pixel.r + pixel.g + pixel.b).toBeGreaterThan(0);
  });

  test('opens the hill panel on arrival and reports morning', async ({ page }) => {
    await expect(panel(page, 0)).toHaveClass(/is-open/);
    await expect(page.getByText('MORNING')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('worlds by night');
    await page.screenshot({ path: 'e2e/screenshots/local/landing.png' });
  });

  // The avatar physically walks to a HUD destination rather than cutting to it,
  // so a cross-world trip takes ~19s of wall clock. Timeouts here are sized for
  // the walk, not for a slow page.
  const WALK = 40_000;

  test('HUD travel walks to a chapter and swaps the panel', async ({ page }) => {
    await page.getByRole('button', { name: 'TOOLBELT' }).click();
    await expect(panel(page, 2)).toHaveClass(/is-open/, { timeout: WALK });
    await expect(panel(page, 0)).not.toHaveClass(/is-open/);
    await page.screenshot({ path: 'e2e/screenshots/local/toolbelt.png' });
  });

  test('walking the full world reaches nightfall and flags every stop', async ({ page }) => {
    test.slow();
    await expect(page.getByText(/FLAGS 1\/6/)).toBeVisible();
    await page.getByRole('button', { name: 'CAMPFIRE' }).click();
    await expect(panel(page, 5)).toHaveClass(/is-open/, { timeout: WALK });
    await expect(page.getByText('NIGHTFALL')).toBeVisible();
    await expect(page.getByText(/FLAGS 6\/6/)).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/local/campfire.png' });
  });

  test('a project tile opens its case study and Escape closes it', async ({ page }) => {
    await page.getByRole('button', { name: 'THE WORKS' }).click();
    await expect(panel(page, 1)).toHaveClass(/is-open/, { timeout: WALK });

    await page.getByRole('button', { name: /Cosmic Collector/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Cosmic Collector' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Gravity-tether traversal');
    await page.screenshot({ path: 'e2e/screenshots/local/detail.png' });

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('keyboard walking moves the avatar east', async ({ page }) => {
    const before = await page.locator('.progress__fill').evaluate((el) => el.clientWidth);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(1200);
    await page.keyboard.up('ArrowRight');
    const after = await page.locator('.progress__fill').evaluate((el) => el.clientWidth);
    expect(after).toBeGreaterThan(before);
  });
});
