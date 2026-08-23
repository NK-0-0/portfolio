# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Project Is

An Angular 21 static portfolio deployed to GitHub Pages, presented as a **side-scrolling pixel-art
world**. The visitor walks an avatar east across a 3260px-wide world; the walk position drives
everything else — which content panel is open, the time of day, the progress bar, the HUD.

There is no scrolling page and no 3D. A single `<canvas>` renders the world; a DOM overlay renders
the content on top of it.

**Origin:** ported in August 2026 from a Claude design-canvas prototype (the `claude design/`
directory at the repo root, kept as the reference original). The prototype's renderer was framework-
agnostic vanilla canvas code and was lifted essentially verbatim; its UI layer — inline styles,
`style-hover` attributes, and a render loop that mutated panels via `document.querySelectorAll` —
was rewritten as Angular components. **The previous Three.js/GSAP/Lenis scroll portfolio was
deleted**, not refactored; `angular-three`, `three`, `gsap`, `lenis` and `ngxtension` are gone from
`package.json`. Do not reintroduce them or any code from that era.

---

## Architecture

Three layers, and the boundary between them is the point of the whole design:

```
WorldRenderer          plain TypeScript class. Simulation + canvas painting.
  (world-renderer.ts)  Knows nothing about Angular or the DOM beyond one canvas.

WorldStateService      signals. The ONLY channel between the world and the UI.
  (world-state.ts)     Renderer pushes a snapshot per frame; UI reads signals.

ui/ components         panels, HUD, project overlay. Read signals, never the renderer.
```

**Never let the renderer touch the overlay.** The original design's biggest maintenance problem was
a render loop that reached out and set `.style.opacity` on panels sixty times a second. If you need
the world to affect the DOM, add a field to `WorldSnapshot` and let a component bind to it.

### Rendering model

Two-stage, and this is what makes the pixels crisp: everything draws 1:1 into a small offscreen
buffer (`iw × ih`, roughly viewport ÷ `px`), which is then blitted up to the visible canvas with
`imageSmoothingEnabled = false`. Per-frame fill cost is therefore independent of display resolution
— a 4K screen costs the same as a 1080p one.

`px` comes from the **tighter viewport axis** (`min(w/320, h/200)`), not height alone — height alone
leaves a tall narrow phone at desktop scale, showing ~3% of the world. The buffer is allocated once
at `minPx` (the widest zoom fast travel can reach), so zooming only changes how much of it is drawn
and blitted. **Never reallocate the canvas per frame.**

### Responsive composition

Portrait (`h/w > 1.3`) shifts three values in `resize()`: `groundY`, `horizonY` and `cameraBias`.
Everything in the sky is expressed relative to `horizonY`, so the sun arc and cloud band follow
automatically and landscape output stays bit-identical. If you add scenery with a hardcoded
`ih * <fraction>` for a vertical position, express it against `horizonY` or `groundY` instead.

Below 720px CSS width, panels dock as bottom sheets (`--sheet-max`). The ground line is deliberately
placed to clear them — if you change one, check the other.

### Fast travel

`travelTo()` picks a speed to land the trip in `TRAVEL_FRAMES`, floored at run speed. `zoomTick()`
widens the view based on actual `|vx|`, not trip distance, so it engages only when the avatar is
genuinely outrunning legibility and eases off on arrival by itself. Ordinary walking never zooms.

### Change detection

The app is **zoneless** (`provideZonelessChangeDetection`). The rAF loop calls
`WorldStateService.sync()` every frame, but signals skip equal writes, so a frame where nothing
changed costs nothing. Only `phase` and the prompt position update continuously while walking.

Panel fades are **CSS transitions on an `.is-open` class**, not per-frame JS lerps. Keep it that way
— the original animated opacity in JavaScript at 60fps and it bought nothing.

---

## Build & Dev Commands

```bash
npm install
npm start                                   # dev server, localhost:4200
npm run build                               # production build
npm run typecheck                           # tsc --noEmit
npm run lint
npx ng test --no-watch                      # Vitest, single run
npm run e2e:local                           # Playwright against a local prod build
npm run perf:fps                            # frame-timing regression gate
npm run lighthouse                          # production build + Lighthouse CI
```

`@lhci/cli` is a pinned devDependency, so `npx lhci` resolves to the local binary — historically
this project used a bare `npx lhci`, which fetches an unrelated squatted package that silently
no-ops. Never run it from outside `portfolio/`. Chrome flags live in `lighthouserc.json`; a machine
with no system Chrome also needs `CHROME_PATH` (see `docs/agent-notes/angular-dev.md`).

---

## Project Structure

