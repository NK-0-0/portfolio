# Portfolio Relaunch: Stall Diagnosis & Rework Plan

> Written 2026-07-04. Companion to `docs/vision/VISION.md` (new visual direction) and `docs/architecture/ARCHITECTURE.md` (current technical architecture). This document answers "why did it stall" and "what's the plan," in that order. No code, docs (other than this one), or GitHub issues were created as part of writing this — it's diagnosis and planning only; the issues below are drafts for a human to file.

## Part 1 — Why It Stalled

### Finding 1: This was a single-session sprint, not a slow multi-week stall
`git log` shows all 21 original commits on the same calendar day, from `initial commit` through the final `WIP: updated scroll animation`. The failure mode isn't "life got in the way over months" — it's that an ambitious, multi-layered system (raycasting + post-processing + accessible fallback + custom asset pipeline + full 6-section content) was scaffolded in one continuous burst, hit a wall, got a mid-flight redesign, and stopped the moment that redesign reached a barely-working state. There was no checkpoint where a small vertical slice was proven end-to-end before the next layer was added.

### Finding 2: The original interaction model was architecturally risky and untested before being fully built
The archived vision doc (`docs/archive/LEGACY_VISION.md`) describes hover-triggered raycasting on body-part meshes — inherently desktop-mouse-only, with no clear touch or keyboard equivalent. That's presumably why a separate hint component ("Hover Kakashi to explore") and a whole `DeviceCapabilityService` 2D-fallback path had to exist alongside it. The team built the hard, novel, unvalidated interaction (raycast hotspots + OutlinePass/Bloom post-processing) *and* its full accessible fallback *and* the content layer, all before confirming the core interaction was worth keeping — then scrapped it for a scroll-driven design three commits later. A full architectural layer was built and discarded without ever shipping.

### Finding 3: The pivot happened but the cleanup pass never did
The three "wip: pivot to scroll" commits replaced the interaction model but nothing after them removed the superseded code. Still present and orphaned as of this writing:
- `src/app/three/kakashi/kakashi.component.ts`
- `src/app/three/post-processing/effects.component.ts`
- `src/app/core/services/section-store.ts`
- `src/app/ui/panel/panel.component.ts` (+ `.scss`, `.spec.ts`)
- `src/app/ui/hint/hint.component.ts` (+ `.scss`, `.spec.ts`)

There is no commit that says "remove hover design" or "update docs for scroll pivot." The project stopped mid-transition, not at a natural boundary — a textbook symptom of an unplanned pivot where the old design is abandoned in place rather than decommissioned.

### Finding 4: Docs were written ahead of/alongside code and never reconciled with reality — twice
`docs/archive/LEGACY_VISION.md` and `LEGACY_ARCHITECTURE.md` (now archived — see those files) described the abandoned hover/hotspot/`SectionStore` design in confident, complete detail, including the wrong package name (`@angular-three/core`) that `CLAUDE.md` had to explicitly flag as never-actually-used. This is consistent with docs drafted as an upfront plan and never updated once implementation diverged — once when the hover design was built slightly differently than documented, and again at the full pivot. `CLAUDE.md` (dated after the pivot) existed specifically to warn readers not to trust the other docs. A living project shouldn't need a disclaimer file whose entire job is "ignore the other docs" — which is why this rework replaces that pattern with corrected docs instead of another disclaimer.

### Finding 5: The documented asset pipeline was never actually run against the real asset
`docs/development/ASSET_PIPELINE.md` documents a `gltf-transform` Draco+KTX2 pipeline with a hard budget of <3MB per model / <6MB total page weight. But `public/models/kakashi/kakashi.glb` is 8.4MB — nearly 3x budget — and byte-identical to the untouched raw copy in `assests/kakashi.glb`, meaning the optimization step was never performed on the shipped asset. `gltf-transform` isn't even in `devDependencies`. The built `dist/` directory is 26MB, well past the documented 6MB target. This is a "wrote the runbook, never ran it" failure: process existed on paper only and gave false confidence that asset size was handled.

### Finding 6: Uncontrolled, uncommitted-to-clean asset sourcing workflow
`assests/` (misspelled, separate from the correctly-named `public/models/` the app actually loads from) holds ~24MB across 9 files, all tracked in git — duplicate/unoptimized copies of assets already in `public/models/`, plus one file named only by a raw download hash (`044b0b94815d458980ccde530a217dc9.glb`) with no traceable origin. A "download and dump, forget to clean up before committing" workflow with no staging convention, now a permanent ~24MB scar in git history.

### Finding 7: The test suite couldn't catch any of this
Unit specs exist for `hint`, `panel`, and `section-store` — all three now orphaned — while `experience`, `skills`, and `projects` (which actually ship) have no specs at all. The Playwright e2e suite's `baseURL` points at the live production site, not localhost, so it's a post-deploy smoke check, not a dev-loop safety net. Nothing in CI or the local dev loop would have flagged the leftover dead files or the untested new scroll architecture.

