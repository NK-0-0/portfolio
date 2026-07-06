# Project Vision — Signal Ghost (Original Sci-Fi Portfolio)

> Supersedes the archived fan-art concept (`docs/archive/LEGACY_VISION.md`). See `docs/ROADMAP.md` for why that concept was dropped and how the rework is sequenced. This document is the visual/content brief; `docs/architecture/ARCHITECTURE.md` and `CLAUDE.md` cover the technical implementation, which is **unchanged** by this rebrand — only the theme and assets change. **See `docs/vision/REQUIREMENTS.md`** for this brief turned into testable functional/non-functional acceptance criteria, web-verified feasibility notes, and open design-review flags (added 2026-07-05) — that document is the one `angular-dev`/`qa-engineer` should work from for "is this actually done."

## Concept & Mood

**Signal Ghost** — a rogue courier-AI navigating fragmented data-space. The visitor scrolls through the AI's own boot/mission log rather than a static resume.

Two alternate directions were considered and rejected for this v1:
- *Deep-Sky Cartographer* (mecha-pilot charting unmapped orbitals) — stronger character-design surface area than a solo dev wants to own (needs a cockpit/pilot silhouette to land).
- *Archive Custodian* (android maintaining a dying orbital library) — thematically pleasant but too slow/quiet a mood for a 30-second recruiter skim.

Signal Ghost wins because: it reuses most of the existing cyan/amber palette almost as-is, needs no character modeling (the single biggest asset-sourcing risk last time), and gives every section an obvious narrative beat — see the mapping below.

| Scroll section | Narrative beat |
|---|---|
| Hero | Boot Sequence |
| About | Identity Core |
| Experience | Mission Log |
| Skills | Loadout |
| Projects | Deployed Constructs |
| Contact | Uplink |

No third-party characters, franchises, or copyrighted designs are referenced anywhere in this concept. "Rogue-AI courier," "HUD," "cyberpunk" are generic genre tropes, not owned IP — reference images used during design are loose mood inspiration only; geometry, palettes, and iconography here are original.

## Palette

> **Design review flag — RESOLVED 2026-07-05 (owner decision: ACCEPTED).** The original 6-accent table (cyan/magenta/green/amber/coral + reserved red) was flagged by the `ui-ux-designer` agent as being in tension with this document's own "What NOT To Do" guidance to keep adjacent hue deltas modest. The owner accepted the proposed consolidation below. Full rationale recorded in `docs/vision/REQUIREMENTS.md`'s "Design Review Flags (Resolved)" section.

| Role | Hex | Notes |
|---|---|---|
| Background / void | `#05060a` | Deep space, not "dark UI" |
| Surface panel | `#0b0f1a` | Card backgrounds |
| **Identity axis** — Signal Cyan | `#00e5ff` | Primary. Every section's rim-light/fog target is drawn from this axis only (cyan↔magenta blends) — no other hue family owns a section wash |
| **Identity axis** — Signal Magenta | `#b464ff` | Secondary. Reframes the prior violet as "encrypted," not "mystical" |
| Confirm / terminal green (functional only) | `#39ff9d` | Demoted from a section-wide wash (previously Skills) to an **element-level accent only** — skill-proficiency bars, "online" status chips. Never a rim-light/fog target. |
| Live-status amber (functional only) | `#ffcc00` | Demoted from a section-wide wash (previously Projects) to an **element-level accent only** — the "status: live" badge/chip. Never a rim-light/fog target. |
| ~~Warm handshake — coral~~ | ~~`#ff6a5a`~~ | **Cut.** Previously used for Contact ("transmission received"); a third warm hue competed with amber and reserved red. Contact now uses a warm-shifted cyan instead (see beat sheet). |
| Danger (UI-only) | `#ff3b3b` | Reserved for real error states (form validation) only — never a section-wide wash |
| Text primary | `#e6ecf5` | |
| Text muted | `#6b7691` | |

**Net effect:** 6 section-owning accents → 2 (cyan + magenta, riding one axis) + 2 demoted-to-functional (green, amber, now UI-element-only) + 1 reserved (red) + 1 cut (coral). Every section's rim-light and fog color is now a blend point on the cyan→magenta axis — see the updated beat sheet below for the specific per-section values. Existing hex values in `scene-controller.component.ts` (`FOG_COLORS`) and `lighting.component.ts` (`MOON_COLORS`/`RIM_COLORS`) need retuning to these axis values for Skills, Projects, and Contact specifically (Hero, About, Experience were already on-axis and are unchanged).

## Materials & Lighting

Style target: **thin emissive accent lines on matte/metal bodies**, not full-surface glow (full-surface emissive + bloom on a dark scene blows out contrast on mobile OLED and fights text legibility — see "What Not To Do").

