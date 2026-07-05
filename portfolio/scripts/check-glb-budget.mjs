#!/usr/bin/env node
// GLB size-budget gate (Milestone 0.5/0.7, enforces ASSET_PIPELINE.md's per-file budget).
// Fails CI if any committed public/models/**/*.glb exceeds the per-file budget.
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODELS_DIR = join(ROOT, 'public', 'models');
const PER_FILE_BUDGET = 3 * 1024 * 1024; // 3 MB — ASSET_PIPELINE.md "File Size Budget"

// Known-legacy files exempted until their scheduled removal. Remove an entry
// here the moment its asset is deleted, so the gate stays honest.
//   kakashi.glb — orphaned Kakashi model (unreferenced by the live scene graph),
//                 removed with the rest of the fan-IP assets in Milestone 1.1.
const EXCEPTIONS = new Set(['public/models/kakashi/kakashi.glb']);

function walkGlbs(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkGlbs(full));
    else if (entry.isFile() && entry.name.endsWith('.glb')) out.push(full);
  }
  return out;
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
const files = walkGlbs(MODELS_DIR).sort();
const offenders = [];

console.log(`GLB budget check — ${mb(PER_FILE_BUDGET)} MB per file\n`);
for (const file of files) {
  const rel = relative(ROOT, file);
  const size = statSync(file).size;
  const exempt = EXCEPTIONS.has(rel);
  const over = size > PER_FILE_BUDGET;
  const status = exempt ? 'EXEMPT' : over ? 'OVER' : 'ok';
  console.log(`  ${status.padEnd(6)} ${mb(size).padStart(7)} MB  ${rel}`);
  if (over && !exempt) offenders.push({ rel, size });
}

if (offenders.length > 0) {
  console.error(`\n✖ ${offenders.length} GLB(s) exceed the ${mb(PER_FILE_BUDGET)} MB budget.`);
  console.error('  Optimize with `npm run optimize:models -- <in>.glb <out>.glb` (see docs/development/ASSET_PIPELINE.md).');
  process.exit(1);
}

console.log('\n✔ All committed GLBs are within budget.');
