# Asset Credits

Single source of truth for every third-party asset the portfolio ships or references.
One row per asset. Keep the **Attribution required** column accurate — it decides what the
site legally must say versus what is courtesy-only.

**License policy:** every external asset must be CC0, SIL OFL, Apache-2.0, MIT, or otherwise
cleared for commercial/portfolio use with no mandatory-attribution notice.

Last updated: 2026-08-23 — pixel-world port.

---

## Artwork

The entire world is **original pixel art**, authored as character maps in
`src/app/world/sprites.ts` and drawn procedurally by `world-renderer.ts`.
There are no image files, no 3D models, and no third-party artwork of any kind.

| Asset | Source | License | Attribution required |
|---|---|---|---|
| Avatar, dog, scenery, terrain sprites | Original — `src/app/world/sprites.ts` | n/a (original) | No |
| Day/dusk/night palettes | Original — `src/app/world/palette.ts` | n/a (original) | No |

## Fonts (Google Fonts, loaded from `fonts.googleapis.com`)

| Font | Use | License | Attribution required |
|---|---|---|---|
| [Silkscreen](https://fonts.google.com/specimen/Silkscreen) | Pixel labels, HUD, section numbers | SIL OFL 1.1 | No |
| [Newsreader](https://fonts.google.com/specimen/Newsreader) | Editorial headings | SIL OFL 1.1 | No |
| [Familjen Grotesk](https://fonts.google.com/specimen/Familjen+Grotesk) | Body and UI copy | SIL OFL 1.1 | No |

## Icons

| Asset | Source | License | Attribution required |
|---|---|---|---|
| Toolbelt technology icons | [Devicon](https://github.com/devicons/devicon) via jsDelivr CDN | MIT | No |

Devicon icons are hot-linked from `cdn.jsdelivr.net`, so they are a **runtime third-party
dependency**, not a shipped asset. `ToolbeltPanelComponent` renders a text fallback
(`TS`, `C#`, `PG`…) for any icon that fails to load, so a CDN outage degrades rather than breaks.
Vendoring them into `public/` would remove the dependency at the cost of tracking updates by hand.

Trademark note: these icons depict third-party technology logos. Nominative use to indicate
"tools I work with" is standard practice; the underlying marks belong to their owners.

## Removed

The previous Three.js portfolio shipped a Poly Haven CC0 HDRI (`public/env/night-sky.hdr`)
and, earlier, third-party fan-IP GLB props. All were deleted in the pixel-world port —
the site now carries no binary assets at all.
