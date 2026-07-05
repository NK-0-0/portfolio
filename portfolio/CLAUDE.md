# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What This Project Is

An Angular 21 static, scroll-driven 3D portfolio deployed to GitHub Pages. Lenis (smooth scroll) + GSAP ScrollTrigger drive a single continuous page (`ScrollLayoutComponent`) through six sections (hero, about, experience, skills, projects, contact). A fixed WebGL canvas sits behind the scrollable content; as the user scrolls, `ScrollStateService.activeSection` updates and every 3D component (mask position/scale/opacity, floating book/kunai props, moonlight/rim light color, fog color, camera Y, fixed background hue) lerps to new per-section target values read from that one signal. On mobile or when WebGL is unavailable, `DeviceCapabilityService` switches the root to a 2D `FallbackComponent` instead.

**Docs status (updated 2026-07-05):** `docs/vision/VISION.md` and `docs/architecture/ARCHITECTURE.md` have been rewritten to match the current scroll-driven architecture described below, and now also describe the planned rebrand away from the Kakashi/Naruto fan-IP theme toward an original "Signal Ghost" sci-fi identity (see `docs/vision/VISION.md`, and `docs/vision/REQUIREMENTS.md` for that brief turned into testable FR/NFR acceptance criteria). The old hover/hotspot/`SectionStore` design they used to describe is archived at `docs/archive/LEGACY_VISION.md` / `LEGACY_ARCHITECTURE.md` for historical record — do not implement anything from those. `docs/development/AGENTS.md`, `docs/architecture/SKILLS_REFERENCE.md`, `docs/development/ASSET_PIPELINE.md`, and `docs/development/DEVELOPMENT.md` have now all been corrected for the staleness `docs/ROADMAP.md` Milestone 0 flagged (and some it didn't — see `docs/vision/REQUIREMENTS.md`'s feasibility log). `docs/ROADMAP.md` holds the full stall diagnosis plus the milestone/issue plan for the rework; read it for "why" and "what's next." This file remains the terse day-to-day source of truth and takes precedence if anything ever drifts again.

**Rebrand in flight — the theme is changing, the architecture is not.** The live scene graph and asset filenames described below (Kakashi mask, Icha Icha book, kunai) are still what's actually running today; they are being replaced per `docs/vision/VISION.md` and `docs/ROADMAP.md` Milestones 1–3 with original, non-IP assets and a new palette/typography. Don't be surprised if this section reads as already-outdated soon — check `docs/ROADMAP.md` for current milestone status before assuming which asset set is live.

As a result of that pivot, the old hover/hotspot-era files were **deleted** from `src/` in Milestone 0.2 — the original `three/kakashi/` model, `three/post-processing/` (OutlinePass/Bloom), `core/services/section-store.ts` (`SectionStore`), `ui/panel/` (sliding panel), and `ui/hint/` ("Hover Kakashi to explore"). They are gone, not merely orphaned; do not reintroduce them.

The live 3D scene graph (`scene-graph.component.ts`) is: `SceneController` (fog + camera) → `Lighting` → `Mask` → `FloatingModels` (book + kunai) → `Particles`. The live content layer is `ScrollLayoutComponent`, which renders the six `<section>`s directly (not through `PanelComponent`).

---

## Build & Dev Commands

```bash
# Install
npm install

# Dev server (HMR, localhost:4200)
npm start

# Production build (static output — no SSR, base href unset)
ng build --configuration production

# Production build with the GitHub Pages base href (what CI actually runs)
ng build --configuration production --base-href /portfolio/

# Unit tests (Vitest, watch mode)
npm test

# Single/CI test run (this build's Vitest unit-test builder has no `--run` flag;
# watch also defaults to false in non-TTY/CI environments)
ng test --no-watch

# E2E (Playwright) — NOTE: playwright.config.ts baseURL is the *live* production
# site (https://nk-0-0.github.io), not localhost. These are post-deploy smoke
# tests, not a local dev-loop tool.
npx playwright test

# Lighthouse CI (against a local production build)
ng build --configuration production
npx lhci autorun
```

