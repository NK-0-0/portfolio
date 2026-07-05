# Architecture — Signal Ghost Portfolio

> Supersedes the archived hover/hotspot design (`docs/archive/LEGACY_ARCHITECTURE.md`), which was never fully built and described a different interaction model under a wrong package name. This document describes what is **actually implemented and running today**. `CLAUDE.md` remains the authoritative day-to-day reference for AI coding assistants and takes precedence if the two ever drift — this file exists for the fuller "why," which `CLAUDE.md` intentionally keeps terse.
>
> Cleanup pending per `docs/ROADMAP.md` Milestone 0: five orphaned files from the abandoned hover/hotspot design still physically exist in `src/` (`three/kakashi/`, `three/post-processing/`, `core/services/section-store.ts`, `ui/panel/`, `ui/hint/`) but are not part of the live component tree described below.

## Technology Decisions

### 3D Rendering: angular-three (NGT) over raw Three.js

**Chosen:** `angular-three` (NGT) v4 — note the package name is `angular-three`, **not** `@angular-three/core` (an outdated/wrong package referenced in the archived doc).
**Rejected:** raw Three.js in Angular services, Babylon.js, React Three Fiber.

**Why NGT:**
- Declarative template syntax — Three.js objects become Angular components/directives (`NgtCanvas`, `NgtArgs`).
- Signal-native reactive bindings, matching Angular 21's zoneless/signals model.
- `injectLoader`, `injectBeforeRender`, `injectStore` give lifecycle-safe hooks for GLB loading and per-frame animation without manual `ngOnDestroy` teardown.

Raw Three.js works but requires manual lifecycle management and SSR guarding by hand. NGT bakes `isPlatformBrowser` patterns into its primitives.

### Angular Version

Angular 21.2, standalone components only — no NgModules anywhere. Zoneless, signal-based reactive state (`signal()`, `computed()`, `effect()`) for all UI state; RxJS is reserved for HTTP/async boundaries only. DI via `inject()`, not constructor injection.

### Hosting: Static Output on GitHub Pages

SSR is disabled (`outputMode: "static"` in `angular.json`) — GitHub Pages serves static files only. `@angular/ssr`, `@angular/platform-server`, and `express` remain in `package.json` as leftover scaffolding from an earlier migration and should be removed (`docs/ROADMAP.md` Milestone 0, issue 0.6) — **do not re-enable SSR**.

Build/deploy, as actually run by CI (`.github/workflows/deploy.yml`):
1. `npm ci` in `portfolio/`
2. `ng build --configuration production --base-href /portfolio/`
3. Upload `dist/portfolio/browser` as the Pages artifact and deploy

Live at `https://nk-0-0.github.io/portfolio/`.

### Routing / Navigation Strategy

There is no Angular Router and no click-to-open-panel navigation. The entire experience is **one continuous scrollable page** (`ScrollLayoutComponent`) divided into six `<section>` elements (hero, about, experience, skills, projects, contact). Lenis provides smooth-scroll physics; GSAP `ScrollTrigger` watches scroll position and updates `ScrollStateService.activeSection` (an integer 0–5) plus a continuous `scrollProgress`. Every reactive visual — camera position, fog/light color, 3D prop transforms, parallax label/hue tweens — reads that one signal and lerps toward a per-section target value inside `injectBeforeRender`.

There is deliberately no `SectionStore`/panel-open concept (that belonged to the archived hotspot design) and no hash-routing today; if deep-linking to a section is ever wanted, add it as `scrollIntoView` triggered by a hash fragment, without introducing the Angular Router.

## Folder Structure (live tree only)

```
src/app/
  core/
    services/
      scroll-state.service.ts      # activeSection (0-5) + scrollProgress — single source of truth
      device-capability.ts         # WebGL + mobile detection -> 2D fallback switch
      model-loading.service.ts     # Tracks GLB load count across mask/floating-models
    models/
      section.types.ts             # SectionId, Section, SECTIONS (nav labels)
  three/
    scene/
      scene.component.ts           # Outer shell: fixed canvas + ScrollLayout + loader + footer
      scene-graph.component.ts     # SceneController -> Lighting -> Mask -> FloatingModels -> Particles
      scene-controller.component.ts # Per-section fog color + camera Y lerp
    mask/                          # Primary 3D focal element, repositions per section
    floating-models/               # Two floating props (book/kunai equivalents today)
    environment/
      lighting.component.ts        # Moonlight + rim directional lights, color-lerped per section
      particles.component.ts       # Ambient particle field
  ui/
    scroll-layout/                 # THE page: Lenis + GSAP ScrollTrigger, all 6 sections
    sections/                      # about/, experience/, skills/, projects/, contact/ content
    fallback/                      # 2D layout for mobile / no-WebGL
    loader/                        # Loading screen while GLBs fetch
    footer/                        # Fixed attribution footer
  app.ts                           # Root: @defer-switches between <app-scene> and <app-fallback>

public/
  models/                          # GLBs the live scene graph actually loads, referenced by relative path

docs/
  vision/VISION.md                 # Current visual/content direction
  architecture/ARCHITECTURE.md     # This file
  ROADMAP.md                       # Stall diagnosis + milestone/issue plan for the rework
  archive/                         # Superseded docs, kept for history only
```

