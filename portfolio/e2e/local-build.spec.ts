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

  test('fast travel crosses the whole world in a few seconds', async ({ page }) => {
    // Travel holds a target duration rather than a constant speed, so the
    // longest trip is capped. Before that change this took ~19s.
    const started = Date.now();
    await page.getByRole('button', { name: 'CAMPFIRE' }).click();
    await expect(panel(page, 5)).toHaveClass(/is-open/, { timeout: WALK });
    expect(Date.now() - started).toBeLessThan(9_000);
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


test.describe('narrow viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ready(page);
  });

  test('frames the world at a usable zoom', async ({ page }) => {
    // Pixel scale is derived from the tighter axis. Deriving it from height
    // alone left a phone at desktop scale, showing ~3% of the world.
    const { canvasWidth, viewportWidth } = await page.evaluate(() => {
      const cv = document.querySelector('app-pixel-world canvas') as HTMLCanvasElement;
      return { canvasWidth: cv.width, viewportWidth: window.innerWidth };
    });
    expect(canvasWidth).toBe(viewportWidth);
    await page.screenshot({ path: 'e2e/screenshots/local/mobile-hill.png' });
  });

  test('docks the panel to the bottom as a sheet', async ({ page }) => {
    const sheet = panel(page, 0);
    await expect(sheet).toHaveClass(/is-open/);

    const box = (await sheet.boundingBox())!;
    const viewport = page.viewportSize()!;
    // Full-bleed horizontally, anchored to the bottom edge, and leaving the
    // upper half of the world visible.
    expect(box.x).toBeLessThanOrEqual(1);
    expect(box.width).toBeGreaterThan(viewport.width - 2);
    expect(box.y + box.height).toBeGreaterThan(viewport.height - 2);
    expect(box.y).toBeGreaterThan(viewport.height * 0.4);
  });

  test('lays the chapter nav out as a horizontal strip', async ({ page }) => {
    const links = page.getByRole('navigation', { name: 'Chapters' }).getByRole('button');
    const first = (await links.first().boundingBox())!;
    const second = (await links.nth(1).boundingBox())!;
    expect(second.x).toBeGreaterThan(first.x);
    expect(Math.abs(second.y - first.y)).toBeLessThan(2);
  });

  test('shows touch instructions instead of key bindings', async ({ page }) => {
    await expect(page.getByText(/TAP THE GROUND TO WALK/)).toBeVisible();
    await expect(page.getByText(/SHIFT RUN/)).toBeHidden();
  });

  test('taps the prompt to interact, with no keyboard', async ({ page }) => {
    const prompt = page.locator('.prompt');
    await expect(prompt).toHaveClass(/is-open/);
    await expect(prompt).toContainText('SIT ON THE SWING');

    await prompt.click();
    await expect(prompt).toContainText('GET UP');
    await page.screenshot({ path: 'e2e/screenshots/local/mobile-interact.png' });

    await prompt.click();
    await expect(prompt).toContainText('SIT ON THE SWING');
  });

  test('taps the ground to walk there', async ({ page }) => {
    const before = await page.locator('.progress__fill').evaluate((el) => el.clientWidth);
    // Above the bottom sheet, in the strip of ground the portrait framing
    // deliberately keeps clear.
    await page.locator('app-pixel-world canvas').tap({ position: { x: 360, y: 370 } });
    await page.waitForTimeout(1500);
    const after = await page.locator('.progress__fill').evaluate((el) => el.clientWidth);
    expect(after).toBeGreaterThan(before);
  });
});


test.describe('read view', () => {
  test('is reachable from the world and comes back', async ({ page }) => {
    await page.goto('/');
    await ready(page);

    await page.getByRole('link', { name: /READ AS A PAGE/ }).click();
    await expect(page).toHaveURL(/#\/read$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('worlds by night');
    // The world must not keep running behind the document.
    await expect(page.locator('app-pixel-world canvas')).toHaveCount(0);

    await page.getByRole('link', { name: /ENTER THE WORLD/ }).first().click();
    await expect(page.locator('app-pixel-world canvas')).toBeVisible();
  });

  test('is a shareable deep link', async ({ page }) => {
    // Hash routing so this resolves identically on GitHub Pages and locally.
    await page.goto('/#/read');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/short version/);
  });

  test('carries every section of the portfolio', async ({ page }) => {
    await page.goto('/#/read');
    for (const heading of [
      'Selected work',
      'Tools',
      'Experience',
      'Education',
      'About this site',
    ]) {
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    // Both projects present, engineering work first.
    const titles = await page.locator('.project h3').allTextContents();
    expect(titles).toEqual(['FinFree', 'Cosmic Collector']);
  });

  test('scrolls, unlike the world route', async ({ page }) => {
    await page.goto('/#/read');
    await page.mouse.wheel(0, 1200);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    await page.screenshot({ path: 'e2e/screenshots/local/read.png', fullPage: false });
  });

  test('is readable on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/read');
    const box = (await page.locator('.project').first().boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(390);
    // No horizontal overflow anywhere on the page.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);
  });
});
