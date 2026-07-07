#!/usr/bin/env node
// Frame-timing regression gate (ROADMAP Milestone 4, issue 4.7 / REQUIREMENTS NFR-9).
//
// Drives a scripted scroll-through of all six sections of a local production
// build, samples requestAnimationFrame deltas, and gates the p95 frame time
// against a committed baseline (e2e/perf/baseline.json) with a 15% tolerance.
//
// First run (no baseline): writes the baseline and passes — establishing "the
// script runs and produces a number," per the owner's decision. Every later run
// compares against that committed baseline and fails if p95 regresses > 15%.
//
// Metric choice — p95 frame time (ms), lower is better:
//   Mean hides jank. A scene that holds 60fps but hitches on each scroll
//   transition has a fine mean but a bad p95, and it's the hitch a recruiter
//   feels — not the average. p95 is the standard "worst-frame-that-matters"
//   percentile (it discards the top ~5% one-off GC/layout spikes that would
//   make a max-based gate flaky). Mean is recorded too, for context, but the
//   gate is p95 only.
//
// Single-engine on purpose: perf is measured in Chromium only. Gating three
// engines with different frame budgets against one baseline would be noise;
// the cross-browser matrix (correctness) lives in the Playwright smoke suite.
//
// Server: builds are done by the `perf:fps` npm script; this script serves the
// already-built dist itself (spawns http-server), unless PERF_BASE_URL points
// at an already-running server.

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'portfolio', 'browser');
const BASELINE = join(ROOT, 'e2e', 'perf', 'baseline.json');

const TOLERANCE = 0.15; // 15% p95 regression budget (owner decision)
const PORT = 4174; // distinct from the smoke suite's 4173 so both can coexist
const SECTIONS = ['about', 'experience', 'skills', 'projects', 'contact'];
const DWELL_MS = 1200; // per-section: covers the Lenis scroll + GSAP reveal
const SETTLE_MS = 800; // let the scene finish its load-time work before sampling

const p95 = (xs) => [...xs].sort((a, b) => a - b)[Math.ceil(0.95 * xs.length) - 1];
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const r2 = (n) => Math.round(n * 100) / 100;

async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function measure(baseUrl) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    // Self-perpetuating rAF collector, installed before any app code runs.
    await page.addInitScript(() => {
      window.__frameTimes = [];
      let last = performance.now();
      requestAnimationFrame(function tick(now) {
        window.__frameTimes.push(now - last);
        last = now;
        requestAnimationFrame(tick);
      });
    });

    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('ngt-canvas canvas').first().waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForTimeout(SETTLE_MS);

    // Discard load-time frames — measure only the scroll-through motion.
    await page.evaluate(() => {
      window.__frameTimes.length = 0;
    });

    for (const id of SECTIONS) {
      await page.locator(`button[data-section="${id}"]`).evaluate((el) => el.click());
      await page.waitForTimeout(DWELL_MS);
    }

    const frames = await page.evaluate(() => window.__frameTimes);
    if (!Array.isArray(frames) || frames.length < 30) {
      throw new Error(`too few frame samples (${frames?.length ?? 0}) — measurement is unreliable`);
    }
    return frames;
  } finally {
    await browser.close();
  }
}

function readBaseline() {
  if (!existsSync(BASELINE)) return null;
  return JSON.parse(readFileSync(BASELINE, 'utf8'));
}

function writeBaseline(result) {
  mkdirSync(dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, JSON.stringify(result, null, 2) + '\n');
}

async function main() {
  const external = process.env['PERF_BASE_URL'];
  let server;
  let baseUrl = external;

  if (!external) {
    if (!existsSync(DIST)) {
      console.error(`✖ no production build at ${DIST} — run \`ng build --configuration production\` first`);
      console.error('  (or use the `npm run perf:fps` wrapper, which builds first).');
      process.exit(1);
    }
    baseUrl = `http://localhost:${PORT}`;
    server = spawn('npx', ['http-server', DIST, '-p', String(PORT), '-s', '-c-1'], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    await waitForServer(baseUrl);
  }

  let frames;
  try {
    frames = await measure(baseUrl);
  } finally {
    if (server) server.kill();
  }

  const result = {
    metric: 'frameTimeMs',
    gate: 'p95',
    tolerance: TOLERANCE,
    recordedAt: new Date().toISOString(),
    samples: frames.length,
    p95: r2(p95(frames)),
    mean: r2(mean(frames)),
  };

  console.log('\nFrame-timing measurement (Chromium, scripted 6-section scroll-through)');
  console.log(`  samples : ${result.samples}`);
  console.log(`  mean    : ${result.mean} ms  (~${r2(1000 / result.mean)} fps)`);
  console.log(`  p95     : ${result.p95} ms  (~${r2(1000 / result.p95)} fps)`);

  const baseline = readBaseline();
  if (!baseline) {
    writeBaseline(result);
    console.log(`\n✔ No baseline present — wrote ${BASELINE}. First run establishes the budget; passing.`);
    return;
  }

  const budget = baseline.p95 * (1 + TOLERANCE);
  const regressionPct = r2(((result.p95 - baseline.p95) / baseline.p95) * 100);
  console.log(`\n  baseline p95 : ${baseline.p95} ms   budget (+${TOLERANCE * 100}%) : ${r2(budget)} ms`);
  console.log(`  change       : ${regressionPct >= 0 ? '+' : ''}${regressionPct}%`);

  if (result.p95 > budget) {
    console.error(`\n✖ FPS regression: p95 ${result.p95} ms exceeds the ${r2(budget)} ms budget (>${TOLERANCE * 100}% over baseline).`);
    console.error('  If this is an intentional, accepted cost, delete e2e/perf/baseline.json to re-baseline.');
    process.exit(1);
  }

  console.log('\n✔ Within the frame-timing budget.');
}

main().catch((err) => {
  console.error('✖ measure-fps failed:', err?.message ?? err);
  process.exit(1);
});
