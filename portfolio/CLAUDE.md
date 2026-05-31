# CLAUDE.md — AI Coding Assistant Instructions

This file is read automatically by Claude Code. It gives you the context and conventions needed to work on this project without asking repetitive questions.

---

## What This Project Is

An Angular 21 interactive 3D portfolio. The visitor sees a real-time rendered Kakashi Hatake (Three.js via `angular-three`) on a dark canvas. Hovering body parts highlights them; clicking opens a side panel with portfolio content. The 3D experience degrades gracefully to a 2D responsive layout on mobile or when WebGL is unavailable.

Full design rationale: `docs/vision/VISION.md`  
Architecture decisions: `docs/architecture/ARCHITECTURE.md`

---

## Build & Dev Commands

```bash
# Install
npm install

# Dev server (HMR, localhost:4200)
npm start

# Production build (static output — no SSR)
ng build --configuration production

# Unit tests (Vitest, watch mode)
npm test

# Single test run
ng test --run

# Bundle size analysis
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/portfolio/browser/stats.json
```

---

## Project Structure (key paths)

```
src/app/
  core/
    services/          # SectionStore (signal store), DeviceCapabilityService
    models/            # SectionId type, Section interface
  three/               # All NGT / Three.js components and directives
    scene/             # Root NgtCanvas + lighting
    kakashi/           # GLB loader + KakashiHotspotDirective (raycasting)
    environment/       # Particles, HDRI lighting
    post-processing/   # Bloom + OutlineEffect
  ui/
    panel/             # Sliding content panel (Angular animations)
    sections/          # about/, experience/, skills/, projects/, contact/
    fallback/          # 2D layout for mobile / no-WebGL
    loader/            # Loading screen while GLB fetches
  app.ts               # Root: switches between <app-scene> and <app-fallback>

public/
  models/kakashi/      # kakashi.glb (Draco+KTX2 compressed, < 3MB)
  env/                 # night.hdr HDRI environment map

docs/
  vision/              # Project concept and design direction
  architecture/        # Tech stack decisions and patterns
  development/         # Dev setup, asset pipeline, AI assistant instructions
  deployment/          # GitHub Pages and CI/CD guides
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

---

## 3D-Specific Rules

### WebGL / SSR guard — ALWAYS required
Any code that touches `window`, `document`, `navigator`, `WebGLRenderingContext`, or Three.js objects must be guarded:

```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
```

Even though the project is built as static (no SSR server), Angular still runs the build in a Node context for prerendering. Forgetting this causes build failures.

### angular-three (NGT) — correct package name
```bash
npm install angular-three        # NOT @angular-three/core (outdated)
npm install -D angular-three-plugin
ng generate angular-three-plugin:init
```

Key imports: `NgtCanvas`, `NgtGroup`, `NgtMesh` from `angular-three`.

### Model hotspot mapping
Mesh names from the GLB drive the interaction. After sourcing the Kakashi model, inspect it at gltf.report and update `HOTSPOT_MAP` in `kakashi-hotspot.directive.ts`:

```typescript
const HOTSPOT_MAP: Record<string, SectionId> = {
  'Kakashi_Head':       'about',
  'Kakashi_Book':       'experience',
  'Kakashi_Belt_Kunai': 'skills',
  'Kakashi_ANBU_Mask':  'projects',
  'Kakashi_Headband':   'contact',
};
```
Actual mesh names will differ — this is a placeholder.

### State: use SectionStore, not ad-hoc signals

```typescript
// Correct
inject(SectionStore).open('about');

// Wrong — don't create local signals that duplicate store state
const activeSection = signal<SectionId | null>(null);
```

---

## Testing

This project uses **Vitest** (Angular 21 default — no Karma). Tests run with `ng test`.

### Conventions
- Test files: `*.spec.ts` co-located with the source file
- No `fakeAsync` / `flush` — not supported in Vitest (Angular 21 is zoneless)
- Use `@angular/core/testing` `TestBed` + `ComponentFixture` as normal

### Three.js in tests
Mock WebGL with `jest-webgl-canvas-mock` (works with Vitest):
```typescript
// src/test-setup.ts
import 'jest-webgl-canvas-mock';
```

Don't test NGT rendering output — test the *behaviour*: that `SectionStore.open()` is called with the right section ID when a hotspot click fires.

---

## What NOT to Do

- Do not re-enable SSR. The project is static-only for GitHub Pages. `outputMode: "static"` in `angular.json` is intentional.
- Do not add `server.ts`, `main.server.ts`, or `app.config.server.ts` back.
- Do not place large binaries (GLB, HDR) in `src/assets/` — use `public/` so they bypass the Angular build pipeline.
- Do not exceed the adjusted bundle budget (see `angular.json`). Lazy-load the Three.js chunk.
- Do not add OrbitControls to production. Camera is fixed. OrbitControls are development-only debug tools.
- Do not reference Leva debug controls in production code — strip or guard with `environment.production`.

---

## Deployment

GitHub Pages via GitHub Actions. See `docs/deployment/GITHUB_DEPLOYMENT.md` for the full workflow.

Deploy target: `https://<username>.github.io/portfolio/`  
Base href: `/portfolio/` (set at build time via `--base-href`, not in `index.html`)

The Actions workflow file lives at `.github/workflows/deploy.yml`.

---

## IP Notice

Kakashi Hatake is © Masashi Kishimoto / Studio Pierrot. This is fan work for a non-commercial portfolio. The footer must include attribution. Do not add monetisation, paywalls, or commercial branding.