- **Focal prop** ("HUD-core" — replaces the mask): `MeshStandardMaterial`, `roughness: 0.15`, `metalness: 0.25`, near-black base `#14161d`, with a separate thin-geometry overlay (extruded line/strip meshes) carrying `emissive` cyan/magenta at `emissiveIntensity: 1.2–1.8`. Reads as "glass artifact with visible circuitry."
- **Floating props** (data-shard / drone): matte gunmetal body (`roughness 0.6–0.8`, `metalness 0.8`), accent emissive stripes only.
- **Key light**: single directional "beacon," cool blue-white `#bfe4ff`, intensity ~2.2, shadow-casting on the focal prop only (shadow-casting every light is the single most expensive per-object cost in this scene).
- **Fill**: keep `ngt-ambient-light` (0.15) + `ngt-hemisphere-light` (sky `#16223d`, ground `#0a0a0a`, 0.4) — unchanged, already does the job.
- **Rim (mood light)**: same architecture as today — one accent-colored directional, color-lerped per section from a `RIM_COLORS[section]` array at the existing `delta * 1.8` factor.
- **Fog**: keep `FogExp2`, density `0.036–0.042`.
- **Particles** ("signal static / data motes," replacing ambient dust): keep the exact current technique (`BufferGeometry` + `PointsMaterial` + `AdditiveBlending`, 100–140 points, size ~0.02–0.03) — near-zero-cost change, just recolor per-section by lerping `material.color` off `activeSection` (currently fixed-color and never changes).

## Typography

| Role | Font | Source | Note |
|---|---|---|---|
| Display (hero name) | **Chakra Petch** (600/700) | Google Fonts, SIL OFL | Geometric/technical without being the cliché Orbitron reach |
| Section headings | **Rajdhani** (600) | Google Fonts, SIL OFL | Condensed companion to Chakra Petch |
| Body/UI copy | **Inter** (400/500) | Google Fonts, SIL OFL | Deliberately un-themed — bios/job history stay boringly legible |
| Mono/code | **JetBrains Mono** | Already in use, Apache-2.0 | Keep as-is |

The current `Dela Gothic One` / `Shippori Mincho B1` / `Noto Sans JP` stack and the hard-coded kanji glyphs (`忍`/`我`/`道`/`技`/`創`/`繋` in `scroll-layout.component.ts`) were chosen for the ninja conceit. Kanji itself carries no copyright risk, but keeping JP-styled type after dropping the ninja theme undercuts "confidently original." **Drop the JP font stack and kanji decorations entirely** — replace kanji either with nothing (the existing numeric `01 / About`-style labels are already sufficient) or with a small set of invented geometric HUD glyphs used purely as background decoration, never as the primary label. This is a token swap in `src/styles.scss` (`--font-display`, `--font-heading`, `--font-ui`).

## Per-Section Scroll Beat Sheet

> **Design review flags (2026-07-05) — status:** two pacing notes from the `ui-ux-designer` agent, spec'd as testable ACs in `docs/vision/REQUIREMENTS.md` FR-2 — (1) the Experience→Skills `CAMERA_Y` jump (0.9→1.6) is the largest single delta in the sequence and should be manually verified under fast scroll-reversal; (2) About and Experience currently share an identical motion grammar (prop shrinks/fades one side, card slides the other) and should be differentiated by motion, not just fog hue, or they'll read as one long beat rather than two distinct ones. Both remain open manual-verification items (not blocking), tracked in `REQUIREMENTS.md` FR-2.
>
> **Palette consolidation — ACCEPTED 2026-07-05:** rim/fog colors below are updated to the 2-color (cyan↔magenta) identity axis. Hero, About, and Experience were already on-axis and are **unchanged**. Skills, Projects, and Contact previously used a section-owning green/amber/coral wash — those three rows are updated below; the green/amber hexes still exist but move to element-level UI accents only (proficiency bar, "live" chip), never the 3D rim/fog target.

Per-section state lives in module-level arrays (`FOG_COLORS`/`CAMERA_Y` in `scene-controller.component.ts`, `MOON_COLORS`/`RIM_COLORS` in `lighting.component.ts`, `SECTION_HUES` in `scroll-layout.component.ts`, plus inline per-section target blocks in `mask.component.ts` and `floating-models.component.ts`). All need new *values*; none need a new *shape* — this is the architecture's strength (see `docs/architecture/ARCHITECTURE.md`).

