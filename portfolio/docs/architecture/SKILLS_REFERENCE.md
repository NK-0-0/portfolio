# Skills Reference — Tech Stack, APIs, and Tooling

A single-page reference for every library and tool in this project. Use this to look up install commands, key API patterns, and links to official docs without leaving the editor.

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

```typescript
import { NgtArgs } from 'angular-three';
import { NgtsMeshStandardMaterial } from 'angular-three-soba/materials';

@Component({
  selector: 'app-scene-graph',
  standalone: true,
  template: `
    <ngt-ambient-light [intensity]="0.5" />
    <ngt-directional-light [position]="[5, 10, 5]" [intensity]="1" />
    <app-kakashi />
  `,
})
export class SceneGraphComponent { }
```

### Loading a GLB model

```typescript
import { injectLoader } from 'angular-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({...})
export class KakashiComponent {
  readonly gltf = injectLoader(GLTFLoader, '/models/kakashi/kakashi.glb');
  // gltf() is null until loaded; use @if (gltf()) in template
}
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

### Raycasting against named meshes

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

## postprocessing — Effects

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

## @ngrx/signals — Signal Store (optional enhancement)

**Docs:** https://ngrx.io/guide/signals  
**Package:** `@ngrx/signals` v21.1.0

For this project, the simple `SectionStore` (plain Angular service with signals) is sufficient. Use NgRx Signal Store only if state grows complex (multiple entity collections, derived views, optimistic updates).

```bash
npm install @ngrx/signals
```

```typescript
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { computed } from '@angular/core';

export const SectionStore = signalStore(
  { providedIn: 'root' },
  withState({ activeSection: null as SectionId | null }),
  withComputed(({ activeSection }) => ({
    isPanelOpen: computed(() => activeSection() !== null),
  })),
  withMethods((store) => ({
    open: (id: SectionId) => patchState(store, { activeSection: id }),
    close: ()            => patchState(store, { activeSection: null }),
  })),
);
```

---

## gltf-transform — Model Optimisation

**Docs:** https://gltf-transform.dev  
**Package:** `@gltf-transform/cli` (v3.2.1)

```bash
npm install -g @gltf-transform/cli

# Inspect a model
gltf-transform inspect kakashi-original.glb

# Full optimisation: Draco geometry + KTX2 textures + resize
gltf-transform optimize kakashi-original.glb kakashi.glb \
  --compress draco \
  --texture-compress ktx2 \
  --texture-resize 1024

# Fallback if KTX2 fails (WebP is still much smaller than PNG)
gltf-transform optimize kakashi-original.glb kakashi.glb \
  --compress draco \
  --texture-compress webp

# Draco only (if KTX2 not needed)
gltf-transform draco kakashi-original.glb kakashi.glb --method edgebreaker
```

**Target:** final GLB < 3MB. Inspect result size with `ls -lh kakashi.glb`.

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

```typescript
import { TestBed } from '@angular/core/testing';
import { PanelComponent } from './panel.component';
import { SectionStore } from '../../core/services/section-store';

describe('PanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PanelComponent],
    });
  });

  it('should be closed by default', () => {
    const fixture = TestBed.createComponent(PanelComponent);
    fixture.detectChanges();
    expect(inject(SectionStore).isPanelOpen()).toBe(false);
  });
});
```

### Mocking WebGL for Three.js tests

```bash
npm install -D jest-webgl-canvas-mock
```

```typescript
// src/test-setup.ts
import 'jest-webgl-canvas-mock';
```

In `angular.json` test options:
```json
"setupFiles": ["src/test-setup.ts"]
```

---

## Lighthouse CI — Performance Auditing

**Docs:** https://github.com/GoogleChrome/lighthouse-ci  
**Version:** @lhci/cli v0.15.1

```bash
npm install -g @lhci/cli@0.15.x
```

**`lighthouserc.json`** (place at project root):
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4200/portfolio/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance":    ["error", { "minScore": 0.8 }],
        "categories:accessibility":  ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn",  { "minScore": 0.9 }],
        "categories:seo":            ["warn",  { "minScore": 0.8 }]
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
| **Sketchfab** | Source Kakashi GLB model | https://sketchfab.com |
| **Blender 4.x** | Rework model, re-export GLB with Draco | https://blender.org |
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