### Finding 8: No linting compounds all of the above
No ESLint config exists anywhere in the repo. Combined with Finding 7, there was no structural mechanism — human process or tooling — positioned to catch dead code, unused imports, or leftover dependencies (`@angular/ssr`, `@angular/platform-server`, `express` all still sit in `package.json` despite `CLAUDE.md` explicitly saying SSR must never be re-enabled).

### Finding 9 (reassuring, not damning): the fan-IP dependency was structural in the *old* design but isn't in the current one
The archived vision's entire navigation model was keyed to Kakashi-specific anatomy (Sharingan eye → About, headband → Contact, ANBU mask → Projects) — that design couldn't survive a character swap without inventing a new hotspot mapping from scratch. The current scroll-driven architecture (`ScrollStateService.activeSection` driving generic per-section lerp targets for a focal object + two floating props + lighting/fog) has no such dependency — any focal 3D object and two props slot in without redesigning the interaction model. This confirms the plan below: keep the scroll architecture, replace only the assets and theme.

### Verdict on original scope
The original v1 scope was too ambitious to prove out in a single spare-time push. It combined five simultaneously novel, interdependent risk areas in one build: (1) a mouse-hover raycast interaction model with no established accessible-fallback pattern to copy, (2) a full post-processing pipeline driven by that unproven interaction, (3) a from-scratch asset optimization pipeline that the docs themselves flagged as the highest-risk item, (4) a parallel 2D mobile fallback that had to stay in sync with the 3D design, and (5) full content for 6 sections — all before any single piece was validated end-to-end. When the riskiest piece (the interaction model) didn't pan out, there was no smaller working version to fall back to, so the fix required touching everything at once, and momentum ran out right after the pivot's first working commit.

**Carried into the plan below:** don't repeat this. Milestone 2 sequences the riskiest new element (original 3D asset sourcing) as a single validated pathfinder before committing to sourcing everything.

## Part 2 — Milestone & Issue Breakdown

### Issue format note

`.github/ISSUE_TEMPLATE/` has two GitHub Issue Forms (YAML): `01-bug-report.yml` (labels: `bug`; fields: affected area, what happened/should happen, repro, browser, device) and `02-feature-request.yml` (labels: `enhancement`; fields: area dropdown — *3D scene/visual effects, Portfolio content, Interaction/UX, Performance, Mobile experience, Accessibility, Other* — idea, why, effort dropdown — *Small <2h / Medium half day / Large 1+ days / Unknown*). Neither fits chore/cleanup/IP-removal work well. Milestone 0's first issue adds a third template (`03-chore-tech-debt.yml`) for that; until it lands, file chore-shaped issues under feature-request with `area: Other`.

Recommended new labels before filing: `tech-debt`, `ip-cleanup`, `content`, `assets`, `docs`, `accessibility`, `testing`.

### Milestone order

`M0 → M1 → M2 → M3 → M4`, each gated on the previous. Don't fully parallelize M1 (IP asset removal) with M2 (new asset sourcing) — sequence Issue 1.1's deletion to land *as* M2's replacements are ready, so the app is never left with broken loader paths.

---

### Milestone 0 — Repo Hygiene & Ground Truth

**Completion definition:** No orphaned code, duplicate asset folders, or dead dependencies remain; all docs describe only the architecture that actually ships; ESLint is configured and passing; a chore/tech-debt issue template exists.