| Section | Eye lands on | Camera/light/fog change | Scroll distance | Arrays to retune |
|---|---|---|---|---|
| **0. Hero — Boot Sequence** | HUD-core prop beside hero name, gentle idle rock, scanline sweep on load | `CAMERA_Y[0]=1.5`, fog `#0a0e18`, rim cyan `#00e5ff` (axis anchor, unchanged) | Keep current `+=680px` scrub-pinned exit (already well-tuned) | Mostly reusable as-is |
| **1. About — Identity Core** | HUD-core shrinks to badge-size, right side; card slides in left | `CAMERA_Y[1]=1.2`, fog/rim `#24cbff` (cyan blended ~20% toward magenta — unchanged from original "blue-violet" intent, now pinned to an exact on-axis hex), moon blue-white | ~100vh | `FOG_COLORS[1]`, `MOON_COLORS[1]` |
| **2. Experience — Mission Log** | New data-shard prop fades in left (reuses old book's coords), card enters right | `CAMERA_Y[2]=0.9`, fog/rim `#b464ff` (full Signal Magenta — axis peak, unchanged) | ~100vh | `floating-models.component.ts` book-target block (position reusable, recolor emissive) |
| **3. Skills — Loadout** | New drone/module prop parked right, spinning | `CAMERA_Y[3]=1.6`, fog/rim `#1bd2ff` (cyan blended ~15% toward magenta — pulled back from the axis peak toward the "operational/practical" end). Terminal green `#39ff9d` still appears, but only on skill-proficiency-bar UI elements, not the 3D fog/rim. | ~100vh | `MOON_COLORS[3]`/`RIM_COLORS[3]`, `SECTION_HUES[3]` |
| **4. Projects — Deployed Constructs** | Same drone prop, now left, "live" badge accent | `CAMERA_Y[4]=1.1`, fog/rim `#9977ff` (cyan blended ~85% toward magenta — near the Experience peak, reads as "active/deployed" while staying on-axis). Amber `#ffcc00` still appears, but only on the "status: live" badge/chip, not the 3D fog/rim. | ~100vh | Reuse existing left/right toggle logic verbatim |
| **5. Contact — Uplink** | CTA (email/socials); HUD-core stays ghosted or pulses once | `CAMERA_Y[5]=0.7`, fog/rim `#00ffcc` (cyan nudged toward teal — a warm-shifted cyan variant, not a new hue family, replacing the cut coral `#ff6a5a`), relabeled "signal received" | ~90vh (shorter — a landing beat, not a buildup) | `FOG_COLORS[5]`/`RIM_COLORS[5]` — new hex, retune required (was coral) |

## Original 3D Prop Concepts

| Old prop (removed, M1.1) | New prop | Build method | Cost |
|---|---|---|---|
| Legacy focal GLB (2.8MB) | HUD-core / visor shard | Hand-modeled low-poly GLB — curved lens/visor fragment, ≤3k tris, vertex color or one 512px emissive map | Low-medium |
| Legacy tablet GLB (2.5MB) | Data shard / log tablet | **Fully procedural** — `RoundedBoxGeometry`/beveled `BoxGeometry` + a `CanvasTexture` showing a fake scrolling readout | Lowest — zero GLB, zero license risk |
| Legacy floating GLB (1.6MB) | Drone / signal module | Procedural composition — `IcosahedronGeometry` core + thin `BoxGeometry` struts, assembled directly in the angular-three template | Low — no asset pipeline, instant iteration |

**Recommendation: ship all three as procedural primitives for v1, not custom GLBs.** Ad-hoc asset sourcing was one of the diagnosed failure modes (`docs/ROADMAP.md` Finding 5–6); committing to hand-modeling three new props before relaunch reintroduces that exact risk. Procedural props also let `ModelLoadingService.TOTAL_ASSETS` potentially drop to 0 GLBs, removing a whole class of loading-screen/timeout bugs. Hand-modeled GLB upgrades are a v2 stretch goal, not a v1 requirement.

## Motion & Performance Guardrails

- **ScrollTrigger scrub**: stay in 0.5–1.5. Hero's current `scrub: 1.2` is well-tuned — keep it. Above ~2 feels disconnected from the scrollbar; below 0.3 jitters on trackpad.
- **Entrance eases**: keep `power3.out`, `duration: 0.6–0.85s`. Don't extend past ~1s — six sections of slow reveal is a lot of dead time for a 30-second recruiter skim.
- **Lenis lerp**: keep the current `0.075` — don't drop below 0.05 (mushy) or raise above 0.12 (laggy on trackpads).
- **`injectBeforeRender` lerp factors**: keep `delta * 1.8` (fog/light) and `delta * 2.5` (camera/opacity) — already well-calibrated. Below `delta * 1.0` is visibly slow catch-up; above `delta * 4` loses the soft-lerp feel.
- **GLB payload budget**: current total is 15.3MB across 4 GLBs — already over budget regardless of theme. If any GLBs are kept: ≤500KB per prop, ≤1.2MB total, Draco-compressed, ≤5k tris, ≤1024px texture. Following the procedural-first recommendation above, v1 payload can be ~0MB.
- **Draw calls**: keep the scene lean (currently 4–5 draw calls). Any new particle/swarm effect must be a single `Points`/`InstancedMesh`, never per-particle meshes.
- **Reduced motion**: **not currently implemented anywhere in the codebase** — this is new work, not a tweak. Read `window.matchMedia('(prefers-reduced-motion: reduce)')` on load **and attach a `'change'` listener** so a mid-session OS preference toggle is honored without a reload (verified 2026-07-05: a one-time read alone under-specifies current best practice — see `docs/vision/REQUIREMENTS.md` FR-8). When true: skip Lenis init (native scroll), keep color/fade transitions but drop scroll-tied parallax, skip idle float/rotation on props (set resting transform once), and use a **fixed 200ms** discrete cross-fade for section color/fog transitions instead of the continuous per-frame lerp — confirmed by the project owner 2026-07-05 as a firm spec value, not an approximation. "Snap" does not mean instant (0ms reads as a jarring flash, not "reduced"). See `docs/vision/REQUIREMENTS.md` FR-8 for the full testable spec, including a scene-stays-mounted clarification and an IntersectionObserver reveal-class trap.
- **Mobile/no-WebGL fallback**: `FallbackComponent` needs the same rebrand pass as the 3D scene. Palette/fonts flow through automatically via CSS custom properties; check for old-theme-specific copy. The `innerWidth < 768 || 'ontouchstart' in window` threshold routes many touch-laptops/tablets here too — it's a primary experience for a meaningful share of visitors, not an edge case.

## What NOT To Do

> **Owner steering note (2026-07-05):** this section is not a ceiling on ambition. The owner's explicit framing when confirming the automated-testing scope (`docs/vision/REQUIREMENTS.md` NFR-9): *"3D animations are quite tricky to work with so we can keep it original and work with animations, cool scroll effects & other amazing effects so that [we do] not overcomplicate the design of the portfolio."* Read as both/and, not a walk-back: creative, impressive scroll/3D motion work is explicitly encouraged — the guardrails below exist so that ambition doesn't tip into a first-time visitor needing to "figure out" an interaction. Every new effect should still clear the bar this list already sets (prefer fewer, well-executed beats over more, half-finished ones) — that bar isn't changing, it's being reaffirmed as the project gets more ambitious with motion/3D work, not loosened or tightened.

- **Don't resurrect hover/raycast hotspots or bloom/post-processing.** These are the orphaned designs from the previous build (`docs/ROADMAP.md` Finding 2–3) — they were abandoned mid-build, not merely unfinished. `UnrealBloomPass` in particular is a common mobile-perf killer; this project already tried it once and it didn't survive contact with reality.
- **Don't let per-section hue swings make it feel like six different apps.** A recruiter scrolling in 20 seconds should read one coherent identity. Keep hue deltas between adjacent sections modest.
- **Don't extend scroll-pinning past the hero.** Pinning every section punishes the "skim in 30 seconds" recruiter use case — the single most common self-inflicted wound in scroll-driven portfolios.
- **Don't commission more than 2–3 unique props.** The current architecture already reuses the drone prop across both Skills and Projects — keep that discipline.
- **Don't go full-surface emissive.** Emissive lives on thin accent lines only (see Materials & Lighting).
- **Don't make invented glyphs load-bearing.** If adding an invented HUD-glyph decoration system, keep it decorative only — the real section label stays the legible wayfinding text.
- **Don't source "sci-fi HUD" asset packs from marketplaces as a shortcut without checking the license.** That's how the project ended up with mandatory-attribution fan-art assets in the first place. If any external asset is used, it must be CC0/public-domain-clear with the license recorded in `docs/ASSET_CREDITS.md` (see `docs/ROADMAP.md` Milestone 2, issue 2.5) — the procedural-first approach above avoids needing this for v1 entirely.

## IP Posture

No third-party character IP. Any external asset (HDRI, particle texture, font) must be CC0, SIL OFL, Apache-2.0, or otherwise cleared for commercial/portfolio use with no attribution restriction that would require a legal-caveat footer — and must be logged in `docs/ASSET_CREDITS.md` once that file exists (`docs/ROADMAP.md` Milestone 2.5). Chakra Petch, Rajdhani, Inter, and JetBrains Mono are all SIL OFL/Apache-2.0 — free for commercial use, no attribution required.
