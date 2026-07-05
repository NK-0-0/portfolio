# Asset Pipeline — 3D Model Sourcing and Optimisation

> **Superseded for v1 — corrected 2026-07-05.** This entire document describes sourcing a licensed fan-model of a copyrighted character (Kakashi Hatake) from Sketchfab. That workflow is exactly the pattern that put the project in an IP-risk position in the first place (`docs/ROADMAP.md` Finding 5–6, 9) and directly contradicts `docs/vision/VISION.md`'s IP Posture (no third-party character IP; CC0/OFL/Apache-only assets) and its explicit recommendation to ship all three new props (HUD-core, data-shard, drone) as **procedural Three.js geometry with zero GLBs for v1**. Do not use Steps 1–2 below (Sketchfab sourcing, hotspot mesh-name mapping) for the Signal Ghost rebuild. **Steps 3 (gltf-transform optimisation) and the HDRI/font sourcing notes remain valid reference** for the v2-stretch scenario where a hand-modeled GLB prop or a new HDRI is added — see `docs/vision/REQUIREMENTS.md` for the current, testable asset budget. The `gltf-transform` CLI version pinned below (3.2.1) is stale — latest as of this correction is 4.4.1 (verified via `npm view @gltf-transform/cli version`); don't hard-pin a version, use `@latest` and record what you actually used in `docs/ASSET_CREDITS.md`.

## Scratch-asset staging convention (current)

Raw, unoptimized sourced assets (Sketchfab/PolyHaven downloads, Blender exports, hash-named files) must be staged in a gitignored `assets-staging/` directory at the project root — **download raw/unoptimized sourced assets here; never commit this directory; only commit the optimized output that lands in `public/models/`.** `assets-staging/` is listed in `.gitignore`.

This replaces the old misspelled `assests/` folder, which was 9 raw/duplicate files (~24MB) accidentally committed to git with no staging discipline — removed in Milestone 0.4. Run the optimization pipeline (below) from `assets-staging/` and copy only the final GLB into `public/models/<category>/`.

---

## The Model Problem **[historical — described the archived character-sourcing workflow]**

This is the **highest-risk item in the project.** A browser-delivered 3D model must be:

1. Under ~5MB (ideally 2–3MB) — most Sketchfab downloads are 20–100MB unoptimised
2. In GLB format (binary glTF 2.0) — the web-native 3D format
3. PBR-textured (Physically Based Rendering) for consistent lighting
4. Rigged or at minimum in a good idle pose for hotspot identification
5. Licensed for fan/non-commercial use

---

## Step 1: Find the Model on Sketchfab