Lint is `npm run lint` (`ng lint`, angular-eslint flat config in `eslint.config.js`) — added in Milestone 0.7 and run in CI (`.github/workflows/ci.yml`). Formatting is Prettier (`.prettierrc`: single quotes, 100 print width).

---

## Project Structure (key paths)

```
src/app/
  core/
    services/
      scroll-state.service.ts      # ActiveSection (0-5) + scrollProgress — the single
                                    # source of truth every 3D component reads
      device-capability.ts         # WebGL + mobile detection -> 2D fallback switch
      model-loading.service.ts     # Tracks GLB load count across mask/floating-models
    models/
      section.types.ts             # SectionId, Section, SECTIONS (used for nav labels)
  three/
    scene/
      scene.component.ts           # Outer shell: fixed canvas + ScrollLayout + loader + footer
      scene-graph.component.ts     # What's rendered inside NgtCanvas, and in what order
      scene-controller.component.ts # Per-section fog color + camera Y lerp
    mask/                          # ANBU mask — primary 3D focal element, repositions per section
    floating-models/               # Icha Icha book (Experience) + kunai (Skills/Projects)
    environment/
      lighting.component.ts        # Moonlight + rim directional lights, color-lerped per section
      particles.component.ts       # Ambient dust
  ui/
    scroll-layout/                 # THE page: Lenis + GSAP ScrollTrigger, all 6 sections,
                                    # parallax kanji/labels/hue tween, sets ScrollStateService
    sections/                     # about/, experience/, skills/, projects/, contact/ content
    fallback/                      # 2D layout for mobile / no-WebGL
    loader/                        # Loading screen while GLBs fetch
    footer/                        # Fixed attribution footer (Kakashi IP notice)
  app.ts                           # Root: @defer-switches between <app-scene> and <app-fallback>

public/
  models/
    kakashi/kakashi.glb            # unused by the live scene graph; slated for removal in Milestone 1.1
    mask/anbu_kakashi_mask.glb
    book/icha_icha.glb
    kunai/kunai_do_minato_namikaze.glb

docs/                              # corrected 2026-07-05 (see opening paragraph + docs/README.md)
```

---

## Core Conventions

- **Standalone components only.** No NgModules anywhere.
- **Signals for all reactive state.** Use `signal()`, `computed()`, `effect()`. No RxJS Subjects for UI state — RxJS only at HTTP/async boundaries.
- **`inject()` function** for DI. No constructor injection.
- **`@if` / `@for` control flow** blocks. No `*ngIf` / `*ngFor`.
- **SCSS** for all styles. No inline styles in templates.
- **No `any` in TypeScript.** Use `unknown` with type guards at boundaries.
- No comments unless the *why* is non-obvious (hidden constraint, subtle invariant, external bug workaround).
- Per-section tunable values (colors, positions, camera targets) are plain arrays indexed by `ActiveSection` (0-5), defined as module-level constants at the top of the component that uses them — follow this pattern rather than introducing a config service.

---

## 3D-Specific Rules

### WebGL / SSR guard — ALWAYS required
Any code that touches `window`, `document`, `navigator`, `WebGLRenderingContext`, or Three.js objects must be guarded:

```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
```

Angular's build still runs in a Node context for prerendering even though the project outputs static files only (`outputMode: "static"` in `angular.json`). Forgetting this guard causes build failures. Existing components also gate their `@if` templates and `injectBeforeRender` callbacks on `isBrowser`/`isPlatformBrowser` — follow that pattern for new 3D components.

### angular-three (NGT) — correct package name
```bash
npm install angular-three        # NOT @angular-three/core (outdated/wrong package)
npm install -D angular-three-plugin
```
Key imports used in this codebase: `NgtCanvas` (from `angular-three/dom`), `NgtArgs`, `injectLoader`, `injectBeforeRender`, `injectStore` (from `angular-three`).

**Deprecation note (verified against the installed `angular-three@4.2.2` type definitions, 2026-07-05):** `injectLoader` and `injectBeforeRender` are marked `@deprecated` in this version — superseded by `loaderResource()` and `beforeRender()`, scheduled for removal in v5. They still work today; `injectStore` is unaffected. Don't add *new* components against the deprecated names — see `docs/vision/REQUIREMENTS.md` NFR-8 and `docs/ROADMAP.md` Milestone 3, issue 3.5 (migrating the existing ones is scheduled there, not urgent).

