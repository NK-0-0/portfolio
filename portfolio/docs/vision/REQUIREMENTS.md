# Functional & Non-Functional Requirements — Signal Ghost Portfolio

> Derived from `docs/vision/VISION.md` (the visual/content brief) on 2026-07-05. This document turns that brief into testable acceptance criteria the `qa-engineer` agent can verify mechanically, per this repo's issue-template convention (Small <2h / Medium half day / Large 1+ days / Unknown). It does not replace `VISION.md` — read that first for the *why* and mood; this is the *what, exactly, counts as done*.
>
> Every item below was checked against one of: existing repo source (`src/`), existing config (`angular.json`, `lighthouserc.json`, `package.json`), or a live web check dated 2026-07-05 (see "Feasibility Verification Log" at the bottom).
>
> Design input from the `ui-ux-designer` agent (consulted 2026-07-05) is folded inline where it sharpens a requirement, and was flagged separately under "Design Review Flags" where it proposed changing an already-written creative decision (palette) — that flag has since been resolved by the project owner (see that section).
>
> **Update 2026-07-05 (owner sign-off):** all 5 items originally listed under "Open Questions" have been resolved by the project owner and applied throughout this document — see "Resolutions" (replacing the former "Open Questions" section) for the decisions and where each was applied.

---

## Functional Requirements

### FR-1 — Continuous scroll-driven navigation (no router, no click-panels)

**Context:** The entire experience is one scrollable page; `ScrollStateService.activeSection` (0–5) and `scrollProgress` are the single source of truth every visual reads from (`docs/architecture/ARCHITECTURE.md`).

