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

test.describe('Kakashi Portfolio — live site smoke tests', () => {

  test('page loads without JS errors and renders something visible', async ({ page }) => {
    const errors = collectErrors(page);

    await page.goto('/portfolio/');
    const mode = await waitForApp(page);

    await page.screenshot({ path: 'e2e/screenshots/landing.png' });

    console.log(`Rendering mode: ${mode}`);
    console.log(`JS errors: ${errors.length ? errors.join('\n') : 'none'}`);

    // Ignore favicon 404 — it is present in the repo but may be cached differently
    const realErrors = errors.filter(e => !e.toLowerCase().includes('favicon'));
    expect(realErrors).toHaveLength(0);
    expect(['3d', 'fallback']).toContain(mode);
  });

  test('copyright footer is visible', async ({ page }) => {
    await page.goto('/portfolio/');
    await waitForApp(page);

    // Use the inner <footer> element — the host custom element has no layout
    // height of its own (its only child is position:fixed), which makes some
    // visibility checks false-positive. The <footer> element itself is always
    // in the viewport via position:fixed.
    const footer = page.locator('app-footer footer');
    await expect(footer).toBeVisible({ timeout: 10_000 });
    await expect(footer).toContainText('Masashi Kishimoto');
    await expect(footer).toContainText('Studio Pierrot');
  });

  test('hint overlay is visible before any interaction', async ({ page }) => {
    await page.goto('/portfolio/');
    await waitForApp(page);

    const hint = page.locator('app-hint .idle');
    await expect(hint).toBeVisible({ timeout: 10_000 });
    await expect(hint).toContainText('Hover');
  });

  test('3D canvas has non-zero dimensions', async ({ page }) => {
    await page.goto('/portfolio/');
    const mode = await waitForApp(page);

    if (mode !== '3d') {
      test.skip();
      return;
    }

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

  // ─── Panel navigation ────────────────────────────────────────────────────
  // Uses the accessible skip-nav buttons (data-section="*") added to SceneComponent.
  // These are the same buttons keyboard users and screen readers use — they're
  // the correct E2E hook because they exercise the real SectionStore.open() path.

  test.describe('Panel navigation via accessible buttons', () => {
    const sections = [
      { id: 'about',      label: 'About Me'   },
      { id: 'experience', label: 'Experience' },
      { id: 'skills',     label: 'Skills'     },
      { id: 'projects',   label: 'Projects'   },
      { id: 'contact',    label: 'Contact'    },
    ] as const;

    for (const { id, label } of sections) {
      test(`"${label}" panel opens and closes`, async ({ page }) => {
        await page.goto('/portfolio/');
        const mode = await waitForApp(page);
        if (mode !== '3d') { test.skip(); return; }

        // Open the section via the accessible nav button
        const btn = page.locator(`button[data-section="${id}"]`);
        await expect(btn).toBeAttached({ timeout: 10_000 });
        // The skip-nav sits at top:-100px so it's outside the viewport.
        // evaluate().click() triggers the DOM click handler regardless of position.
        await btn.evaluate((el: HTMLElement) => el.click());

        // Panel should slide in
        const panel = page.locator('.panel');
        await expect(panel).toBeVisible({ timeout: 8_000 });

        // The close button should work
        const closeBtn = page.locator('.close-btn').first();
        await closeBtn.click();
        await expect(panel).not.toBeVisible({ timeout: 5_000 });

        await page.screenshot({ path: `e2e/screenshots/panel-${id}.png` });
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