- **0.1 — Add a Chore/Tech-Debt issue template.** *(docs, tech-debt · Small)* Neither existing template fits cleanup/dependency-removal/doc-rot work. AC: `03-chore-tech-debt.yml` added (fields: Area — Code cleanup / Dependency & tooling / Documentation / Asset & IP cleanup / CI-CD / Other — Description, Acceptance Criteria, Effort); `labels: [tech-debt]` set; `config.yml` still resolves with three templates.
- **0.2 — Delete orphaned hover/hotspot-era components and services.** *(tech-debt · Medium)* Remove `three/kakashi/`, `three/post-processing/`, `core/services/section-store.ts`, `ui/panel/`, `ui/hint/` and their `.scss`/`.spec.ts` siblings. AC: grep confirms zero remaining references before deletion; `model-loading.service.ts` `TOTAL_ASSETS` checked; `ng build --configuration production` and `ng test --run` pass. Out of scope: doc updates (0.3), GLB binary removal (Milestone 1).
- **0.3 — Reconcile `VISION.md`/`ARCHITECTURE.md` with reality.** *(docs, tech-debt · Medium)* **Done as of this writing** — old docs moved to `docs/archive/` with superseded headers; fresh docs written describing the current scroll-driven architecture and new Signal Ghost direction. Remaining AC: `docs/development/AGENTS.md` package-name/architecture references still need the same correction; `CLAUDE.md`'s stale-docs disclaimer can be softened now that the docs it warned about are fixed.
- **0.4 — Remove the misspelled `assests/` staging folder.** *(tech-debt · Small)* ~24MB, 9 files, tracked in git, duplicates `public/models/` plus one untraceable hash-named GLB. AC: confirm nothing references `assests/` paths; delete and commit; document a gitignored scratch-asset convention so this doesn't recur. A `git filter-repo`/BFG history rewrite to reclaim the 24MB is optional and requires a force-push even solo — treat as a separate decision, not a default step.
- **0.5 — Wire up and enforce the documented asset-optimization pipeline.** *(tech-debt, assets · Medium)* `gltf-transform` is documented but not installed and was never run against the shipped Kakashi GLB (8.4MB, byte-identical to the raw copy). AC: `gltf-transform` added as a devDependency or documented tool; `npm run optimize:models` script added; a CI check or documented manual gate for the size budget; `ASSET_PIPELINE.md` updated to match what's actually enforced.
- **0.6 — Remove dead SSR/Node scaffolding.** *(tech-debt · Small)* `@angular/ssr`, `@angular/platform-server`, `express`, `@types/express`, `serve:ssr:portfolio` script are unused leftovers; `CLAUDE.md` says never re-enable SSR. AC: packages/script removed; no `server.ts`/`main.server.ts`/`app.config.server.ts` remain; build still succeeds.
- **0.7 — Add ESLint (Angular's official config).** *(tech-debt · Medium)* No lint config exists at all — part of why dead files and stale docs went unnoticed through an entire pivot. AC: `ng add @angular-eslint/schematics`; `npm run lint` passes; lint step added to CI.

### Milestone 1 — Remove Kakashi/Naruto Fan-IP Surface

**Completion definition:** Zero references to Kakashi, Naruto, ANBU, Kishimoto, or Studio Pierrot remain anywhere in shipped code, assets, docs, or tests; the footer reflects only original or properly-licensed assets.

- **1.1 — Remove Kakashi GLB/texture assets from `public/`.** *(ip-cleanup · Small)* Delete `public/models/{kakashi,mask,book,kunai}/*.glb` **only once Milestone 2's replacements are ready to drop in**, so the app never sits with broken loader paths.
- **1.2 — Rewrite the footer/attribution component.** *(ip-cleanup · Small)* `footer.component.ts` hardcodes the Kakashi/Kishimoto notice; `e2e/portfolio.spec.ts` asserts on that exact text. AC: footer copy updated per `docs/ASSET_CREDITS.md` once it exists (Milestone 2.5); e2e assertion updated to match; IP-notice code comment removed/rewritten.
- **1.3 — Purge Kakashi/Naruto references from docs, comments, and test titles.** *(ip-cleanup, docs · Small)* `grep -ri "kakashi|naruto|anbu|kishimoto|sharingan|hitai-ate"` across `src/`, `docs/`, `e2e/`, `CLAUDE.md`, `README.md` should return zero hits (an optional changelog note kept for history is fine); e2e `describe`/test titles renamed.
- **1.4 — Set a naming convention for new assets before any land.** *(ip-cleanup, assets · Small)* Old filenames like `kunai_do_minato_namikaze.glb` encoded Naruto lore even in the filename. AC: convention documented (`public/models/<category>/<theme-neutral-name>.glb`) in `ASSET_PIPELINE.md`.

### Milestone 2 — Original Art Direction & 3D Asset Pipeline

**Completion definition:** The Signal Ghost visual concept (`docs/vision/VISION.md`) is approved, and all 3D models/textures/HDRI needed for the 6 sections are sourced or built, pass the Milestone 0.5 optimization budget, and sit in `public/models/` ready to wire up.

This is the highest-risk milestone — the old docs themselves called asset sourcing "the highest-risk item," and it's arguably harder now since original sci-fi assets can't be found via a simple "search a known character name" query the way the fan-model workflow could. **`docs/vision/VISION.md` already resolves most of this milestone's design decisions** by recommending procedural (non-GLB) props for v1 — read that document before starting any issue below.

- **2.1 — Confirm the art-direction brief.** *(content · Small)* `docs/vision/VISION.md` is the brief. AC: owner reviews/approves the Signal Ghost direction, palette, and per-section beat sheet, or requests changes before 2.2 starts.
- **2.2 — Build the focal 3D prop (pathfinder — do this first).** *(3D scene/visual effects · Large)* Replaces `mask/anbu_kakashi_mask.glb`. **Sequencing matters:** validate this one end-to-end (sourced/built, optimized, wired into one section) *before* starting 2.3, to prove the riskiest new element on a small slice — the checkpoint the original build skipped. AC: no "non-commercial fan work only" restriction; passes 0.5's pipeline; logged in `docs/ASSET_CREDITS.md` (2.5).
- **2.3 — Build the two floating props.** *(3D scene/visual effects · Large)* Per `docs/vision/VISION.md`, recommended as procedural geometry (data-shard via `RoundedBoxGeometry`+`CanvasTexture`, drone via `IcosahedronGeometry`+struts) rather than new GLBs. Don't start until 2.2 is validated.
- **2.4 — Source an original/CC0 environment (HDRI + particle texture).** *(3D scene/visual effects · Medium)* The existing Poly Haven CC0 HDRI workflow in `ASSET_PIPELINE.md` is theme-agnostic — just point it at a new HDRI (e.g. night-city/space skybox) instead of forest-moonlight.
- **2.5 — Create `docs/ASSET_CREDITS.md`.** *(docs, assets · Small)* One row per asset: name, source URL, license, attribution required, where used. Cross-check footer copy (1.2) against this ledger once it exists.

### Milestone 3 — Rebuild the Scroll Experience on New Assets

**Completion definition:** The existing `ScrollStateService`/scene-graph architecture is fully retargeted to the new assets and theme — all 6 sections lerp correctly, the mobile 2D fallback has visual parity, and the app builds/deploys clean with zero references to removed assets.

- **3.1 — Retarget `scene-graph.component.ts` and per-section lerp constants.** *(3D scene/visual effects · Large)* Per `docs/vision/VISION.md`'s beat sheet: new GLB/procedural loader references; per-section constant arrays redefined for the new palette/mood; `ModelLoadingService.TOTAL_ASSETS` updated if the loaded-asset count changes.
- **3.2 — Update the 2D fallback to match the new theme.** *(Mobile experience · Medium)* Palette/fonts flow through CSS custom properties automatically — verify no old-theme copy remains; check on a real mobile viewport and a forced-no-WebGL desktop run.
- **3.3 — Reconsider the parallax kanji/label motif.** *(3D scene/visual effects · Small)* `ui/scroll-layout/` has hard-coded kanji tied to the old aesthetic. Per `docs/vision/VISION.md`: drop it, or replace with a genuinely original decorative motif — owner's call, flagged here so it isn't missed since it's not a 3D asset.
- **3.4 — Full-app smoke pass on the new build.** *(Performance · Medium)* `ng build --configuration production --base-href /portfolio/` with zero console 404s; all 6 sections visually verified at expected scroll positions.

### Milestone 4 — Content, Testing & Launch Polish

**Completion definition:** Real content is live in all sections, test coverage matches the current component set, accessibility/performance thresholds pass, and the relaunched site is live and verified.

- **4.1 — Write and wire real content for all 5 sections.** *(content · Large)* Real bio, work history, versioned skills, 3–5 real projects with links, real contact methods.
- **4.2 — Add unit specs for `experience`/`skills`/`projects` and `ScrollStateService`.** *(testing · Medium)* These currently have no coverage despite being the sections that actually ship, and the single source-of-truth service has none either.
- **4.3 — Confirm orphaned specs are gone.** *(testing · Small)* Safety-net re-check that `hint`/`panel`/`section-store` specs were removed in 0.2; mergeable into that issue if sequencing allows.
- **4.4 — Add a local pre-deploy Playwright smoke run.** *(Other · Medium)* Today's e2e only targets the deployed site, so nothing catches a broken build before it ships — the gap that let the scroll pivot ship half-wired without a red flag. Add a config/project against a local production build + static server, wired into CI on PR before deploy; keep the existing production-only suite for post-deploy checks.
- **4.5 — Accessibility pass against the existing Lighthouse CI gate.** *(Accessibility · Medium)* `lighthouserc.json` already enforces accessibility ≥0.90. Since hover-only interaction is gone, the main new risk is contrast/focus-order regressions from the new palette — check `npx lhci autorun` plus manual keyboard-only navigation.
- **4.6 — Final relaunch deploy and live verification.** *(tech-debt · Small)* Deploy via the existing workflow; manually verify the live site on desktop and one real mobile device; run the updated production Playwright suite against it.

## Files referenced during this review

`CLAUDE.md`, `docs/archive/LEGACY_VISION.md`, `docs/archive/LEGACY_ARCHITECTURE.md`, `docs/development/AGENTS.md`, `docs/development/ASSET_PIPELINE.md`, `package.json`, `angular.json`, `src/app/ui/footer/footer.component.ts`, `e2e/portfolio.spec.ts`, `assests/` (misspelled staging folder, tracked in git), `public/models/` (live asset location), `.github/ISSUE_TEMPLATE/01-bug-report.yml`, `.github/ISSUE_TEMPLATE/02-feature-request.yml`, `.github/pull_request_template.md`.
