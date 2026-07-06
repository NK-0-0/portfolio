#!/usr/bin/env node
// GLB size-budget gate (Milestone 0.5/0.7, enforces ASSET_PIPELINE.md's per-file budget).
// Fails CI if any committed public/models/**/*.glb exceeds the per-file budget.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MODELS_DIR = join(ROOT, 'public', 'models');
const PER_FILE_BUDGET = 3 * 1024 * 1024; // 3 MB — ASSET_PIPELINE.md "File Size Budget"

// No exemptions: the live scene graph is fully procedural (zero GLBs) as of
// Milestone 1.1, which deleted the last legacy fan-IP models. Any GLB that
// lands here now is a new original asset and must meet the budget on its own.

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

console.log(`GLB budget check — ${mb(PER_FILE_BUDGET)} MB per file\n`);

if (!existsSync(MODELS_DIR)) {
  console.log('  no public/models directory — scene graph is fully procedural, nothing to check.');
  console.log('\n✔ All committed GLBs are within budget.');
  process.exit(0);
}

const files = walkGlbs(MODELS_DIR).sort();
const offenders = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  const size = statSync(file).size;
  const over = size > PER_FILE_BUDGET;
  const status = over ? 'OVER' : 'ok';
  console.log(`  ${status.padEnd(6)} ${mb(size).padStart(7)} MB  ${rel}`);
  if (over) offenders.push({ rel, size });
}

if (offenders.length > 0) {
  console.error(`\n✖ ${offenders.length} GLB(s) exceed the ${mb(PER_FILE_BUDGET)} MB budget.`);
  console.error('  Optimize with `npm run optimize:models -- <in>.glb <out>.glb` (see docs/development/ASSET_PIPELINE.md).');
  process.exit(1);
}

console.log('\n✔ All committed GLBs are within budget.');
