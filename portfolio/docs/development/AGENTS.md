# AGENTS.md — Cross-Tool AI Assistant Instructions

> **Corrected 2026-07-05.** This file previously described the archived hover/hotspot/click-panel design (`docs/archive/LEGACY_VISION.md` / `LEGACY_ARCHITECTURE.md`) as if it were the live app — it never was updated after the scroll-pivot. That was a real gap: this file is the one non-Claude AI tools (Cursor, Copilot, etc.) actually read, so it was actively misleading anyone using a different assistant. Content below now matches `CLAUDE.md` / `docs/architecture/ARCHITECTURE.md`. If the two ever drift again, `CLAUDE.md` wins.

## What this file is

**AGENTS.md** is an open standard (Linux Foundation, 2025) for giving AI coding assistants project-specific instructions. It is tool-agnostic — Cursor, Copilot, Sourcegraph Cody, Factory, and others all read this file.

**Claude Code** reads `CLAUDE.md` (at the project root) rather than this file. The canonical instructions for this project live there:

```
portfolio/CLAUDE.md                  ← Claude Code reads this automatically
portfolio/docs/development/AGENTS.md ← this file (cross-tool reference + rationale)
```

If you are using a tool that reads `AGENTS.md` from the project root, symlink or copy `CLAUDE.md` → `AGENTS.md`.

---

## What an AI assistant should know before touching this project

### The one-line summary
Angular 21 static SPA. Lenis + GSAP ScrollTrigger drive one continuous scrollable page through six sections; a fixed WebGL canvas behind it lerps a 3D focal prop, two floating props, lighting/fog, and camera position to per-section target values as `ScrollStateService.activeSection` changes. There is no click-to-open-panel navigation and no hover/raycast interaction — scroll position is the only input the 3D scene responds to. Deploys to GitHub Pages. Mid-rebrand to an original "Signal Ghost" sci-fi identity (the earlier third-party fan-art assets were removed in `docs/ROADMAP.md` Milestone 1) — see `docs/vision/VISION.md` and `docs/vision/REQUIREMENTS.md`.

### Non-obvious constraints (read these before writing any code)

1. **No SSR — static prerender only.** `angular.json` has `outputMode: "static"`. GitHub Pages cannot run a Node server. Never re-introduce `server.ts` or the SSR build chain.

2. **WebGL guard is mandatory.** Angular's build runs in Node for prerendering even on static output. Any Three.js / DOM code must be wrapped in `isPlatformBrowser(inject(PLATFORM_ID))` or placed inside lifecycle hooks that only fire in a browser (`afterNextRender`, `effect()` with browser check).

3. **Correct NGT package name.** The package is `angular-three` (currently v4.2.2 in this repo), not `@angular-three/core` (deprecated/wrong package). Install via `npm install angular-three angular-three-plugin`. Note: this codebase's `injectLoader`/`injectBeforeRender` calls are themselves deprecated as of v4.2.2 (superseded by `loaderResource`/`beforeRender`, removed in v5) — they still work today but see `docs/vision/REQUIREMENTS.md` NFR-8 before adding new code against them.

4. **Signals, not RxJS, for UI state.** `ScrollStateService` (`src/app/core/services/scroll-state.service.ts`) is the single source of truth for scroll position (`activeSection`, `scrollProgress`). Do not create parallel reactive state. `SectionStore` (`section-store.ts`) was **deleted** in Milestone 0.2 (part of the archived panel design) — gone, not merely orphaned; do not re-create it, see `docs/ROADMAP.md` Milestone 0.

5. **Large assets go in `public/`**, not `src/assets/`. Files in `public/` are copied as-is to the build output without Angular processing them.

6. **Bundle budget is raised.** `angular.json` allows up to 4MB (Three.js + models). Still lazy-load the Three.js chunk via `@defer` in `app.ts`.

