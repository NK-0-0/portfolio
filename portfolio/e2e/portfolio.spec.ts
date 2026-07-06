import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

// ─── helpers ──────────────────────────────────────────────────────────────────

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err: Error) => errors.push(err.message));
  return errors;
}

async function waitForApp(page: Page): Promise<'3d' | 'fallback'> {
  await page.waitForLoadState('networkidle', { timeout: 30_000 });

  const canvas   = page.locator('ngt-canvas canvas').first();
  const fallback = page.locator('app-fallback');

  const which = await Promise.race([
    canvas.waitFor({ state: 'visible', timeout: 20_000 }).then(() => '3d' as const),
    fallback.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'fallback' as const),
  ]);

  return which;
}

// ─── smoke tests ──────────────────────────────────────────────────────────────

test.describe('Portfolio — live site smoke tests', () => {

  test('page loads without JS errors and renders something visible', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/portfolio/');
    const mode = await waitForApp(page);

    await page.screenshot({ path: 'e2e/screenshots/landing.png' });

    console.log(`Rendering mode: ${mode}`);
    console.log(`JS errors: ${errors.length ? errors.join('\n') : 'none'}`);

    const realErrors = errors.filter(e => !e.toLowerCase().includes('favicon'));
    expect(realErrors).toHaveLength(0);
    expect(['3d', 'fallback']).toContain(mode);
  });

  test('copyright footer is visible', async ({ page }) => {
    await page.goto('/portfolio/');
    await waitForApp(page);

    const footer = page.locator('app-footer footer');
    await expect(footer).toBeVisible({ timeout: 10_000 });
    await expect(footer).toContainText('All rights reserved');
    await expect(footer).toContainText(String(new Date().getFullYear()));
  });

  test('hero section is visible on load', async ({ page }) => {
    await page.goto('/portfolio/');
    await waitForApp(page);

    const hero = page.locator('.section--hero');
    await expect(hero).toBeVisible({ timeout: 10_000 });
    await expect(hero.locator('.scroll-cue')).toBeVisible();
  });

  test('3D canvas has non-zero dimensions', async ({ page }) => {
    await page.goto('/portfolio/');
    const mode = await waitForApp(page);

    if (mode !== '3d') { test.skip(); return; }

    const canvas = page.locator('ngt-canvas canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);
  });

  test('GLB models load without 404 errors', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('response', res => {
      if (res.url().includes('/models/') && res.status() >= 400) {
        failedRequests.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/portfolio/');
    await waitForApp(page);
    await page.waitForTimeout(5_000);

    expect(failedRequests).toHaveLength(0);
  });

  // ─── Scroll navigation ────────────────────────────────────────────────────
  // Sections reveal on scroll. The accessible skip-nav (data-section="*")
  // smooth-scrolls to each section so keyboard users and E2E tests don't
  // have to actually scroll.

  test.describe('Scroll navigation via accessible skip-nav', () => {
    const sections = [
      { id: 'about',      heading: 'About Me'   },
      { id: 'experience', heading: 'Experience' },
      { id: 'skills',     heading: 'Skills'     },
      { id: 'projects',   heading: 'Projects'   },
      { id: 'contact',    heading: 'Contact'    },
    ] as const;

    for (const { id, heading } of sections) {
      test(`"${heading}" section scrolls into view and reveals`, async ({ page }) => {
        await page.goto('/portfolio/');
        const mode = await waitForApp(page);
        if (mode !== '3d') { test.skip(); return; }

        // Click the skip-nav button to scroll to the section
        const btn = page.locator(`button[data-section="${id}"]`);
        await expect(btn).toBeAttached({ timeout: 10_000 });
        await btn.evaluate((el: HTMLElement) => el.click());

        // Wait for the section card to become visible (IntersectionObserver fires)
        const card = page.locator(`#${id} .section-card`);
        await expect(card).toBeVisible({ timeout: 8_000 });
        await expect(card).toHaveClass(/section-card--visible/, { timeout: 8_000 });

        await page.screenshot({ path: `e2e/screenshots/section-${id}.png` });
      });
    }
  });

});

// ─── diagnostic ───────────────────────────────────────────────────────────────

test.describe('Diagnostic — console output on page load', () => {
  test('full console dump', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`));

    await page.goto('/portfolio/');
    try {
      await waitForApp(page);
    } catch {
      logs.push('[timeout] Neither canvas nor fallback appeared within 20s');
    }
    await page.waitForTimeout(3_000);
    await page.screenshot({ path: 'e2e/screenshots/diagnostic.png', fullPage: true });

    console.log('\n══ BROWSER CONSOLE ══');
    logs.forEach(l => console.log(l));
    console.log('══ END ══\n');

    expect(true).toBe(true);
  });
});
