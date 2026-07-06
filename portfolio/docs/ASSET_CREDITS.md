# Asset Credits

Single source of truth for every third-party or sourced asset the portfolio ships or references.
One row per asset. The footer rewrite (Milestone 1.2) pulls its attribution copy from this file — keep
the **Attribution required** column accurate, because that column decides what the footer legally must
say versus what is courtesy-only.

- **License policy** (`docs/vision/VISION.md` IP Posture): every external asset must be CC0, SIL OFL,
  Apache-2.0, or otherwise cleared for commercial/portfolio use with no mandatory-attribution footer.
- **Status legend:** `live` = referenced by the app today · `landed` = committed but not yet wired in ·
  `pending removal` = still present but slated for deletion in a named milestone.

Last updated: 2026-07-06 · Milestone 1.1–1.3 (fan-IP asset removal).

---

## 3D & Environment assets (`public/`)

| Asset | File | Source | License | Attribution required | Where used | Status |
|---|---|---|---|---|---|---|
| Night-sky HDRI (environment map / IBL) | `public/env/night-sky.hdr` | Poly Haven — "Qwantani Night (Pure Sky)" <https://polyhaven.com/a/qwantani_night_puresky> | **CC0** (public domain) | **No** (CC0) | Not yet — env map for Signal Ghost lighting; **wire-up deferred to Milestone 3** (see note below) | landed |
| HUD-core focal prop | — (procedural, no GLB) | Original procedural Three.js geometry (Milestone 2.2) | n/a (original) | No | Focal 3D prop, all sections | live |
| Data-shard / drone floating props | — (procedural, no GLB) | Original procedural Three.js geometry (Milestone 2.3) | n/a (original) | No | Experience / Skills / Projects | live |

### Removed — legacy fan-IP GLBs (Milestone 1.1) — historical record

These GLBs were the original third-party fan-IP props. They were **deleted from `public/` in
Milestone 1.1** (along with their orphaned component source and the `check-glb-budget.mjs` exemption);
the live scene graph never referenced them by then (the focal + floating props are now procedural). Rows
are retained as a provenance/history trail — the files are no longer on disk.

| Asset | File (deleted) | Source | License | Attribution required | Where used | Status |
|---|---|---|---|---|---|---|
| ANBU mask GLB | `public/models/mask/anbu_kakashi_mask.glb` | Kakashi Hatake fan-model (Sketchfab-era) | Fan-art / **third-party character IP** (© Masashi Kishimoto / Studio Pierrot) | Yes (fan-use notice) | Replaced by procedural HUD-core | removed (M1.1) — historical record |
| Icha Icha book GLB | `public/models/book/icha_icha.glb` | Kakashi Hatake fan-model | Fan-art / third-party character IP | Yes | Replaced by procedural data-shard | removed (M1.1) — historical record |
| Kunai GLB | `public/models/kunai/kunai_do_minato_namikaze.glb` | Kakashi Hatake fan-model | Fan-art / third-party character IP | Yes | Replaced by procedural drone | removed (M1.1) — historical record |
| Full-body Kakashi GLB | `public/models/kakashi/kakashi.glb` | Kakashi Hatake fan-model | Fan-art / third-party character IP | Yes | Unused by live scene graph (was budget-exempted in `scripts/check-glb-budget.mjs`) | removed (M1.1) — historical record |

---

## Fonts

No fonts are self-hosted — all are loaded from the Google Fonts CDN, so there is no local font file in
`public/`. They are still assets requiring a credits entry per `docs/vision/REQUIREMENTS.md` NFR-7.

### Target set — Signal Ghost (per VISION.md typography + NFR-7)

| Font | Role | Source | License | Attribution required | Status |
|---|---|---|---|---|---|
| Chakra Petch | Display (hero name) | Google Fonts CDN | SIL OFL 1.1 | No | not yet wired (Milestone 1 typography swap) |
| Rajdhani | Section headings | Google Fonts CDN | SIL OFL 1.1 | No | not yet wired (Milestone 1 typography swap) |
| Inter | Body / UI copy | Google Fonts CDN | SIL OFL 1.1 | No | not yet wired (Milestone 1 typography swap) |
| JetBrains Mono | Mono / code / tag labels | Google Fonts CDN | SIL OFL 1.1 (font) / Apache-2.0 (source) | No | **live** — kept across the rebrand |

### Pending removal — legacy JP font stack (Milestone 1 typography swap)

Still referenced live in `src/index.html` and `src/styles.scss` (`--font-display`/`--font-heading`/
`--font-ui`) as of 2026-07-06. All OFL — no license risk — but theme-mismatched and slated for the token
swap to the target set above.

| Font | Role | Source | License | Attribution required | Status |
|---|---|---|---|---|---|
| Dela Gothic One | Display (`--font-display`) | Google Fonts CDN | SIL OFL 1.1 | No | live — pending removal (M1 typography swap) |
| Shippori Mincho B1 | Headings (`--font-heading`) | Google Fonts CDN | SIL OFL 1.1 | No | live — pending removal (M1 typography swap) |
| Noto Sans JP | Body (`--font-ui`) | Google Fonts CDN | SIL OFL 1.1 | No | live — pending removal (M1 typography swap) |

---

## Site icons

| Asset | File | Source | License | Attribution required | Status |
|---|---|---|---|---|---|
| Favicon | `public/favicon.ico` | Unverified — 15 KB, matches the Angular CLI default (Angular logo) | Unclear (likely Angular trademark) | — | live — **flag:** replace with an original design per VISION.md IP Posture (Milestone 1) |

---

## Notes

- **HDRI wire-up is deferred to Milestone 3, by design.** The file is committed to `public/env/` but is
  *not* referenced by any code. The live scene graph currently has **no** HDRI / environment map at all —
  lighting is done entirely with directional + ambient + hemisphere lights and `FogExp2` (verified 2026-07-06:
  no `RGBELoader` / `.hdr` / `envMap` / PMREM usage anywhere in `src/`). Adding the env map is therefore new
  lighting/beat-sheet work (PMREM generation + per-section fog/rim retarget), which is Milestone 3's scope —
  not a drop-in file swap. See the `milestone-2-environment` commit message for full reasoning.
- **HDRI optimization:** downloaded 1k `.hdr` from Poly Haven (1,389,258 B), downsampled to 512×256
  equirectangular with `oiiotool` (OpenImageIO **3.1.12.1**) → **355.5 KB**, under the `< 512 KB` HDRI budget
  documented in `docs/development/ASSET_PIPELINE.md`. Raw download was staged outside the repo (never
  committed), per the staging-discipline rule in that doc. No `gltf-transform` run was needed (no GLB sourced).
- **Particle system needs no texture asset.** `particles.component.ts` is an untextured
  `BufferGeometry` + `PointsMaterial` (AdditiveBlending, colored points) — REQUIREMENTS.md FR-4 — so there is
  nothing to source or credit for particles.
- **CC0 courtesy credit:** CC0 legally requires no attribution, but Poly Haven appreciates a credit. If a
  general "assets" credit line is ever added, "Night-sky HDRI by Greg Zaal & Jarod Guest (Poly Haven, CC0)"
  is accurate — but it is optional, not a legal-caveat footer requirement.
</content>
</invoke>
