# Development Guide — Kakashi 3D Portfolio

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22 LTS | Use `nvm` or `fnm` to manage versions |
| npm | 11+ | Comes with Node 22 |
| Angular CLI | 21.2+ | `npm install -g @angular/cli` |
| gltf-transform CLI | latest | `npm install -g @gltf-transform/cli` (for model optimisation) |
| Blender | 4.x | Optional — only if model needs rework |
| Git LFS | latest | `git lfs install` — for tracking binary assets |

---

## Initial Setup

```bash
# Clone the repo
git clone https://github.com/<username>/portfolio.git
cd portfolio/portfolio

# Install dependencies
npm install

# Start dev server
npm start
# → http://localhost:4200
```

---

## Installing 3D Dependencies

Once the project is ready to start 3D implementation:

```bash
# Angular Three (NGT) + Three.js
npm install @angular-three/core three
npm install -D @types/three

# Post-processing (bloom, outline glow)
npm install @angular-three/postprocessing postprocessing

# GLTF loader helpers (included in Three.js, but useful utility)
# No extra install needed — GLTFLoader is part of three/examples/jsm

# Optional: Leva controls for debug (remove before prod)
npm install leva
```

**Verify installation:**
```bash
npm ls @angular-three/core three
```

---

## Project Scripts

```bash
npm start              # Dev server with HMR at localhost:4200
npm run build          # Production build (static output)
npm run watch          # Watch mode for development build
npm test               # Run Vitest unit tests
```

### Additional useful commands

```bash
# Generate a new standalone component
ng generate component ui/panel --standalone

# Generate a service
ng generate service core/services/section-store

# Generate a directive
ng generate directive three/kakashi/kakashi-hotspot

# Lint (add ESLint first if not present)
npx ng lint

# Analyse bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/portfolio/browser/stats.json
```

---

## Development Order (Recommended Sequence)

Work in this order to avoid building on a broken foundation:

### Phase 1: Infrastructure
1. Migrate SSR → static (see `../deployment/GITHUB_DEPLOYMENT.md` Part 1)
2. Install NGT and Three.js
3. Scaffold `SectionStore` signal service
4. Scaffold `DeviceCapabilityService`
5. Set up `AppComponent` with `@if` to switch between 3D scene and fallback
6. Verify `ng build` still passes after each step

### Phase 2: 3D Scene (Placeholder)
7. Create `SceneComponent` with NGT canvas + basic lighting
8. Load a **placeholder** GLB (a free generic character from Mixamo or Sketchfab)
9. Verify the model renders correctly in the browser
10. Add `OrbitControls` temporarily (for development inspection — remove before prod)
11. Add post-processing: bloom first, then outline

### Phase 3: Interaction
12. Implement `KakashiHotspotDirective` with raycasting
13. Wire hover → OutlinePass target change
14. Wire click → `SectionStore.open()`
15. Verify all 4–5 hotspots fire the correct section IDs

### Phase 4: UI Panels
16. Build `PanelComponent` with Angular animations (slide in/out)
17. Build each section component (About, Experience, Skills, Projects, Contact)
18. Populate with placeholder content
19. Style consistently with design direction from `../vision/VISION.md`

### Phase 5: Real Model
20. Source and optimise the real Kakashi GLB (see `ASSET_PIPELINE.md` in this folder)
21. Update `HOTSPOT_MAP` with real mesh names from the model
22. Tune lighting and post-processing for the final model's materials

### Phase 6: Mobile Fallback
23. Implement `FallbackComponent` (standard responsive layout)
24. Test on real mobile device / DevTools mobile emulation

### Phase 7: Polish and Deploy
25. Replace placeholder content with real portfolio content
26. Performance audit (Lighthouse, bundle size)
27. Deploy to GitHub Pages (see `../deployment/GITHUB_DEPLOYMENT.md`)
28. Test the live URL on multiple browsers

---

## Code Conventions

### Angular patterns
- **Standalone components only** — no NgModules
- **Signals for all reactive state** — use `signal()`, `computed()`, `effect()` rather than Subjects or BehaviorSubjects
- **`inject()` function** for dependency injection — not constructor injection
- **`@if` / `@for` control flow** — not `*ngIf` / `*ngFor` structural directives
- SCSS for all component styles; no inline styles

### Naming
- Components: `PascalCase` + `.component.ts`
- Services: `PascalCase` + `.ts` (no `.service.ts` suffix needed with standalone)
- Directives: `kebab-case` selector, `PascalCase` class + `.directive.ts`
- NGT components mirror Three.js names: `ngt-mesh`, `ngt-points`, etc.

### File size guard
- No component file > 150 lines. Extract sub-components or helpers when it grows.
- No inline `<style>` in templates
- No `any` in TypeScript — use `unknown` with type guards

---

## Debugging 3D Scenes

### Three.js helpers (dev only)

```typescript
// In SceneComponent, only in !isProduction
import { AxesHelper, GridHelper } from 'three';

// Show world axes
scene.add(new AxesHelper(5));

// Show grid
scene.add(new GridHelper(20, 20));
```

Remove or guard with `!environment.production` before deploying.

### Leva debug controls (dev only)

```typescript
import { useControls } from 'leva'; // dev only
```

Leva provides a floating GUI panel to tweak light intensity, material props, camera position without code changes. **Strip this dependency from production builds** using Angular's `environment.ts` approach.

### Raycasting debug

Log intersections to confirm hotspot detection:

```typescript
// Temporary: log what the ray hits
const intersects = raycaster.intersectObjects(scene.children, true);
console.log(intersects.map(i => i.object.name));
```

### gltf.report

Open [https://gltf.report](https://gltf.report) and drag the GLB in to:
- Inspect mesh hierarchy and names
- Preview material assignments
- Check texture dimensions
- Validate the glTF spec compliance

---

## Performance Monitoring

### During development
```bash
# Check JS bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/portfolio/browser/stats.json
```

### In browser
- Chrome DevTools → Performance tab → record a 5-second interaction
- Three.js `Stats` panel (fps counter) — add temporarily:

```typescript
import Stats from 'three/examples/jsm/libs/stats.module.js';
const stats = new Stats();
document.body.appendChild(stats.dom);
// Call stats.update() inside the animation loop
```

### Target metrics
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 4s (3D loads lazily) |
| 3D scene frame rate | stable 60fps desktop, 30fps mobile fallback n/a |
| Lighthouse Performance score | > 80 |

---

## Environment Configuration

```typescript
// src/environments/environment.ts (development)
export const environment = {
  production: false,
  showDebugHelpers: true,
};

// src/environments/environment.production.ts
export const environment = {
  production: true,
  showDebugHelpers: false,
};
```

Angular CLI automatically swaps these files based on the `--configuration` flag.

---

## Common Issues and Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `WebGLRenderingContext is not defined` during build | SSR build trying to run WebGL in Node | Guard with `isPlatformBrowser` |
| Model renders black | Missing or wrong texture paths | Check texture URIs in the GLB with gltf.report |
| Raycasting never hits | `recursive: false` on `intersectObjects` | Pass `true` for recursive mesh traversal |
| OutlinePass missing on some meshes | Outline only works on `Mesh`, not `Group` | Target leaf mesh children, not parent groups |
| Angular budget error on build | Bundle size exceeds `angular.json` limits | Increase budgets and/or lazy-load the Three.js chunk |
| GitHub Pages shows blank page | Wrong `base-href` | Ensure `--base-href /repo-name/` matches the actual repo name |
| `404` on page refresh (if routes added) | SPA routing on static host | Add `public/404.html` redirect (see `../deployment/GITHUB_DEPLOYMENT.md`) |
