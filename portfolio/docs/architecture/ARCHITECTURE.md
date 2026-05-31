# Architecture — Kakashi 3D Portfolio

## Technology Decisions

### 3D Rendering: Angular Three (NGT) over raw Three.js

**Chosen:** `@angular-three/core` (Angular Three, NGT)
**Rejected:** Three.js directly, Babylon.js, React Three Fiber

**Why NGT:**
- Declarative template syntax — Three.js objects become Angular components/directives
- Signal-native reactive bindings (Angular 17+ signals, this project is Angular 21)
- Tree-shakeable, works with Angular's build system out of the box
- No zone.js friction for animation loops
- Maintained by Chau Tran, highly active as of 2025

Three.js directly works but requires manual lifecycle management in Angular services (`ngOnInit`/`ngOnDestroy` teardown) and breaks SSR without guards. NGT handles this with `isPlatformBrowser` patterns built in.

Babylon.js is more batteries-included but adds ~300KB more bundle weight and has weaker Angular community patterns.

**Key NGT packages:**
```
@angular-three/core         # Core renderer
@angular-three/postprocessing  # Bloom, OutlinePass
@angular-three/cannon       # Physics (if needed later)
three                       # Peer dependency
@types/three
```

### Angular Version

**Angular 21.2** with standalone components throughout. No NgModules.

Signal-based state (`signal()`, `computed()`, `effect()`) for all reactive state. No RxJS for UI state — only for HTTP and async operations.

### Hosting: Static Prerender on GitHub Pages

SSR (server-side rendering) is **disabled** — GitHub Pages serves only static files and cannot run a Node server.

**Migration from current SSR config:**
1. In `angular.json` change `"outputMode": "server"` → `"outputMode": "static"`
2. Remove `server.ts`, `main.server.ts`, `app.config.server.ts`, `app.routes.server.ts`
3. Add `prerender: true` with `routesFile` listing all routes
4. Add `base-href` to match GitHub repo name on deploy

See `../deployment/GITHUB_DEPLOYMENT.md` for the full workflow.

### Routing Strategy

A **single-page experience** with no Angular routes — navigation is purely driven by clicking Kakashi's body parts, which triggers an injectable `SectionStore` signal to update which panel is open.

```
/          → 3D canvas loads, no visible panel
click(face) → SectionStore.open('about')
click(book) → SectionStore.open('experience')
```

If deep-linking to sections is later needed, add hash routes (`/#about`) without reloading the 3D scene.

---

## Folder Structure

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── section-store.ts        # Signal store: which panel is open
│   │   │   └── device-capability.ts   # Detect mobile → 2D fallback
│   │   └── models/
│   │       └── section.types.ts       # Section enum/interface
│   │
│   ├── three/                         # All 3D-specific components
│   │   ├── scene/
│   │   │   └── scene.component.ts     # Root NGT canvas + lighting
│   │   ├── kakashi/
│   │   │   ├── kakashi.component.ts   # Loads GLB, exposes mesh refs
│   │   │   └── kakashi-hotspot.directive.ts  # Raycasting + hover/click
│   │   ├── environment/
│   │   │   ├── lighting.component.ts
│   │   │   └── particles.component.ts  # Floating leaves
│   │   └── post-processing/
│   │       └── effects.component.ts   # Bloom + Outline
│   │
│   ├── ui/                            # 2D Angular UI overlaid on canvas
│   │   ├── panel/
│   │   │   └── panel.component.ts     # Sliding content panel
│   │   ├── sections/
│   │   │   ├── about/
│   │   │   ├── experience/
│   │   │   ├── skills/
│   │   │   ├── projects/
│   │   │   └── contact/
│   │   ├── fallback/
│   │   │   └── fallback.component.ts  # 2D layout for mobile
│   │   └── loader/
│   │       └── loader.component.ts    # Suspense / loading screen
│   │
│   └── app.ts                         # Root component, route guard for fallback
│
├── assets/
│   └── models/
│       └── kakashi/
│           ├── kakashi.glb            # Draco-compressed, optimised model
│           └── textures/              # KTX2 compressed textures (separate if not embedded)
│
public/
│   └── (static assets copied as-is)
```

---

## State Management Pattern

Use Angular signals — no NgRx, no third-party state library.

```typescript
// core/services/section-store.ts
@Injectable({ providedIn: 'root' })
export class SectionStore {
  readonly activeSection = signal<SectionId | null>(null);
  readonly isPanelOpen = computed(() => this.activeSection() !== null);

  open(id: SectionId) { this.activeSection.set(id); }
  close()             { this.activeSection.set(null); }
}
```

The NGT scene reads `activeSection` via `inject(SectionStore)` to drive the OutlinePass target. The UI panel reads it to decide what to render.

---

## WebGL + SSR Safety

Even with static prerender, Angular runs the build in a Node context that has no `window` or `WebGLRenderingContext`. Every Three.js / NGT import must be guarded:

```typescript
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

// Inside a component or service:
readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
```

NGT's canvas component already handles this internally, but custom services that touch `window`, `document`, or `navigator.gpu` must guard themselves.

---

## Performance Budget

Angular's default budget (`500kB` warning, `1MB` error) will be exceeded by Three.js alone (~600KB minified). Update `angular.json`:

```json
"budgets": [
  { "type": "initial", "maximumWarning": "2MB", "maximumError": "4MB" },
  { "type": "anyComponentStyle", "maximumWarning": "8kB", "maximumError": "16kB" }
]
```

Additionally, lazy-load the entire 3D module:
```typescript
// app.ts
const SceneComponent = await import('./three/scene/scene.component');
```

This keeps the initial JS bundle small (fast first paint of the loading screen) and defers Three.js until after the app shell renders.

---

## Interaction Architecture

```
User hovers mesh part
  → NGT Raycaster (per-frame intersection test)
  → HotspotDirective detects hit
  → CSS cursor changes to pointer
  → OutlinePass adds glow to that mesh
  → Floating label becomes visible (CSS absolute position)

User clicks
  → HotspotDirective emits section ID
  → SectionStore.open(id)
  → PanelComponent animates in (CSS translate, Angular animations)
  → Scene dims slightly (overlay backdrop signal)

User clicks X / backdrop
  → SectionStore.close()
  → PanelComponent animates out
```

---

## Mobile Fallback Strategy

In `app.ts`, inject `DeviceCapabilityService` which checks:
1. `window.innerWidth < 768`
2. `'ontouchstart' in window`
3. WebGL capability: `canvas.getContext('webgl2')` returns null

If any are true, render `<app-fallback>` instead of `<app-scene>`. The fallback is a standard, well-designed responsive portfolio page with the same content — styled consistently with the 3D version's colour palette and typography.

```typescript
@Component({
  template: `
    @if (capability.is3DSupported()) {
      <app-scene />
    } @else {
      <app-fallback />
    }
  `
})
export class AppComponent {}
```