Orphaned (present in `src/` but not in the tree above — pending removal, `docs/ROADMAP.md` issue 0.2): `three/kakashi/kakashi.component.ts`, `three/post-processing/effects.component.ts`, `core/services/section-store.ts`, `ui/panel/panel.component.ts`, `ui/hint/hint.component.ts`.

## State Management Pattern

No NgRx, no third-party state library — Angular signals only.

```typescript
// core/services/scroll-state.service.ts (shape, not exact source)
@Injectable({ providedIn: 'root' })
export class ScrollStateService {
  readonly activeSection = signal<number>(0);   // 0-5
  readonly scrollProgress = signal<number>(0);  // 0-1 within current section
}
```

Every 3D component injects `ScrollStateService` and reads `activeSection()`/`scrollProgress()` inside its own `injectBeforeRender` callback to drive per-frame lerps toward that section's target values. Per-section tunable values (colors, positions, camera targets) are plain arrays indexed by `activeSection` (0–5), defined as module-level constants at the top of the component that uses them — follow this pattern for new tunables rather than introducing a config service (see `CLAUDE.md`).

## WebGL + SSR Safety

Even with static-only output, Angular's build still runs in a Node context for prerendering, which has no `window`/`WebGLRenderingContext`. Any code touching `window`, `document`, `navigator`, or Three.js objects directly must guard itself:

```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
```

Existing components gate both their `@if` templates and `injectBeforeRender` callbacks on this check — follow the same pattern for new 3D components. Forgetting it causes build failures, not just runtime errors, because prerendering happens at build time.

## Performance Budget

`angular.json` bundle budgets are raised above Angular's defaults to accommodate Three.js:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "2MB", "maximumError": "4MB" },
  { "type": "anyComponentStyle", "maximumWarning": "8kB", "maximumError": "16kB" }
]
```

Three.js/angular-three is lazy-loaded via `@defer` in `app.ts` — this must stay in place so the initial JS bundle (loading screen, fallback shell) stays small and Three.js only downloads after the app shell renders.

**3D asset payload budget** (see `docs/vision/VISION.md` for the full rationale): ≤500KB per GLB prop, ≤1.2MB total, Draco-compressed, ≤5k tris, ≤1024px textures — or, per the current recommendation, build new props as procedural Three.js geometry with zero GLBs for v1. The current shipped assets (15.3MB across 4 GLBs) are well over any reasonable budget and are being replaced (`docs/ROADMAP.md` Milestones 1–2).

## Interaction Architecture

```
User scrolls
  → Lenis intercepts native scroll, applies smoothing physics
  → GSAP ScrollTrigger fires on scroll position thresholds per section
  → ScrollStateService.activeSection updates (0-5), scrollProgress updates continuously
  → Every 3D component's injectBeforeRender reads activeSection()
  → Object3D transforms/colors lerp toward that section's target values
    (current += (target - current) * Math.min(delta * k, 1))
  → 2D UI (parallax labels, section hue tween) tweens via the same GSAP ScrollTrigger timeline
```

This replaces the archived design's hover-raycast-hotspot → click → open-panel flow entirely. There is no raycasting, no `OutlinePass`/bloom post-processing, and no sliding panel in the live app — scroll position is the only input the 3D scene responds to. This is a deliberate simplification relative to the archived design: it works on touch devices without a separate interaction mode, needs no discoverability affordance ("hover to explore"), and has no dependency on a specific character's mesh topology, which is what let the theme change (Kakashi → Signal Ghost) happen without redesigning the interaction model.

## Mobile / No-WebGL Fallback Strategy

`DeviceCapabilityService` checks, on the browser only:
1. `window.innerWidth < 768`
2. `'ontouchstart' in window`
3. WebGL capability (`canvas.getContext('webgl2')` returns null)

If any are true, `app.ts` renders `<app-fallback>` instead of `<app-scene>` via `@if`/`@else` inside the `@defer` block. `FallbackComponent` is a standard responsive 2D layout carrying the same content and sharing the same CSS custom properties (palette/typography tokens) as the 3D version, so a rebrand of `styles.scss` tokens propagates to both automatically. This fallback is not an edge case — the `innerWidth < 768` threshold alone routes a meaningful share of tablet/touch-laptop visitors here, so it must get equal design attention (`docs/vision/VISION.md`, Motion & Performance Guardrails).

## Testing Architecture

Vitest (Angular 21 default, zoneless-compatible) via `ng test`. WebGL is mocked with `vitest-canvas-mock` (`src/test-setup.ts`). Convention: test *behavior* (service signal updates), not NGT render output. Playwright (`e2e/portfolio.spec.ts`) runs against the **deployed production site**, not localhost — it's a post-deploy smoke check, not a dev-loop safety net; `docs/ROADMAP.md` Milestone 4 adds a local pre-deploy Playwright run to close that gap.
