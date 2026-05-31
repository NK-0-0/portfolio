# AGENTS.md — Cross-Tool AI Assistant Instructions

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
Angular 21 static SPA. A 3D Kakashi Hatake model on a WebGL canvas. Clicking body parts opens portfolio content panels. Deploys to GitHub Pages.

### Non-obvious constraints (read these before writing any code)

1. **No SSR — static prerender only.** `angular.json` has `outputMode: "static"`. GitHub Pages cannot run a Node server. Never re-introduce `server.ts` or the SSR build chain.

2. **WebGL guard is mandatory.** Angular's build runs in Node for prerendering even on static output. Any Three.js / DOM code must be wrapped in `isPlatformBrowser(inject(PLATFORM_ID))` or placed inside lifecycle hooks that only fire in a browser (`afterNextRender`, `effect()` with browser check).

3. **Correct NGT package name.** The package is `angular-three` (v4), not `@angular-three/core` (deprecated). Install via `ng generate angular-three-plugin:init` after `npm install angular-three angular-three-plugin`.

4. **Signals, not RxJS, for UI state.** `SectionStore` in `src/app/core/services/section-store.ts` is the single source of truth for which panel is open. Do not create parallel reactive state.

5. **Large assets go in `public/`**, not `src/assets/`. Files in `public/` are copied as-is to the build output without Angular processing them.

6. **Bundle budget is raised.** `angular.json` has been updated to allow up to 4MB (Three.js + model). Still lazy-load the Three.js chunk on app startup.

7. **Mobile gets a 2D fallback.** `DeviceCapabilityService` detects mobile/no-WebGL and switches to `<app-fallback>`. Do not attempt 3D on mobile.

---

## Stack at a Glance

| Concern | Package | Version |
|---------|---------|---------|
| Framework | `@angular/core` | 21.2 |
| 3D renderer | `angular-three` | 4.x |
| Three.js peer | `three` | r170+ |
| Post-processing | `postprocessing` | latest |
| State | Native Angular signals | built-in |
| Testing | Vitest | 4.x (Angular default) |
| Build | `@angular/build` | 21.2 |
| Deploy | `angular-cli-ghpages` | 3.x |

Full stack reference with code snippets: `docs/architecture/SKILLS_REFERENCE.md`

---

## File Map for Common Tasks

| Task | Where to look |
|------|---------------|
| Change what clicking a body part does | `src/app/three/kakashi/kakashi-hotspot.directive.ts` |
| Edit a portfolio section's content | `src/app/ui/sections/<section>/` |
| Adjust lighting or scene setup | `src/app/three/scene/scene.component.ts` |
| Change which panel is open | `src/app/core/services/section-store.ts` |
| Modify the mobile 2D fallback | `src/app/ui/fallback/fallback.component.ts` |
| Retune post-processing effects | `src/app/three/post-processing/effects.component.ts` |
| Swap the 3D model | `public/models/kakashi/kakashi.glb` + update hotspot map |
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
- `jest-webgl-canvas-mock` for WebGL surface mocking
- No `fakeAsync` / `flush` — project is zoneless
- Test *behaviour* (signal state changes, hotspot dispatch) not Three.js render output
- `ng test --run` for CI; `npm test` for dev watch mode

---

## Links

- Vision + section mapping: `docs/vision/VISION.md`
- Architecture decisions: `docs/architecture/ARCHITECTURE.md`
- Tech stack reference: `docs/architecture/SKILLS_REFERENCE.md`
- 3D model sourcing + optimisation: `docs/development/ASSET_PIPELINE.md`
- Local dev setup: `docs/development/DEVELOPMENT.md`
- GitHub Pages deployment: `docs/deployment/GITHUB_DEPLOYMENT.md`
- GitHub workflow + CI: `docs/deployment/GITHUB_INSTRUCTIONS.md`
