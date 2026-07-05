# Development Guide — Signal Ghost Portfolio

> **Corrected 2026-07-05.** The "Development Order" and "Installing 3D Dependencies" sections below described the *original* pre-pivot build plan (hover/hotspot raycasting, click-to-open panels, `@angular-three/core`, bloom/outline post-processing) as the recommended path — that plan was abandoned; see `docs/ROADMAP.md` for why. The app already exists in its current scroll-driven form. For **what to build next**, use `docs/ROADMAP.md`'s Milestone/issue breakdown, not the phase list below. Sections on debugging, performance monitoring, and common issues remain generally accurate and are left as-is.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 22 or 24 LTS | Node 24 became the **Active LTS** line in Oct 2025 (verified via nodejs.org release schedule, 2026-07-05); Node 22 is now in **Maintenance LTS** (EOL Apr 2027) — either works, but prefer 24 for new setups. Use `nvm` or `fnm` to manage versions |
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

## 3D Dependencies (already installed — reference only)

These are already in `package.json`; shown here for reference, not as a setup step:

```bash
# Angular Three (NGT) + Three.js — correct package name, NOT @angular-three/core
npm install angular-three three
npm install -D @types/three angular-three-plugin

# GLTF loader helpers (included in Three.js, but useful utility)
# No extra install needed — GLTFLoader is part of three/examples/jsm

# Optional: Leva controls for debug (remove before prod) — not currently installed
npm install leva
```

**Do not install** `postprocessing` / `@angular-three/postprocessing` — `docs/vision/VISION.md`'s "What NOT To Do" explicitly forbids bloom/post-processing (mobile-perf killer, already tried once and abandoned; see `docs/ROADMAP.md` Finding 2–3).

**Verify installation:**
```bash
npm ls angular-three three
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
ng generate component ui/sections/example --standalone

# Generate a service
ng generate service core/services/example

# Lint (no ESLint config exists yet in this repo — docs/ROADMAP.md Milestone 0, issue 0.7)
npx ng lint

# Analyse bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/portfolio/browser/stats.json
```

---

## Development Order (Recommended Sequence)

**This section previously listed a from-scratch build order (SSR migration, hotspot/raycast interaction, click-open panels) for a design that was abandoned mid-build.** The app already exists in its current, working scroll-driven form (static output, `ScrollStateService`-driven lerps, no panels/hotspots). For "what to build next," use `docs/ROADMAP.md`'s Milestone 0–4 breakdown instead — it sequences the actual remaining work (repo hygiene → IP-asset removal → new asset pipeline → scroll-experience retarget on the new theme → content/testing/launch) and explains why that ordering matters (the original stall came from skipping the checkpoint where a risky slice gets validated before the next layer is built on top of it).

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
