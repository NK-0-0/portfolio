import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

// Local-only visual artifacts; namespaced under */local/ and gitignored so they
// never overwrite the prod suite's tracked e2e/screenshots/*.png.
const SHOTS = 'e2e/screenshots/local';

// ─── helpers (adapted from portfolio.spec.ts; the prod suite skips its
// scroll-nav tests when WebGL is unavailable, but a local desktop chromium
// build reliably renders 3D — so here we require '3d' and fail loud, since a
// silent fallback would mask exactly the broken-build regressions this suite
// exists to catch) ──────────────────────────────────────────────────────────

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

  const canvas = page.locator('ngt-canvas canvas').first();
  const fallback = page.locator('app-fallback');

  return Promise.race([
    canvas.waitFor({ state: 'visible', timeout: 20_000 }).then(() => '3d' as const),
    fallback.waitFor({ state: 'visible', timeout: 20_000 }).then(() => 'fallback' as const),
  ]);
}

// ─── smoke tests (local production build) ─────────────────────────────────────

test.describe('Local production build — pre-deploy smoke', () => {
  test('page loads in 3D mode with zero console errors', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/');
    const mode = await waitForApp(page);

    await page.screenshot({ path: `${SHOTS}/landing.png` });

    const realErrors = errors.filter((e) => !e.toLowerCase().includes('favicon'));
    expect(realErrors, `unexpected console errors:\n${realErrors.join('\n')}`).toHaveLength(0);
    expect(mode).toBe('3d');
  });

  test('hero section is visible on load', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    const hero = page.locator('.section--hero');
    await expect(hero).toBeVisible({ timeout: 10_000 });
    await expect(hero.locator('.scroll-cue')).toBeVisible();
  });

  test('footer renders the post-Milestone-1 copyright copy', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    const footer = page.locator('app-footer footer');
    await expect(footer).toBeVisible({ timeout: 10_000 });
    await expect(footer).toContainText('All rights reserved');
    await expect(footer).toContainText(String(new Date().getFullYear()));
  });

  test('no leftover fan-IP / old-theme references render in the DOM', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    const html = (await page.content()).toLowerCase();
    for (const term of ['kakashi', 'naruto', 'sharingan']) {
      expect(html, `stale old-theme reference "${term}" leaked into rendered DOM`).not.toContain(
        term,
      );
    }
  });

  // ─── Scroll navigation via accessible skip-nav ──────────────────────────────
  // The accessible skip-nav (button[data-section="*"]) smooth-scrolls to each
  // section so tests don't have to drive Lenis/GSAP scroll manually. The card
  // reveal is a GSAP entrance (opacity 0 → 1, x/rotateY reset) that fires when
  // the section enters the viewport — there is NO `.section-card--visible` class
  // in the codebase, so "revealed" is asserted via the card's computed opacity
  // reaching ~1 (its pre-reveal state is opacity:0). See task-report deviation.

  const sections = ['about', 'experience', 'skills', 'projects', 'contact'] as const;

  for (const id of sections) {
    test(`"${id}" section is reachable via skip-nav and reveals`, async ({ page }) => {
      await page.goto('/');
      const mode = await waitForApp(page);
      expect(mode).toBe('3d');

      const btn = page.locator(`button[data-section="${id}"]`);
      await expect(btn).toBeAttached({ timeout: 10_000 });
      await btn.evaluate((el: HTMLElement) => el.click());

      const card = page.locator(`#${id} .section-card`);
      await expect(card).toBeVisible({ timeout: 8_000 });
      await expect
        .poll(
          async () => Number(await card.evaluate((el) => getComputedStyle(el).opacity)),
          { timeout: 8_000, message: `${id} card never revealed (opacity stayed near 0)` },
        )
        .toBeGreaterThan(0.9);

      await page.screenshot({ path: `${SHOTS}/section-${id}.png` });
    });
  }
});