### Search strategy
1. Go to [sketchfab.com](https://sketchfab.com)
2. Search: `kakashi hatake` — filter by **Downloadable**, **Free**
3. Look for models tagged with `CC Attribution`, `CC Attribution-NonCommercial`, or `Free Download`
4. Prefer models with:
   - GLB/GLTF listed as available format
   - Polygon count shown: target under 80k triangles for web
   - A rigged pose (T-pose or a natural stance)

### Candidate model checklist before downloading
- [ ] Licence allows non-commercial fan portfolios (read the model's licence tab)
- [ ] Textures are embedded or downloadable alongside
- [ ] Visible body parts match the hotspot plan (face, belt area, hand, back)
- [ ] Polygon count is reasonable (< 100k tris)

> **Note:** If no suitable free model exists, consider Sketchfab's "Buy" section for affordable ($5–$20) licensed models, or commission from a freelancer on ArtStation.

---

## Step 2: Download and Inspect

Download the GLB (or GLTF + textures). Open it for inspection before any optimisation:

```bash
# gltf-transform is a local devDependency (added in Milestone 0.5) — no global install.
# Installed here as @gltf-transform/cli@4.4.1; don't hard-pin in docs, use @latest and
# record the actual version (per REQUIREMENTS.md NFR-8):
npm install -D @gltf-transform/cli@latest

# Inspect a model (run via npx so it resolves the local install)
npx gltf-transform inspect assets-staging/model-raw.glb
```

This prints:
- File size
- Mesh count, primitive count, triangle count
- Texture dimensions and formats
- Extension usage

Also open in [gltf.report](https://gltf.report) (browser tool) to visually inspect mesh hierarchy and identify which mesh names correspond to which body parts. **Write down the mesh names** — you'll use them in the `KakashiHotspotDirective` to map named meshes to section IDs.

Example mesh name mapping:
```typescript
const HOTSPOT_MAP: Record<string, SectionId> = {
  'Kakashi_Head':       'about',
  'Kakashi_Book':       'experience',
  'Kakashi_Belt_Kunai': 'skills',
  'Kakashi_ANBU_Mask':  'projects',
  'Kakashi_Headband':   'contact',
};
```

---

## Step 3: Optimise with gltf-transform

Run the full optimisation pipeline:

Use the `optimize:models` npm script (added in Milestone 0.5), which wraps the full
Draco geometry + KTX2 texture pipeline. Pass input and output after `--`:

```bash
# Draco geometry compression + KTX2 texture compression + 1024px texture cap
npm run optimize:models -- assets-staging/model-raw.glb public/models/<category>/<name>.glb

# The script expands to:
#   gltf-transform optimize <in> <out> --compress draco --texture-compress ktx2 --texture-size 1024
# NOTE (verified against @gltf-transform/cli@4.4.1): the flag is --texture-size, not the
# older --texture-resize this doc used to show.

# Inspect result
npx gltf-transform inspect public/models/<category>/<name>.glb
```

> **KTX2 needs an external binary.** `--texture-compress ktx2` shells out to the KhronosGroup
> KTX-Software `ktx` CLI, which must be on your PATH (`command -v ktx`). If it isn't installed,
> the run fails at the `uastc`/`etc1s` step. Either install KTX-Software, or use the documented
> fallback `--texture-compress webp` (no external binary; still ~95%+ smaller than raw PNG/JPEG
> textures — a smoke test on `anbu_kakashi_mask.glb` went 2.91 MB → 98 KB via the webp path).

**Target output:**
- Geometry: Draco-compressed (saves 50–80% on geometry data)
- Textures: KTX2 / Basis Universal (GPU-native, decompresses on GPU, not RAM)
- Texture resolution: 1024×1024 max per texture (2048 if quality demands it)
- Final file size: **under 3MB**

> If KTX2 gives issues on first run, try `--texture-compress webp` as a fallback — still much smaller than PNG/JPEG embedded textures.

---

## Step 4: Place in Project

```bash
# Copy optimised model into Angular assets
cp kakashi.glb portfolio/public/models/kakashi/kakashi.glb
```

Reference in code via the `public/` path (Angular copies `public/` to build root):

```typescript
// In KakashiComponent
readonly modelUrl = '/models/kakashi/kakashi.glb';
```

Do **not** place in `src/assets/` for large binaries — use `public/` so they're not processed by the Angular build pipeline, just copied.

---

## Step 5: Lazy Load the Model

GLBs are fetched by Three.js's `GLTFLoader` at runtime, not bundled into JS. They are cached by the browser after first load. Configure caching headers if deploying to a custom server; GitHub Pages serves with its own cache policy.

In the Angular component, show a loading screen until the model is ready:

```typescript
// kakashi.component.ts
readonly loaded = signal(false);

onModelLoaded() {
  this.loaded.set(true);
}
```

The loader component (`src/app/ui/loader/`) displays a styled loading animation until `loaded()` is true.

---

## Supplementary Assets

| Asset | Purpose | Source |
|-------|---------|--------|
| Signal-static particle texture | Environment particles | Any simple PNG, make yourself — or keep the current procedural `BufferGeometry`/`PointsMaterial` approach (`VISION.md` Materials & Lighting), which needs no texture asset at all |
| HDRI environment map | Image-based lighting | [polyhaven.com](https://polyhaven.com) — free, CC0 |
| Font files | UI typography | Google Fonts CDN or self-host — Chakra Petch / Rajdhani / Inter (SIL OFL 1.1) / JetBrains Mono (SIL OFL 1.1 font, Apache-2.0 source), all verified still on Google Fonts under those licenses as of 2026-07-05 |
| Favicon | Browser tab | Original design only — do not derive from any third-party character IP (see `VISION.md` IP Posture) |

### HDRI for lighting
Download a low-res HDRI from Poly Haven (512px is enough for reflections):
```bash
# Example: night sky HDRI
# polyhaven.com/hdris → search "night" → download 512px EXR/HDR
# Convert to KTX2 if needed, or use as-is (Three.js accepts .hdr)
```

Place at `public/env/night.hdr`.

---

## Texture Baking (Advanced — Optional)

If the downloaded model has separate mesh bakes (normal map, AO, roughness), ensure they are assigned to the correct PBR slots in the GLB. Check with gltf.report under the "Materials" tab. Three.js reads these automatically.

If textures are not PBR (e.g., just a diffuse colour), the model will look flat under Three.js lighting. In that case, use Blender to re-export with better material setup.

---

## Blender Workflow (if model needs rework)

```
1. Import original (FBX or OBJ or GLTF) into Blender
2. Assign PBR materials (Principled BSDF)
3. Set a clean standing pose if model is in T-pose
4. File → Export → glTF 2.0
   - Format: GLB
   - Include: Meshes, Materials, Textures (embed)
   - Compression: Draco (Blender 4.x supports this natively)
5. Run gltf-transform optimise pass afterwards for KTX2 textures
```

---

## File Size Budget

| Asset | Budget |
|-------|--------|
| `kakashi.glb` | < 3 MB |
| `night.hdr` | < 512 KB |
| Total JS bundle (initial) | < 500 KB |
| Three.js + NGT (lazy chunk) | < 2 MB |
| **Total page weight (first load)** | **< 6 MB** |

### Automated enforcement (Milestone 0.5/0.7)

The **per-GLB budget (3 MB)** is enforced in CI, not just documented: `npm run check:glb-budget`
(`scripts/check-glb-budget.mjs`) fails the build if any `public/models/**/*.glb` exceeds 3 MB.
It runs as a step in `.github/workflows/ci.yml`. The orphaned `public/models/kakashi/kakashi.glb`
(8.35 MB) is temporarily exempted in that script — remove its exception entry the moment the
file is deleted in Milestone 1.1 so the gate stays honest.

The JS-bundle side is covered separately by `angular.json`'s existing 2 MB/4 MB budgets. Inspect
bundle composition during development with:
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/portfolio/browser/stats.json
```
