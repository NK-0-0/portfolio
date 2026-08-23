# Development Guide

> **Rewritten 2026-08-23.** The previous version documented the Three.js build — GLB pipelines,
> Leva debug controls, raycasting, gltf.report. All of that is gone. See git history if you need it.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 or 24 LTS | Node 24 is Active LTS; Node 22 is Maintenance LTS (EOL Apr 2027). CI uses 22. |
| npm | 11+ | Ships with Node 22 |
| Angular CLI | 21.2+ | `npm install -g @angular/cli`, or just use `npx ng` |

No Blender, no Git LFS, no gltf-transform. The project ships zero binary assets.

## Setup

```bash
git clone https://github.com/nk-0-0/portfolio.git
cd portfolio/portfolio
npm install
npm start        # http://localhost:4200
```

## The dev loop

```bash
npm start                # dev server with HMR
npm run lint             # angular-eslint
npm run typecheck        # tsc --noEmit, catches what the template compiler misses
npx ng test --no-watch   # Vitest, single run
npm test                 # Vitest, watch mode
npm run e2e:local        # builds prod, serves it, runs Playwright against it
npm run perf:fps         # frame-timing gate
```

Before opening a PR, `npm run lint && npm run typecheck && npx ng test --no-watch` mirrors what CI
checks first.

## Where things live

See [`CLAUDE.md`](../../CLAUDE.md) for the full map. The short version:

- Changing **copy, links, projects, skills** → `src/app/content/portfolio.content.ts`
- Changing **the art** → `src/app/world/sprites.ts` (character maps) and `world/palette.ts` (colours)
- Changing **world layout** → `src/app/world/world.model.ts` (`CH`, `WORLD`)
- Changing **how the world is drawn** → `src/app/world/world-renderer.ts`
- Changing **the overlay** → `src/app/ui/**`
- Changing **shared visual tokens** → `src/styles.scss`

## Debugging the world

The renderer is a plain class, so the fastest way in is a breakpoint in `step()` or the specific
draw method. There is no scene graph to inspect and no dev-only debug UI.

Useful knobs, both `input()`s on `PixelWorldComponent`:

- `pixelSize` — force a pixel scale (2–8). `0` derives one from viewport height. Set it high to see
  the raster clearly, low to check detail work.
- `walkSpeed` — multiplier on walk speed. Raise it to reach a far chapter quickly while iterating.

To inspect the offscreen buffer directly, break inside `paint()` and read `this.off` — it is a real
`<canvas>` at the buffer's native size, before the upscale blit.

**If nothing renders:** check that `afterNextRender` actually fired. Anything touching `window` or
the canvas outside it silently no-ops during prerender and can look like a runtime failure.

**If panels don't open:** the world publishes to `WorldStateService` once per frame. Log
`state.activePanel()` — if it moves but the DOM doesn't, the problem is a binding, not the sim.

## Performance

The whole offscreen buffer is repainted every frame — there is no dirty-rect optimisation, by
design. Cost scales with buffer area (`iw × ih`), which is viewport ÷ `pixelSize`, so it is
independent of display resolution.

`npm run perf:fps` walks the avatar across the full world and gates p95 frame time against
`e2e/perf/baseline.json` with a 15% tolerance. If no baseline exists, the first run writes one and
passes.

**Do not commit a locally captured baseline.** This sandbox and GitHub's `ubuntu-latest` both lack
a GPU. Let CI establish the baseline in the environment that will run the gate.

Lighthouse thresholds (`lighthouserc.json`): accessibility ≥ 0.95 and best-practices ≥ 0.95 are
hard errors; performance ≥ 0.90 and SEO ≥ 0.90 are warnings. The current build scores 100 on all
four.

## Common issues

**Build fails with `window is not defined` / `document is not defined`**
Something browser-only ran during prerender. Move it into `afterNextRender`.

**`npx lhci autorun` does nothing**
That resolves to an unrelated squatted package. Always use `npx @lhci/cli autorun`.

**Lighthouse says "Chrome installation not found"**
No system Chrome. Point it at the Playwright-bundled binary — see
[`../agent-notes/angular-dev.md`](../agent-notes/angular-dev.md).

**WebKit won't launch locally**
Missing system libraries that need `sudo apt` / `playwright install --with-deps`. Run
`--project=chromium --project=firefox` locally; CI covers WebKit.

**E2E tests time out around 15s**
The avatar physically walks to HUD destinations — hill to campfire is ~19 seconds. Size timeouts for
the walk, or pick a nearer chapter.

**Sprite renders with ragged edges or shifted rows**
Sprite rows must all be the same length. `world.model.spec.ts` catches this.