```
src/app/
  world/
    sprites.ts             pixel art as character maps + PAL colour keys. THE art files.
    palette.ts             day/dusk/night grading; mix, hash, clamp helpers
    world.model.ts         CH chapter list, WORLD width, AUDIENCE, WorldSnapshot
    world-renderer.ts      the engine: simulation + ~20 canvas draw methods
    world-state.service.ts signals bridging renderer -> UI, and commands back
    pixel-world.component.ts  canvas host: rAF loop, keyboard/wheel/pointer input
  content/
    portfolio.content.ts   EVERY word and link on the site
  ui/
    hud/                   identity chip, clock, chapter nav, legend, prompt, progress
    panels/                one component per chapter (hill, works, toolbelt, trail,
                           jetty, campfire)
    project-detail/        the case-study overlay
  app.ts                   root layout: canvas underneath, overlay on top

claude design/             the original prototype, kept as reference. NOT built or shipped.
```

---

## Core Conventions

- **Standalone components only.** No NgModules.
- **Signals for all reactive state.** `signal()`, `computed()`, `effect()`. No RxJS for UI state.
- **`inject()`** for DI, not constructor injection.
- **`@if` / `@for`** control flow. No `*ngIf` / `*ngFor`.
- **SCSS, no inline styles in templates.** Shared tokens and the `.panel` / `.chip` / `.btn`
  surface language live in `src/styles.scss`; component-specific rules stay in the component.
- **No `any`.** Use `unknown` with type guards at boundaries.
- Comments explain *why*, not *what* — a hidden constraint, a subtle invariant, a workaround.

### Content changes go in `content/portfolio.content.ts`

Nothing under `ui/` hardcodes copy. If you are editing a string inside a template, you are almost
certainly in the wrong file.

### Adding or moving a chapter

Chapter order is load-bearing in three places that must stay in sync:

1. `CH` in `world/world.model.ts` — position, label, pose, interaction radius
2. The panel components in `ui/panels/`, selected by index in `app.ts`
3. `world-renderer.ts` — the landmark actually drawn at that X (`stage()`, `bench()`, `jetty()`…)

`world.model.spec.ts` guards ordering, bounds, pose validity, and non-overlapping radii.

### Editing the art

Sprites are arrays of equal-length strings; each character is a key into `PAL`, `.` is transparent.
Change a character, change the world. Rows must stay rectangular — there is a spec that enforces it.

---

## SSR / prerender guard — always required

`angular.json` sets `outputMode: "static"`, which still **prerenders in Node at build time**. Any
code touching `window`, `document`, or `canvas` must be deferred to `afterNextRender`, as
`PixelWorldComponent` does. Forgetting this breaks the build, not just the runtime.

---

## Testing

**Vitest** (`ng test`), specs co-located as `*.spec.ts`. No `fakeAsync`/`flush` — the app is
zoneless. Canvas is mocked via `vitest-canvas-mock` in `src/test-setup.ts`.

Test the *logic*, not the painting. There is no value in asserting pixel output; there is value in
asserting that `activePanel` opens the right panel, that the palette is continuous across the dusk
keyframe, and that no two chapters have overlapping interaction radii.

**E2E:** `e2e/local-build.spec.ts` builds and serves the current tree
(`playwright.config.local.ts`) and asserts on the DOM overlay plus one canvas pixel sample.
`e2e/portfolio.spec.ts` — if reinstated — runs against the deployed site.

Note: the avatar physically **travels** to a HUD destination rather than cutting to it. Trips are
capped at ~4.5s, but E2E timeouts are still sized generously for the walk.

The `narrow viewport` describe block in `e2e/local-build.spec.ts` uses `test.use({ viewport })` to
cover the mobile layout in the same run. Add mobile coverage there rather than as a Playwright
project, so the desktop tests don't get run at phone size.

---

## What NOT to Do

- Do not reintroduce Three.js, `angular-three`, GSAP, Lenis, or scroll-driven layout.
- Do not re-enable SSR. Static-only for GitHub Pages is intentional.
- Do not let `WorldRenderer` query or mutate DOM outside its own canvas.
- Do not animate panel opacity from the render loop — use the `.is-open` class.
- Do not hardcode copy in templates.
- Do not commit a locally-captured `e2e/perf/baseline.json`; this sandbox and CI both software-
  render, and a bad baseline makes the gate dead. Let CI establish it.

---

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` on push to `main`:
`npm ci` → `ng build --configuration production --base-href /portfolio/` →
upload `portfolio/dist/portfolio/browser`.

Live at `https://nk-0-0.github.io/portfolio/`.

Production bundle is ~190 kB raw / ~55 kB transferred. The budget in `angular.json` is 300 kB
warning / 500 kB error — if you are approaching that, something has gone wrong.
