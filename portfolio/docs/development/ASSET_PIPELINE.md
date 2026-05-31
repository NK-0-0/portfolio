# Asset Pipeline — 3D Model Sourcing and Optimisation

## The Model Problem

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
# Install gltf-transform CLI globally
npm install -g @gltf-transform/cli

# Inspect the model
gltf-transform inspect kakashi-original.glb
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

```bash
# Install KTX2 / Draco support
npm install -g @gltf-transform/cli

# Full pipeline: Draco geometry compression + KTX2 texture compression
gltf-transform optimize kakashi-original.glb kakashi.glb \
  --compress draco \
  --texture-compress ktx2 \
  --texture-resize 1024

# Inspect result
gltf-transform inspect kakashi.glb
```

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
| Leaf particle texture | Environment particles | Any simple PNG, make yourself |
| HDRI environment map | Image-based lighting | [polyhaven.com](https://polyhaven.com) — free, CC0 |
| Font files | UI typography | Google Fonts CDN or self-host |
| Favicon | Browser tab | Export from the Sharingan design |

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

Monitor this during development with:
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/portfolio/browser/stats.json
```
