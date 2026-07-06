# Skills Reference — Tech Stack, APIs, and Tooling

A single-page reference for every library and tool in this project. Use this to look up install commands, key API patterns, and links to official docs without leaving the editor.

> **Corrected 2026-07-05.** Several sections below (raycasting, `postprocessing`, the `SectionStore`/`PanelComponent` test example) documented the archived hover/hotspot design as if it were current. That design was replaced by the scroll-driven architecture in `docs/architecture/ARCHITECTURE.md` — those sections are now explicitly marked **[ARCHIVED — not in live code]** rather than deleted, since `VISION.md`'s "What NOT To Do" list references this exact history and it's useful to know what was tried and rejected. The WebGL test-mock package name and the `angular-three` inject-API deprecation note were factually wrong/stale and have been corrected outright.

---

## Angular 21

**Docs:** https://angular.dev

### Key patterns used in this project

```typescript
// Standalone component (no NgModule)
@Component({
  selector: 'app-panel',
  standalone: true,
  imports: [CommonModule, AnimationModule],
  template: `...`,
  styles: [`...`],
})
export class PanelComponent { }

// Signal-based reactive state
readonly count = signal(0);
readonly doubled = computed(() => this.count() * 2);
effect(() => console.log(this.count()));   // runs whenever count changes

// Dependency injection via inject()
readonly store = inject(SectionStore);

// Control flow (NOT *ngIf / *ngFor)
// @if / @else
@if (store.isPanelOpen()) {
  <app-panel />
} @else {
  <app-hint />
}

// @for
@for (skill of skills(); track skill.id) {
  <app-skill-tag [skill]="skill" />
}

// afterNextRender — browser-safe lifecycle (replaces ngAfterViewInit for browser-only code)
afterNextRender(() => {
  // safe to touch DOM / WebGL here
});
```

### Version
```bash
npm ls @angular/core   # should show 21.2.x
```

---

## angular-three (NGT) — 3D Renderer

**Docs:** https://angularthree.org  
**Package:** `angular-three` (v4) — do NOT use `@angular-three/core` (deprecated v2)

### Install

```bash
npm install angular-three
npm install -D angular-three-plugin
ng generate angular-three-plugin:init    # scaffolds NgtCanvas config
```

### Canvas setup

```typescript
import { NgtCanvas } from 'angular-three';

@Component({
  standalone: true,
  imports: [NgtCanvas, SceneGraphComponent],
  template: `
    <ngt-canvas [sceneGraph]="SceneGraph" [camera]="{ position: [0, 1.5, 5] }" />
  `,
})
export class AppSceneComponent {
  readonly SceneGraph = SceneGraphComponent;
}
```

### Scene graph component

The live scene graph is `SceneController` (fog + camera) → `Lighting` → `Mask` (focal prop) → `FloatingModels` (two floating props) → `Particles` — see `src/app/three/scene/scene-graph.component.ts` for the real, current composition.

```typescript
import { NgtArgs } from 'angular-three';

@Component({
  selector: 'app-scene-graph',
  standalone: true,
  template: `
    <ngt-ambient-light [intensity]="0.5" />
    <ngt-directional-light [position]="[5, 10, 5]" [intensity]="1" />
    <app-mask />
  `,
})
export class SceneGraphComponent { }
```

### Loading a GLB model

