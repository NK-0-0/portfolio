# Frame-timing regression gate — baseline lifecycle

`scripts/measure-fps.mjs` (run via `npm run perf:fps`) drives a scripted
scroll-through of all six sections against a local production build, samples
`requestAnimationFrame` deltas in Chromium, and gates the **p95 frame time**
against `baseline.json` with a **15% tolerance** (ROADMAP Milestone 4, issue
4.7 / REQUIREMENTS NFR-9).

## Why no `baseline.json` is committed yet

The baseline is intentionally **not** committed here. Per the owner's decision,
the first CI run on `ubuntu-latest` establishes it:

1. **First run (no `baseline.json`):** the script measures, writes
   `baseline.json`, and passes — its only gate is "the script runs and produces
   a number."
2. **Every later run:** the script compares the new p95 against the committed
   baseline and fails if it regresses by more than 15%.

The baseline must be measured in the environment that will run the gate. GitHub
Actions' `ubuntu-latest` runners have **no GPU**, so Chromium software-renders
via SwiftShader — absolute frame times there are far higher than on a real GPU,
and a baseline captured on a developer's GPU machine (or a software-rendered
sandbox with different CPU) would not be comparable. Capturing it from the first
CI run keeps baseline and later measurements on like-for-like hardware.

**To activate the gate:** take the `baseline.json` produced by the first green
CI run (uploaded as a workflow artifact, or re-run locally on comparable
hardware) and commit it here. From then on the gate is live.

**To re-baseline** after an intentional, accepted perf change: delete
`baseline.json`, let one run re-establish it, and commit the new value.