**Acceptance criteria:**
- Given the page loads, when the user scrolls without interacting with any button, then `ScrollStateService.activeSection` updates to reflect the six sections (hero=0 → contact=5) in document order and `scrollProgress` updates continuously within the active section.
- Given the user scrolls past a section boundary, when `activeSection` changes, then every 3D-driven visual (camera Y, fog color, rim-light color, prop transforms) begins lerping toward that section's target value within the same animation frame budget already in place (`delta * 1.8` fog/light, `delta * 2.5` camera/opacity — see NFR-4).
- There is no Angular Router in the bundle and no hash-based routing added as a side effect of this work.
- Given a user clicks a skip-nav button (`button[data-section="<id>"]`), when the click fires, then the page scrolls to that section without requiring `activeSection` to change via native scroll first (this is already covered by `e2e/portfolio.spec.ts`'s "Scroll navigation via accessible skip-nav" suite — treat that suite as the AC for this line item).

**Out of scope:** Deep-linking via URL hash — **now in scope, see FR-10** (owner decision 2026-07-05; previously deferred here).

**Dependencies:** None — this is the existing, working architecture; no change required unless a regression is found. FR-10 builds on top of this without changing it.

**Size:** N/A (verification only, not new build) — Small if a regression fix is needed.

---

### FR-2 — Per-section camera/fog/light beat sheet

**Context:** VISION.md's beat-sheet table (Hero→Contact) assigns each section a `CAMERA_Y`, fog color, rim-light color, and approximate scroll distance. The `ui-ux-designer` flagged two pacing risks worth pinning down as ACs rather than leaving as prose.

**Acceptance criteria (per VISION.md's table, plus two amendments below):**
- Given the active section changes, when the new section's target values are read, then `CAMERA_Y`, fog color, and rim color each lerp to the value specified in VISION.md's beat-sheet table for that section (Hero 1.5 / About 1.2 / Experience 0.9 / Skills 1.6 / Projects 1.1 / Contact 0.7).
- **Amendment 1 (design-review finding — Skills camera lurch):** the Experience→Skills transition (`CAMERA_Y` 0.9→1.6) is the single largest delta in the sequence and sits at the point in a scroll where a recruiter is moving fastest. AC: this specific transition must be manually tested under a **fast scroll-reversal** (scroll down past Skills, then rapidly scroll back up through it) at the current lerp factor and confirmed not to visibly overshoot/oscillate before this section is considered done. If it does, either soften the delta or treat the ascent as an intentional beat ("ascend to survey loadout") — owner's call, not prescribed here.
- **Amendment 2 (design-review finding — About/Experience motion monotony):** About and Experience currently share the same motion grammar (prop shrinks/fades one side, content card slides in the other side, only fog hue differs). AC: at least one of the two sections' prop motion must be visibly distinct from the other (e.g. About = prop docks to a fixed badge position; Experience = prop's surface animates a scrolling readout via its `CanvasTexture`) — a hue-only difference does not satisfy this criterion.
- The drone/module prop is reused, repositioned and recolored, across both Skills (right side, green) and Projects (left side, amber) per VISION.md — this is confirmed as an intentional design choice, not a defect, provided HUD-core and data-shard remain visually distinct from the drone and from each other (see FR-3).

**Out of scope:** Any *new* per-section beat not in VISION.md's table (e.g., a 7th section).

**Dependencies:** FR-3 (prop distinctness), NFR-4 (motion timing guardrails).

**Size:** Medium (retuning constants + manual scroll-reversal QA pass).

---

### FR-3 — Procedural 3D prop behavior (HUD-core, data-shard, drone)

**Context:** VISION.md recommends all three new props ship as procedural Three.js geometry (zero GLBs) for v1, replacing the three legacy fan-IP GLB props (removed in Milestone 1.1).

**Acceptance criteria:**
- HUD-core (focal prop, replaces the mask): renders as a `MeshStandardMaterial` body (`roughness 0.15`, `metalness 0.25`, base color `#14161d`) plus a separate thin-geometry overlay mesh carrying `emissive` cyan/magenta at `emissiveIntensity` between 1.2 and 1.8. No full-surface emissive material is used anywhere on this prop (verifiable by inspecting material assignments — a QA check, not a subjective read).
- Data-shard (Experience prop): built from `RoundedBoxGeometry` or beveled `BoxGeometry` with a `CanvasTexture` rendering a readout; zero GLB load for this prop specifically.
- Drone/module (Skills/Projects prop): built from `IcosahedronGeometry` core + `BoxGeometry` struts, assembled directly in the angular-three template; zero GLB load for this prop specifically.
- Given `ModelLoadingService.TOTAL_ASSETS` is read at build time, when all three props are procedural, then `TOTAL_ASSETS` is updated to reflect the actual GLB count (0, if no GLB prop is kept) — a stale count causes the loader to hang or dismiss early per `CLAUDE.md`'s existing warning.
- No more than 3 unique props exist in the live scene graph at once (VISION.md "What NOT To Do").

**Out of scope:** Hand-modeled GLB upgrades for any prop — explicitly a v2 stretch goal (VISION.md), not required for this to be considered done.

**Dependencies:** Milestone 1 (old GLB removal) must land its replacement before deletion, per `docs/ROADMAP.md`'s sequencing note.

**Size:** Large (per `docs/ROADMAP.md` 2.2/2.3 estimates).

---

### FR-4 — Ambient particle field

**Context:** VISION.md keeps the current particle technique but adds per-section recoloring, which is new behavior (today it's fixed-color).

**Acceptance criteria:**
- Particle system remains a single `BufferGeometry` + `PointsMaterial` (`AdditiveBlending`) instance — never per-particle `Mesh` objects (draw-call budget, see NFR-2).
- Point count stays within 100–140; size within 0.02–0.03.
- Given the active section changes, when the section's particle color target is read, then `material.color` lerps toward that section's color instead of staying fixed (this is new behavior relative to today's shipped code — verify the "recolors per section" behavior specifically, not just "particles render").

**Out of scope:** Particle count/behavior changes beyond recoloring (e.g., particle density changes per section) — not specified in VISION.md.

**Dependencies:** None.

**Size:** Small.

---

### FR-5 — Section content presence (About/Experience/Skills/Projects/Contact)

**Context:** VISION.md assigns each section a narrative beat label (Identity Core, Mission Log, Loadout, Deployed Constructs, Uplink) but the actual bio/job-history/project copy is content work tracked separately (`docs/ROADMAP.md` Milestone 4.1).

**Acceptance criteria:**
- Each of the 5 non-hero sections renders its existing structural content (card, heading, body copy placeholders or real copy) under the new palette/typography tokens with no leftover JP-font-stack or kanji-glyph rendering (see FR-6).
- This requirement is satisfied by the *rebrand pass* (palette/type/motion) landing correctly on existing content structure — it does **not** require real bio/project copy to be written; that is Milestone 4.1's scope.

**Out of scope:** Actual copywriting (bio text, job history, project descriptions, contact links) — tracked as `docs/ROADMAP.md` Milestone 4.1, not this rebrand pass.

**Dependencies:** FR-6 (typography token swap).

**Size:** Medium (structural/style verification across 5 sections).

---

### FR-6 — Typography and decorative-glyph token swap

**Context:** VISION.md requires dropping the JP font stack (`Dela Gothic One` / `Shippori Mincho B1` / `Noto Sans JP`) and the hard-coded kanji glyphs (confirmed still present at `src/styles.scss` lines 19–21 and `src/app/ui/scroll-layout/scroll-layout.component.ts` — six `<span class="kanji">` elements, as of 2026-07-05).

**Acceptance criteria:**
- `--font-display`, `--font-heading`, `--font-ui` custom properties in `src/styles.scss` are updated to Chakra Petch / Rajdhani / Inter respectively; `--font-mono` (JetBrains Mono) is unchanged.
- All six kanji `<span>` elements in `scroll-layout.component.ts` are either removed or replaced with invented geometric HUD-glyph decoration that is explicitly `aria-hidden` and never the primary section label (VISION.md "What NOT To Do" — decorative only).
- The existing numeric `01 / About`-style labels remain the legible, accessible section label regardless of what (if anything) replaces the kanji.

**Out of scope:** Redesigning the label system beyond what VISION.md specifies.

**Dependencies:** None — this is a token/content swap, not an architecture change.

**Size:** Small (per `docs/ROADMAP.md` 3.3 estimate).

---

### FR-7 — Mobile / no-WebGL 2D fallback parity

**Context:** `DeviceCapabilityService` routes to `FallbackComponent` when `innerWidth < 768`, touch is detected, or WebGL2 is unavailable. `docs/ROADMAP.md` calls this "a primary experience for a meaningful share of visitors, not an edge case." The `ui-ux-designer` flagged VISION.md's "visual parity" language as untestable as written and proposed a concrete bar.

**Acceptance criteria (adopting the design-review's parity checklist verbatim):**
- Fallback uses the **same palette CSS custom properties** as the 3D version (no hard-coded old-theme hex values remaining — grep for old hex values e.g. any old-theme-era color not in VISION.md's palette table).
- Fallback uses the **same section copy and same type hierarchy** (display/heading/body/mono roles map to the same content) as the 3D version.
- Fallback presents **sections in the same order** (hero→about→experience→skills→projects→contact) as the 3D version.
- Parity explicitly does **NOT** require: 3D rendering, per-frame motion/parallax, or matching animation timing — the bar is "same information + same brand," not "same experience." A test asserting the fallback contains a WebGL canvas or replicates scroll-linked motion is out of scope and would be a false failure.
- Given a real mobile device or a forced-no-WebGL desktop browser session, when the fallback renders, then no console errors occur and no old-theme copy/kanji/JP-font references remain (see FR-6).

**Out of scope:** Any 3D-equivalent motion in the fallback.

**Dependencies:** FR-6 (token swap must propagate here too).

**Size:** Medium (per `docs/ROADMAP.md` 3.2 estimate).

---

### FR-8 — Reduced-motion alternate experience

**Context:** VISION.md states this is "not currently implemented anywhere in the codebase" — confirmed by grep, this is net-new work, not a tweak. The `ui-ux-designer` flagged VISION.md's "snap" language as ambiguous (snap ≠ instant) and identified a specific IntersectionObserver trap.

**Acceptance criteria:**
- Given `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is `true` on load, when the app initializes, then Lenis smooth-scroll is not initialized (native scroll is used instead).
- The 3D scene **remains mounted** (this does not fall back to the 2D `FallbackComponent` — reduced-motion and no-WebGL/mobile are different, independent conditions and must not be conflated).
- Props are set to a single resting transform on load; no idle float/rotation animation runs.
- Section color/fog/light transitions between sections use a **fixed 200ms discrete cross-fade** on section change (confirmed as a firm spec value by the project owner, 2026-07-05 — not an approximation), not the continuous per-frame lerp used in the standard experience, and not an instant 0ms cut (per design-review input: 0ms reads as a jarring flash, not "reduced").
- Scroll-tied parallax (label/hue tweens in `scroll-layout.component.ts`) is disabled; content still reveals but without parallax offset.
- **Critical trap (must test explicitly):** given reduced-motion is active, when a section's content would normally reveal via an IntersectionObserver-gated `.section-card--visible` class, then that class is applied immediately/unconditionally rather than waiting on an observer callback that may behave differently without scroll-linked triggers — content must never be invisible-by-default under reduced motion.
- Given the OS-level reduced-motion setting changes while the tab is open (not just on initial load), when the app detects the change via a `matchMedia` `'change'` event listener, then behavior updates without requiring a page reload. *(Verified 2026-07-05: current web best practice explicitly recommends a live listener, not a one-time read — VISION.md's current phrasing, "read once as a signal," under-specifies this; this AC upgrades it.)*

**Out of scope:** Per-user manual override UI (a toggle in addition to OS preference) — not requested anywhere in VISION.md; flag as a future nice-to-have only if requested.

**Dependencies:** None technically, but should land before or alongside FR-2/FR-3 changes since it touches the same lerp code paths.

**Size:** Large (net-new cross-cutting behavior touching every animated component).

---

### FR-9 — Keyboard navigation and focus-visible treatment

**Context:** An accessible skip-nav with `data-section` buttons already exists and is covered by e2e tests. VISION.md doesn't specify a focus-visible treatment; the `ui-ux-designer` proposed a concrete one.

**Acceptance criteria:**
- Every skip-nav button, in-content link, and form field (Contact section) is reachable via Tab in DOM order, and DOM order matches visual/section order.
- Focus-visible treatment: a 2px solid outline in the primary accent color (Signal Cyan `#00e5ff` per VISION.md's palette), 2px offset, contrast ratio ≥3:1 against the adjacent surface color it sits on (WCAG 2.4.11-style non-text contrast target).
- Given a section's content is gated behind a reveal animation (`.section-card--visible`), when that content has not yet visually revealed, then it is still present in the accessibility tree (not `display: none` / `visibility: hidden` / removed) — reveal is an opacity/transform effect only, never an a11y-tree removal. This is testable via automated accessibility tooling (e.g., axe/Lighthouse) independent of scroll position.

**Out of scope:** A full keyboard-driven "jump between sections with arrow keys" affordance — not requested in VISION.md; the existing skip-nav buttons are the specified mechanism.

**Dependencies:** Feeds directly into NFR-3 (Lighthouse accessibility ≥0.90 gate) and NFR-5 (contrast).

**Size:** Small–Medium.

---

### FR-10 — URL-hash deep-linking to a section

**Context:** Added 2026-07-05 — owner decision: **IN SCOPE** for this rebrand (previously an open question; both `VISION.md` and `docs/architecture/ARCHITECTURE.md` had mentioned it only as a hypothetical future addition — "if deep-linking is ever wanted, add it as `scrollIntoView` triggered by a hash fragment, without introducing the Angular Router"). That existing guidance is the starting point; this item makes it a firm, testable requirement.

**Acceptance criteria:**
- Given a user loads the app at a URL with a section hash (e.g. `/#experience`, matching a `SectionId` from `core/models/section.types.ts`), when the initial render completes, then the viewport scrolls/snaps directly to that section's scroll position — the user does not have to manually scroll from the top first, and `ScrollStateService.activeSection` reflects that section's index immediately rather than staying at 0 until a manual scroll occurs.
- Given a user navigates between hash-linked sections and then uses the browser back/forward buttons, when a `popstate`/`hashchange` event fires, then scroll position, `activeSection`, and every dependent visual (camera/fog/rim targets) re-sync to match — a stale lerp target must not be left pointing at the previously-active section.
- **Known technical risk, flagged rather than prescribed:** Lenis (the smooth-scroll library already in use) tracks scroll position internally and generally needs to be told about a programmatic scroll via its own `scrollTo`-equivalent API — setting `window.location.hash` or calling native `scrollIntoView` alone can desync Lenis's internal position from the actual scroll offset. Confirming Lenis's current API for this (a version-specific check, not assumed here) is part of implementing this item, not a pre-solved detail.
- Given reduced-motion is active (FR-8), when a hash-linked section is loaded or navigated to, then the jump to that section is instant/snap, consistent with FR-8's reduced-motion behavior (no smooth-scroll animation to the target).
- Only section-level hashes matching `SectionId`/`SECTIONS` are supported (e.g. `#about`, `#experience`) — an unrecognized hash falls back to the default hero/top position rather than erroring.

**Out of scope:** Deep-linking to sub-section content (e.g. a specific project card within Projects) — section-level granularity only. Introducing the Angular Router — explicitly ruled out by `ARCHITECTURE.md`'s existing routing-strategy decision, unaffected by this item.

**Dependencies:** Depends on the per-section beat sheet (FR-2) being finalized/signed-off first (Milestone 2.1) and retargeted (Milestone 3, issue 3.1) — building hash-jump targets against beat-sheet values that might still change would mean redoing this work. Reuses the existing `ScrollStateService` signals; per `ARCHITECTURE.md`'s "no `SectionStore`" principle, this must not reintroduce a separate state store for hash/section tracking.

**Size:** Medium (new Milestone 3 issue — see `docs/ROADMAP.md` update; the Lenis-programmatic-scroll research is the main unknown, not the wiring itself).

---

## Non-Functional Requirements

### NFR-1 — 3D asset payload budget

**Context:** The pre-Milestone-1 shipped total was 15.3MB across 4 legacy GLBs (2.8MB + 2.5MB + 1.6MB props + an 8.4MB unused full-body model) — already over any reasonable budget regardless of theme. Those GLBs were deleted in Milestone 1.1; the live scene graph is now fully procedural (0MB of GLB props).

**Acceptance criteria:**
- If the procedural-primitives recommendation (FR-3) is followed for all three props: total GLB payload for props is **0MB**.
- If any GLB prop is kept instead (v2 path): ≤500KB per prop, ≤1.2MB total across all kept props, Draco-compressed, ≤5k triangles, ≤1024px textures.
- The now-unused 8.4MB full-body legacy GLB (confirmed unreferenced by the live scene graph, byte-identical to the untouched raw copy in `assests/`) is removed from `public/models/` once its Milestone-1 removal timing condition is met (replacement ready). **Done in Milestone 1.1** — the entire `public/models/` tree was deleted.
- `dist/` production build output is measured after any asset change and compared against the pre-change baseline — a regression check, not a fixed target, since the "under 6MB total page weight" figure in `ASSET_PIPELINE.md` was itself never enforced historically (`docs/ROADMAP.md` Finding 5) and shouldn't be treated as validated just because it's written down.

**Out of scope:** JS bundle budget (covered separately in `angular.json`'s existing 2MB/4MB budgets, unchanged by this rebrand).

**Dependencies:** FR-3.

**Size:** Small (verification), tied to FR-3's Large size for the actual build.

---

### NFR-2 — Rendering performance (draw calls, frame budget)

**Acceptance criteria:**
- Draw call count stays at or below the current baseline (4–5) — any new effect must use a single `Points`/`InstancedMesh`, never per-object meshes for particle/swarm effects.
- Shadow-casting is limited to the single key light on the focal prop only — no other light in the scene casts shadows (VISION.md: "shadow-casting every light is the single most expensive per-object cost in this scene").

**Out of scope:** Nothing — **update 2026-07-05:** a formal, automated FPS/frame-timing regression gate is now in scope; see NFR-9. This item's manual DevTools spot-check remains a valid supplementary check but is no longer the sole verification method.

**Dependencies:** NFR-9.

**Size:** N/A (constraint on all 3D work, not a standalone item).

---

### NFR-3 — Lighthouse CI gate (verified against the actual `lighthouserc.json`, not a paraphrase)

**Acceptance criteria (exact current thresholds, confirmed by reading `portfolio/lighthouserc.json` directly, 2026-07-05):**
- `categories:performance` ≥ 0.75 (`warn` severity — does not fail the build).
- `categories:accessibility` ≥ 0.90 (`error` severity — **does** fail the build; this is the only hard gate).
- `categories:best-practices` ≥ 0.85 (`warn`).
- `categories:seo` ≥ 0.80 (`warn`).
- Two other docs (`docs/architecture/SKILLS_REFERENCE.md`, `docs/deployment/GITHUB_INSTRUCTIONS.md`) previously showed different/incomplete example thresholds that didn't match this file — corrected in this pass (see "Docs Corrected" section of the PM report).

**Out of scope:** Raising any threshold to `error` — that's a policy decision for the project owner, not assumed here.

**Dependencies:** FR-9, NFR-5 (both feed the accessibility score).

**Size:** N/A (existing gate; verification only).

---

### NFR-4 — Motion timing and easing guardrails

**Acceptance criteria (VISION.md's guardrails, restated as fixed testable bounds):**
- GSAP ScrollTrigger `scrub` stays within 0.5–1.5 for all scroll-tied tweens (hero's current 1.2 is the reference value).
- Entrance eases use `power3.out`, duration 0.6–0.85s (never exceeding ~1s).
- Lenis `lerp` stays within 0.05–0.12 (current 0.075 is the reference value).
- `injectBeforeRender`/`beforeRender` lerp factors (see NFR-8 for the API-naming note) stay within `delta * 1.0` to `delta * 4` — current values (`delta * 1.8` fog/light, `delta * 2.5` camera/opacity) are within range and are the reference values, not a floor.
- Reduced-motion's fixed 200ms cross-fade (FR-8, confirmed firm by the owner 2026-07-05) is a deliberate exception to the continuous-lerp pattern above and should not be changed to match it.

**Out of scope:** None — this applies globally to all scroll-tied and per-frame motion.

**Dependencies:** FR-2, FR-8.

**Size:** N/A (constraint, verified via code review + manual scroll feel-check, not automatable).

---

### NFR-5 — Color contrast and visual accessibility

**Acceptance criteria:**
- Text-primary (`#e6ecf5`) and text-muted (`#6b7691`) against the background/surface colors (`#05060a` / `#0b0f1a`) each meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text) — this must be checked with an actual contrast tool against the final hex values used in `styles.scss`, not assumed from the palette table alone, since accent colors laid over surface colors (e.g. cyan text on a magenta-tinted section background) can fail even when each color independently looks "bright enough."
- Focus-visible treatment per FR-9.
- Danger red (`#ff3b3b`) is verified to appear only in real form-validation error states, never as a section-wide wash (VISION.md's own constraint, restated here as a testable "grep for section-level use of this hex outside form-validation code" check).

**Out of scope:** Full WCAG AAA compliance — VISION.md doesn't request this; AA is the bar implied by the Lighthouse accessibility ≥0.90 gate.

**Dependencies:** NFR-3.

**Size:** Small (verification pass once palette lands in code).

---

### NFR-6 — Browser/device support

**Acceptance criteria (per `docs/architecture/SKILLS_REFERENCE.md`'s existing matrix, treated as the requirement, not re-derived here):**
- Full 3D experience: Chrome 110+, Firefox 115+, Safari 16.4+, Edge 110+.
- Mobile Safari/Chrome: always routed to the 2D fallback (FR-7), never attempts WebGL.
- IE11: not supported (Angular 21 itself drops IE support — this is a framework constraint, not a project choice).

**ASSUMPTION:** this browser matrix was not independently re-verified against current caniuse/MDN data this session (it's a target-setting decision, not a fast-moving library API) — confirm or correct if these versions no longer reflect the intended support floor.

**Out of scope:** Nothing — **update 2026-07-05:** automated cross-browser CI testing against this matrix is now in scope; see NFR-9. This matrix is the target list NFR-9's Playwright projects are checked against.

**Dependencies:** FR-7, NFR-9.

**Size:** N/A.

---

### NFR-7 — IP and licensing compliance

**Acceptance criteria:**
- No third-party character IP (Kakashi, Naruto, ANBU, Kishimoto, Studio Pierrot, Sharingan, hitai-ate, or any other copyrighted character reference) remains anywhere in shipped code, assets, docs, comments, or test titles once `docs/ROADMAP.md` Milestone 1 is complete — a `grep -ri` sweep returning zero hits (excluding an optional changelog note kept for history) is the mechanical test.
- Every external asset (font, HDRI, texture) used is CC0, SIL OFL, or Apache-2.0, with no attribution restriction requiring a legal-caveat footer, and is logged in `docs/ASSET_CREDITS.md` once that file exists (`docs/ROADMAP.md` Milestone 2.5).
- **Verified 2026-07-05 (web check):** Chakra Petch, Rajdhani, and Inter are each confirmed still distributed on Google Fonts under SIL OFL 1.1; JetBrains Mono is confirmed still distributed under SIL OFL 1.1 (font) with its source additionally under Apache-2.0 — VISION.md's licensing claim for all four fonts is accurate as of this check.
- **As of 2026-07-05, the live site still shipped the original fan-IP assets and footer notice** (confirmed by reading `src/app/ui/footer/footer.component.ts`, `e2e/portfolio.spec.ts`, and `public/models/`), so `CLAUDE.md`'s "IP Notice" section was factually accurate then and was left in place until the asset removal actually landed. **Superseded 2026-07-06:** Milestone 1 landed — the GLBs and footer notice were removed, the footer is now a plain copyright line, and `CLAUDE.md`'s IP section is now an "Asset Provenance" note pointing to `docs/ASSET_CREDITS.md`.

**Out of scope:** Retroactive legal review of the archived fan-IP assets' original sourcing — that ship (removing them) is Milestone 1's job, not this requirements doc's.

**Dependencies:** `docs/ROADMAP.md` Milestones 1 and 2.5.

**Size:** N/A (ongoing constraint) / Small for the grep-sweep verification step specifically.

---

### NFR-8 — Dependency currency (web-verified, 2026-07-05)

**Context:** This project's own conventions ask contributors to "verify non-trivial API assumptions against current docs" precisely because these libraries move fast. Three findings from this session's verification pass:

**Findings and acceptance criteria:**
1. **`angular-three` deprecated APIs.** Installed version is `4.2.2` (confirmed in `package.json` and `node_modules/angular-three/package.json`). Directly inspecting the installed type definitions (`node_modules/angular-three/types/angular-three.d.ts`) confirms: `injectLoader` and `injectBeforeRender` — both used throughout the live codebase (`mask.component.ts`, `floating-models.component.ts`, and documented as "the canonical pattern" in `CLAUDE.md`) — are marked `@deprecated`, superseded by `loaderResource()` and `beforeRender()`, and **scheduled for removal in v5**. `injectStore` carries no such deprecation notice and remains current. AC: this is not a blocking defect (the deprecated APIs still function in 4.2.2), but any *new* 3D component added from this point forward should use `loaderResource`/`beforeRender` rather than copying the deprecated pattern from existing components, and Milestone 3's scene-graph retarget (which touches these exact components anyway) is the natural point to migrate the existing ones too — flagged as a recommended addition to Milestone 3, not a new milestone (see ROADMAP update).
2. **`gltf-transform` CLI.** Confirmed still the actively-maintained, correct tool for Draco+KTX2 GLB optimization (project site copyright 2026, current docs describe the same `optimize --compress draco --texture-compress ktx2` command shape referenced in this repo's docs). However, `docs/development/ASSET_PIPELINE.md` and `docs/architecture/SKILLS_REFERENCE.md` pinned CLI version `3.2.1`; `npm view @gltf-transform/cli version` returns `4.4.1` as latest as of this check. AC: don't hard-pin a version number in docs going forward — corrected in this pass to say "verify current version at install time."
3. **`prefers-reduced-motion` best practice.** VISION.md's phrasing ("read `matchMedia(...)` once as a signal") under-specifies current best practice, which recommends also attaching a `'change'` event listener so a mid-session OS preference change is honored without a reload. Folded into FR-8 as an explicit AC rather than left as a gap.

**Out of scope:** A full dependency audit of every package in `package.json` — only items that intersect a written requirement or an explicit "current API" claim in project docs were checked.

**Dependencies:** None blocking; informs FR-8 and Milestone 3 scope.

**Size:** Small (doc corrections, done in this pass) / Medium (actual API migration, if/when undertaken).

---

### NFR-9 — Automated cross-browser and FPS/performance regression gate

**Context:** Added 2026-07-05 — owner decision: **IN SCOPE NOW**, not deferred. The owner's explicit framing: *"3D animations are quite tricky to work with so we can keep it original and work with animations, cool scroll effects & other amazing effects so that [we do] not overcomplicate the design of the portfolio."* Read as both/and — ambitious, original scroll/3D motion work is explicitly encouraged, and this gate exists to catch regressions *as* that ambition grows, not to cap it. This reinforces `VISION.md`'s existing "What NOT To Do" complexity-vs-clarity guardrails (see the owner steering note added there 2026-07-05) rather than adding a new rule about creative scope.

**Acceptance criteria:**
- A minimal cross-browser matrix runs in CI via Playwright projects: at least **Chromium, WebKit (Safari engine), and Firefox** (mapping to NFR-6's support matrix). Each project runs the existing/expanded e2e smoke suite against a local production build (depends on `docs/ROADMAP.md` Milestone 4.4's local-build Playwright infra existing first — this gate cannot run against `playwright.config.ts`'s current live-production-only `baseURL`).
- An automated frame-timing/FPS regression check exists and runs in CI: a Playwright- or Lighthouse-driven measurement of frame timing during a scripted scroll-through of all 6 sections, compared against a defined budget (e.g. no sustained frame time regression beyond a set threshold relative to a recorded baseline — the exact numeric budget is an implementation-time decision informed by NFR-2's draw-call/shadow constraints, not fixed here since no baseline measurement exists yet to set a realistic number against).
- This gate blocks considering the rebrand "launched" (`docs/ROADMAP.md` Milestone 4) — it is a required check, not an optional/manual one, per the owner's explicit "in scope now" framing.
- Adding this tooling must not itself become the kind of overcomplication the owner's steering note warns against for the *product* — keep the test infrastructure itself proportional (a small Playwright project matrix + one frame-timing script), not a bespoke performance-monitoring platform.

**Out of scope:** A continuous/production performance-monitoring dashboard (e.g. real-user-monitoring) — this is a CI regression gate on scripted scenarios, not live telemetry. Browser/OS combinations beyond the three engines above (e.g. real iOS Safari device testing) — Playwright's WebKit project is the accepted proxy, not a guarantee of pixel-identical real-Safari behavior.

**Dependencies:** `docs/ROADMAP.md` Milestone 4, issue 4.4 (local pre-deploy Playwright infra) must land first — this is a new Milestone 4 issue building on it, not a replacement for it.

**Size:** Large (new CI tooling, a frame-timing measurement approach has to be built from scratch, plus a 3-browser project matrix).

---

## Design Review Flags (from `ui-ux-designer`, consulted 2026-07-05) — RESOLVED

This was a **proposed amendment to an already-written creative decision** (VISION.md's palette table) — surfaced rather than silently applied, because changing an approved design choice needed the project owner's sign-off. The owner has since decided; kept here as the record of what was proposed, why, and what was decided, rather than deleted.

**The finding:** VISION.md's own "What NOT To Do" list says "don't let per-section hue swings make it feel like six different apps... keep hue deltas between adjacent sections modest" — but the beat sheet as originally written swung the rim-light color through cyan → blue-violet → magenta → terminal-green → amber → coral across the six sections, plus a separate reserved danger-red. That's 6 accent colors doing "identity" work simultaneously, which the designer assessed as contradicting the doc's own modest-hue-delta goal for a 20–30 second recruiter skim.

**The proposed amendment:** Consolidate to a 2-color identity axis (Signal Cyan `#00e5ff` + Signal Magenta `#b464ff` — per-section rim/fog rides only this axis, small deltas) plus 2 desaturated **functional** colors that never own a whole section (terminal-green for proficiency-bar/"online" states only, amber for the Projects "live" chip only) plus the reserved danger-red. Drops coral entirely — Contact uses a warm-shifted cyan for "signal received" instead of a third warm hue competing with amber and red.

**Status: ACCEPTED by the project owner, 2026-07-05.** Applied to `VISION.md`'s palette table and per-section beat sheet (Hero/About/Experience were already on-axis and unchanged; Skills/Projects/Contact rim-light targets updated to on-axis hex values, with green/amber demoted to element-level UI accents only). No further action needed on this item — see `docs/ROADMAP.md` Milestone 2.1, which now records this as resolved rather than a pending sign-off item.

---

## Resolutions (owner sign-off, 2026-07-05)

All 5 items previously listed under "Open Questions for the Project Owner" have been decided. This section replaces that one — each item below states the decision and points to where it was applied, so nothing is left dangling.

1. **Palette consolidation — ACCEPTED.** See "Design Review Flags" above. Applied to `VISION.md`'s palette table and beat sheet.
2. **Reduced-motion cross-fade duration — CONFIRMED at a firm 200ms** (not an approximation). Applied to `VISION.md`'s Motion & Performance Guardrails and this doc's FR-8/NFR-4.
3. **URL-hash deep-linking — IN SCOPE.** Added as FR-10 above, with a new `docs/ROADMAP.md` Milestone 3 issue (3.6).
4. **`angular-three` deprecated-API migration — BUNDLED into Milestone 3**, per this doc's original recommendation (issue 3.5, already drafted in the prior pass — no structural change needed, just confirming the placement stands).
5. **Automated cross-browser/FPS regression testing — IN SCOPE NOW**, with an explicit owner framing that this reinforces (not walks back) ambitious 3D/motion work — see the steering note added to `VISION.md`'s "What NOT To Do" section and NFR-9 above. Added as a new `docs/ROADMAP.md` Milestone 4 issue (4.7).

---

## Feasibility Verification Log

| Claim checked | Method | Result | Date |
|---|---|---|---|
| `angular-three` `injectLoader`/`injectBeforeRender`/`injectStore` are "current" per `CLAUDE.md` | Read installed `node_modules/angular-three/types/angular-three.d.ts` directly (v4.2.2, matches `package.json`) | `injectLoader`/`injectBeforeRender` deprecated, removed in v5; `injectStore` current | 2026-07-05 |
| `gltf-transform` is still the right tool for Draco+KTX2 | Fetched gltf-transform.dev docs; `npm view @gltf-transform/cli version` | Still correct/current tool; docs' pinned version (3.2.1) stale, latest is 4.4.1 | 2026-07-05 |
| Chakra Petch / Rajdhani / Inter / JetBrains Mono still free-for-commercial on Google Fonts | Web search + fonts.google.com reachability check | All four confirmed, SIL OFL 1.1 (+ Apache-2.0 for JetBrains Mono source) | 2026-07-05 |
| `prefers-reduced-motion` matchMedia usage matches current best practice | Web search (web.dev, MDN-adjacent sources) | One-time read is a valid foundation but incomplete; live `'change'` listener is current best practice | 2026-07-05 |
| Node.js 22 LTS status (`DEVELOPMENT.md` prerequisite) | Web search (nodejs.org release schedule) | Node 22 now Maintenance LTS (EOL Apr 2027); Node 24 is Active LTS as of Oct 2025 | 2026-07-05 |
| `lighthouserc.json` thresholds as described in `CLAUDE.md` vs. two other docs | Read the actual file at `portfolio/lighthouserc.json` | `CLAUDE.md` was accurate; `SKILLS_REFERENCE.md` and `GITHUB_INSTRUCTIONS.md` both showed stale/incomplete example values — corrected | 2026-07-05 |
| `CLAUDE.md`'s "IP Notice" / live-scene-graph description still matches shipped code | `grep` across `src/`, read `footer.component.ts`, `e2e/portfolio.spec.ts`, `public/models/` | Was accurate on 2026-07-05 (fan-IP assets + notice still live); **superseded 2026-07-06** — Milestone 1 removed the assets, footer, and IP notice | 2026-07-05 |