7. **Mobile gets a 2D fallback.** `DeviceCapabilityService` detects mobile/no-WebGL and switches to `<app-fallback>`. Do not attempt 3D on mobile.

8. **No post-processing/bloom.** `VISION.md`'s "What NOT To Do" explicitly forbids resurrecting bloom/hover-raycast — a prior build tried both and they were among the reasons it stalled. The `postprocessing` npm package and `three/post-processing/effects.component.ts` were both deleted in Milestone 0.2 — gone, not merely orphaned; do not wire them back in.

---

## Stack at a Glance

| Concern | Package | Version |
|---------|---------|---------|
| Framework | `@angular/core` | 21.2 |
| 3D renderer | `angular-three` | 4.2.2 (see constraint 3 above — some APIs used in this codebase are deprecated) |
| Three.js peer | `three` | 0.182.x |
| Scroll physics | `lenis` | 1.3.x |
| Scroll-linked tweening | `gsap` (ScrollTrigger) | 3.15.x |
| State | Native Angular signals | built-in |
| Testing | Vitest | 4.x (Angular default) |
| Build | `@angular/build` | 21.2 |
| Deploy | GitHub Actions (`.github/workflows/deploy.yml`) | — |

Full stack reference with code snippets: `docs/architecture/SKILLS_REFERENCE.md`. **Note:** `postprocessing` is listed there for historical/reference purposes only — it is not part of the live build (constraint 8 above).

---

## File Map for Common Tasks

| Task | Where to look |
|------|---------------|
| Change per-section camera/fog/light targets | `src/app/three/scene/scene-controller.component.ts`, `src/app/three/environment/lighting.component.ts` |
| Edit a portfolio section's content | `src/app/ui/sections/<section>/` |
| Adjust the focal 3D prop | `src/app/three/mask/mask.component.ts` (rebrand target: HUD-core, see `docs/vision/VISION.md`) |
| Adjust the two floating props | `src/app/three/floating-models/floating-models.component.ts` |
| Change scroll behavior / Lenis / ScrollTrigger | `src/app/ui/scroll-layout/scroll-layout.component.ts` |
| Modify the mobile 2D fallback | `src/app/ui/fallback/fallback.component.ts` |
| Swap a 3D model | `public/models/<name>/` + update `ModelLoadingService.TOTAL_ASSETS` if the loaded-asset count changes |
| Deploy | Push to `main` → GitHub Actions runs automatically |

---

## Coding Style Rules

- Standalone Angular components only — no NgModules
- `inject()` for DI — no constructor injection
- `@if` / `@for` control flow — no structural directive syntax
- SCSS for styles — no inline styles
- No `any` — use `unknown` + type guards
- No comments unless the *why* is non-obvious
- No Leva / debug helpers in production code

---

## Testing Rules

- Vitest only — no Jasmine, no Karma
- `vitest-canvas-mock` for WebGL surface mocking (imported once in `src/test-setup.ts`) — **not** `jest-webgl-canvas-mock`, this project doesn't use Jest anywhere
- No `fakeAsync` / `flush` — project is zoneless
- Test *behaviour* (signal state changes) not Three.js/NGT render output
- `ng test --run` for CI; `npm test` for dev watch mode

---

## Links

- Vision + section mapping: `docs/vision/VISION.md`
- Functional/non-functional requirements: `docs/vision/REQUIREMENTS.md`
- Architecture decisions: `docs/architecture/ARCHITECTURE.md`
- Tech stack reference: `docs/architecture/SKILLS_REFERENCE.md`
- Stall diagnosis + milestone plan: `docs/ROADMAP.md`
- 3D model sourcing + optimisation: `docs/development/ASSET_PIPELINE.md` (superseded for v1 — see banner at top of that file)
- Local dev setup: `docs/development/DEVELOPMENT.md`
- GitHub Pages deployment: `docs/deployment/GITHUB_DEPLOYMENT.md`
- GitHub workflow + CI: `docs/deployment/GITHUB_INSTRUCTIONS.md`