### Per-frame animation pattern
Every animated 3D component follows the same shape: load the GLB with `injectLoader(() => GLTFLoader, () => 'models/.../file.glb')`, keep interpolated transform values as plain (non-signal) instance fields, and mutate the `Object3D` directly inside a single `injectBeforeRender(({ delta }) => { ... })` callback using `current += (target - current) * Math.min(delta * k, 1)` lerps keyed off `ScrollStateService.activeSection()`. See `mask.component.ts` and `floating-models.component.ts` for the canonical example before adding a new animated prop.

### Model loading gate
`ModelLoadingService` counts a hardcoded `TOTAL_ASSETS` (currently 3: mask + book + kunai) and has a 20s timeout fallback. If you add or remove a loaded GLB from the live scene graph, update `TOTAL_ASSETS` in `model-loading.service.ts` or the loader will hang or dismiss early.

---

## Testing

This project uses **Vitest** (Angular 21 default — no Karma/Jasmine). Tests run with `ng test`.

### Conventions
- Test files: `*.spec.ts` co-located with the source file
- No `fakeAsync` / `flush` — not supported in Vitest (Angular 21 is zoneless)
- Use `@angular/core/testing` `TestBed` + `ComponentFixture` as normal

### Three.js in tests
WebGL is mocked via `vitest-canvas-mock`, imported once in `src/test-setup.ts`. (Not `jest-webgl-canvas-mock` — this project does not use Jest anywhere.)

Don't test NGT rendering output — test the *behaviour* (e.g. that a service signal updates correctly). Not every component has a spec file today (e.g. `experience`, `skills`, `projects` sections don't) — follow the pattern of the sibling components that do (`about`, `contact`) if adding coverage.

### E2E (Playwright)
`e2e/portfolio.spec.ts` runs against the **deployed production site** (`baseURL` in `playwright.config.ts` is `https://nk-0-0.github.io`), asserting on `/portfolio/`. These are post-deploy smoke checks (page loads with no console errors, footer attribution present, hero visible) — not a local development tool.

---

## What NOT to Do

- Do not re-enable SSR. The project is static-only for GitHub Pages. `outputMode: "static"` in `angular.json` is intentional. The old SSR/Node scaffolding (`@angular/ssr`, `@angular/platform-server`, `express`, `@types/express`, the `serve:ssr:portfolio` script) was removed in Milestone 0.6 — do not add it back. Note `@angular/router` is still a dependency: `angular-three` statically imports it (for `NgtRoutedScene`), so the build won't resolve without it even though this app defines no routes.
- Do not place large binaries (GLB, HDR) in `src/assets/` — use `public/` so they bypass the Angular build pipeline.
- Do not exceed the raised bundle budget in `angular.json` (2MB warning / 4MB error). Three.js is lazy-loaded via `@defer` in `app.ts` — keep it that way.
- Do not re-create the deleted hover/hotspot files (`kakashi.component.ts`, `panel.component.ts`, `effects.component.ts`, `section-store.ts`, `hint.component.ts`) — they were removed in Milestone 0.2 and nothing in the live app depends on them.
- Do not add OrbitControls or Leva debug controls to production code paths.

---

## Deployment

GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`, triggered on push to `main` or manual dispatch):
1. `npm ci` in `portfolio/`
2. `ng build --configuration production --base-href /portfolio/`
3. Upload `portfolio/dist/portfolio/browser` as the Pages artifact and deploy

Live at `https://nk-0-0.github.io/portfolio/`. `lighthouserc.json` runs Lighthouse CI against a local production build (`.github/workflows/lighthouse.yml`) with thresholds: performance ≥0.75 (warn), accessibility ≥0.90 (error), best-practices ≥0.85 (warn), SEO ≥0.80 (warn).

---

## IP Notice

The ANBU mask, Icha Icha book, and kunai models are Kakashi Hatake assets © Masashi Kishimoto / Studio Pierrot. This is fan work for a non-commercial portfolio. The footer must include attribution (verified by the Playwright suite). Do not add monetisation, paywalls, or commercial branding.