**Deprecation note (verified against the installed `angular-three@4.2.2` type definitions, 2026-07-05):** `injectLoader` and `injectBeforeRender` (used throughout this codebase's live components, e.g. `mask.component.ts`) are marked `@deprecated` in the installed version — superseded by `loaderResource()` and `beforeRender()` respectively, and **scheduled for removal in v5**. `injectStore` is not deprecated. They still work today; this is flagged so a future migration isn't a surprise — see `docs/vision/REQUIREMENTS.md` NFR-8. Milestone 3's scene-graph retarget (`docs/ROADMAP.md`) is a natural point to migrate since those components are being touched anyway.

```typescript
// Current codebase pattern (works today, but deprecated — see note above)
import { injectLoader } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({...})
export class FocalPropComponent {
  readonly gltf = injectLoader(() => GLTFLoader, () => '/models/hud/hud-core.glb');
  // gltf() is null until loaded; use @if (gltf()) in template
}

// Non-deprecated v4.2.2 replacement (not yet adopted in this codebase)
import { loaderResource } from 'angular-three';
readonly gltf = loaderResource(() => GLTFLoader, () => '/models/mask/hud-core.glb');
```

---

## Three.js

**Docs:** https://threejs.org/docs  
**Current version:** r170+  
**Package:** `three` (peer dep of angular-three)

```bash
npm install three
npm install -D @types/three
```

### Raycasting against named meshes **[ARCHIVED — not in live code]**

This was the interaction model for the abandoned hover/hotspot design (`docs/archive/LEGACY_VISION.md`). `VISION.md`'s "What NOT To Do" explicitly forbids resurrecting hover/raycast hotspots — it had no accessible touch/keyboard equivalent and was one of the diagnosed reasons the original build stalled (`docs/ROADMAP.md` Finding 2). Kept below for historical reference only.

```typescript
import { Raycaster, Vector2 } from 'three';

const raycaster = new Raycaster();
const mouse = new Vector2();

// On mousemove event
mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

raycaster.setFromCamera(mouse, camera);

// Pass recursive=true to hit child meshes of a Group
const intersects = raycaster.intersectObjects(scene.children, true);

if (intersects.length > 0) {
  const hitName = intersects[0].object.name;  // matches HOTSPOT_MAP key
}
```

### Traverse model to find named meshes

```typescript
import type { Mesh } from 'three';

// After GLB load:
const hotspotMeshes: Mesh[] = [];
gltf.scene.traverse((child) => {
  if (child.isMesh && HOTSPOT_MAP[child.name]) {
    hotspotMeshes.push(child as Mesh);
  }
});
```

---

## postprocessing — Effects **[ARCHIVED — not in live code, do not add back]**

`VISION.md`'s "What NOT To Do" explicitly forbids bloom/post-processing: `UnrealBloomPass`-style effects are a common mobile-perf killer and this project already tried one (`three/post-processing/effects.component.ts`, orphaned) that didn't survive contact with reality (`docs/ROADMAP.md` Finding 2–3). The `postprocessing` package is **not** a dependency to add. Kept below for historical reference only.

**Docs:** https://pmndrs.github.io/postprocessing  
**Package:** `postprocessing`

```bash
npm install postprocessing
```

### OutlineEffect (hover glow)

```typescript
import { EffectComposer, RenderPass, EffectPass, OutlineEffect } from 'postprocessing';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const outlineEffect = new OutlineEffect(scene, camera, {
  edgeStrength: 3,
  edgeGlow: 0.5,
  edgeThickness: 1,
  visibleEdgeColor: new Color('#00e5ff'),   // teal glow
  hiddenEdgeColor: new Color('#000000'),
});

composer.addPass(new EffectPass(camera, outlineEffect));

// On hover:
outlineEffect.selection.set([hoveredMesh]);

// Clear on mouse leave:
outlineEffect.selection.clear();
```

### SelectiveBloomEffect (bloom on specific meshes only)

```typescript
import { SelectiveBloomEffect, BlendFunction } from 'postprocessing';

const bloom = new SelectiveBloomEffect(scene, camera, {
  blendFunction: BlendFunction.ADD,
  luminanceThreshold: 0.4,
  luminanceSmoothing: 0.2,
  intensity: 1.5,
});

bloom.selection.add(glowMesh);
```

---

## @ngrx/signals — Signal Store (not currently used; optional future enhancement)

**Docs:** https://ngrx.io/guide/signals  
**Package:** `@ngrx/signals` v21.1.0

Not a dependency today. The live single source of truth is `ScrollStateService` (`src/app/core/services/scroll-state.service.ts`) — a plain Angular service with two signals (`activeSection`, `scrollProgress`), no NgRx. `SectionStore` (`section-store.ts`, shown in an older version of this doc) is an **orphaned leftover** from the archived panel design (`docs/ROADMAP.md` Milestone 0) — do not use it as a reference. Only reach for `@ngrx/signals` if state genuinely grows complex (multiple entity collections, derived views, optimistic updates) — not the case here.

```bash
npm install @ngrx/signals
```

---

## gltf-transform — Model Optimisation

**Docs:** https://gltf-transform.dev  
**Package:** `@gltf-transform/cli` — verified 2026-07-05: still the current/actively-maintained tool for this job; the version below was stale (checked `npm view @gltf-transform/cli version` — latest is **4.4.1**, not 3.2.1). Don't hard-pin a version in docs; use `npm install -g @gltf-transform/cli@latest` and record whatever version you actually used in `docs/ASSET_CREDITS.md` if this pipeline runs. Note: per `docs/vision/VISION.md`'s procedural-primitives recommendation, this pipeline may not be needed at all for v1 — see `docs/development/ASSET_PIPELINE.md`.

```bash
npm install -g @gltf-transform/cli

# Inspect a model
gltf-transform inspect model-raw.glb

# Full optimisation: Draco geometry + KTX2 textures + resize
gltf-transform optimize model-raw.glb model.glb \
  --compress draco \
  --texture-compress ktx2 \
  --texture-resize 1024

# Fallback if KTX2 fails (WebP is still much smaller than PNG)
gltf-transform optimize model-raw.glb model.glb \
  --compress draco \
  --texture-compress webp

# Draco only (if KTX2 not needed)
gltf-transform draco model-raw.glb model.glb --method edgebreaker
```

**Target:** final GLB < 3MB. Inspect result size with `ls -lh model.glb`.

---

## angular-cli-ghpages — Deploy to GitHub Pages

**Package:** `angular-cli-ghpages` v3.0.3  
**Docs:** https://github.com/angular-schule/angular-cli-ghpages

```bash
ng add angular-cli-ghpages
```

Adds a `deploy` target to `angular.json`:
```json
"deploy": {
  "builder": "angular-cli-ghpages:deploy",
  "options": {
    "baseHref": "/portfolio/"
  }
}
```

Manual deploy:
```bash
ng deploy --base-href /portfolio/
```

**For CI/CD** — the project uses GitHub Actions instead (see `docs/deployment/GITHUB_INSTRUCTIONS.md`). angular-cli-ghpages is useful for quick manual deploys.

---

## Vitest — Testing

**Docs:** https://vitest.dev  
**Angular guide:** https://angular.dev/guide/testing/migrating-to-vitest

Vitest is the **default test runner in Angular 21** — no Jasmine, no Karma.

```bash
npm test            # watch mode
ng test --run       # single run (CI)
ng test --coverage  # coverage report (includes HTML templates)
```

### Component test example

`PanelComponent`/`SectionStore` (previously shown here) are orphaned leftovers from the archived panel design — do not use them as a reference. Follow a live, tested component instead, e.g. `src/app/ui/sections/about/about.component.spec.ts` or `src/app/core/services/device-capability.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AboutComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
```

### Mocking WebGL for Three.js tests

This project uses **`vitest-canvas-mock`**, not `jest-webgl-canvas-mock` (there is no Jest anywhere in this repo — verified against `package.json` devDependencies, 2026-07-05):

```bash
npm install -D vitest-canvas-mock
```

```typescript
// src/test-setup.ts
import 'vitest-canvas-mock';
```

---

## Lighthouse CI — Performance Auditing

**Docs:** https://github.com/GoogleChrome/lighthouse-ci  
**Version:** @lhci/cli v0.15.1

```bash
npm install -g @lhci/cli@0.15.x
```

**`lighthouserc.json`** (this is the actual file at the project root, verified 2026-07-05 — the numbers below match reality, not an example):
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist/portfolio/browser",
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance":    ["warn",  { "minScore": 0.75 }],
        "categories:accessibility":  ["error", { "minScore": 0.90 }],
        "categories:best-practices": ["warn",  { "minScore": 0.85 }],
        "categories:seo":            ["warn",  { "minScore": 0.80 }]
      }
    }
  }
}
```

Integrated into GitHub Actions — see `docs/deployment/GITHUB_INSTRUCTIONS.md`.

---

## Dev Tools

| Tool | Purpose | How to get |
|------|---------|------------|
| **gltf.report** | Inspect GLB mesh names, materials, textures | browser: https://gltf.report |
| **Spline** | Web-based 3D editor (optional prototyping) | https://spline.design |
| **Poly Haven** | Free CC0 HDRIs for environment lighting | https://polyhaven.com |
| **Sketchfab** | Not needed for v1 per `VISION.md`'s procedural-primitives recommendation; only relevant if a hand-modeled GLB prop is pursued as a v2 stretch goal | https://sketchfab.com |
| **Blender 4.x** | Only needed if a hand-modeled GLB prop is built (v2 stretch goal, not v1) | https://blender.org |
| **Chrome DevTools Performance** | Frame rate, memory, JS profile | F12 → Performance |
| **Three.js Stats** | FPS counter overlay (dev only) | `three/examples/jsm/libs/stats.module.js` |
| **webpack-bundle-analyzer** | Visualise JS bundle | `npx webpack-bundle-analyzer` |
| **ngx-translate** | i18n if needed later | optional |

---

## Browser Support Targets

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 110+ | Full | Primary target |
| Firefox 115+ | Full | |
| Safari 16.4+ | Full | WebGL2 + modern CSS |
| Edge 110+ | Full | Chromium-based |
| Mobile Safari / Chrome | 2D fallback | No WebGL attempt |
| IE11 | Not supported | Angular 21 drops IE support |

---

## Environment Variables

No secrets in this project — it's a fully static public portfolio with no backend.

If a contact form is added later (Formspree, EmailJS):
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  formspreeEndpoint: 'https://formspree.io/f/YOUR_ID',
};
```

Never commit real endpoint IDs to a public repo without verifying they don't carry rate-limit secrets.
