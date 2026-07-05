# docs — Documentation Index

All documentation for the Signal Ghost portfolio project (relaunch of the original Kakashi/Naruto fan-art concept — see `ROADMAP.md` for why).

---

## Root

| File | Contents |
|------|----------|
| [ROADMAP.md](ROADMAP.md) | Diagnosis of why the original build stalled, plus the milestone/issue breakdown for the relaunch. Read this first if you're wondering "what happened here" or "what's next." |

---

## vision/
> *What we're building and why*

| File | Contents |
|------|----------|
| [VISION.md](vision/VISION.md) | Current concept ("Signal Ghost" original sci-fi theme), palette, materials/lighting, typography, per-section scroll beat sheet, 3D prop concepts, motion/performance guardrails, IP posture |
| [REQUIREMENTS.md](vision/REQUIREMENTS.md) | Testable functional and non-functional requirements derived from VISION.md, with web-verified feasibility notes and design-review flags |

---

## architecture/
> *How it's built*

| File | Contents |
|------|----------|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Current tech stack decisions (angular-three, Three.js, signals), live folder structure, state management, interaction flow, mobile fallback pattern |
| [SKILLS_REFERENCE.md](architecture/SKILLS_REFERENCE.md) | Every library with install commands, key API snippets, dev tools, browser support targets |

---

## archive/
> *Superseded designs, kept for historical record only*

| File | Contents |
|------|----------|
| [LEGACY_VISION.md](archive/LEGACY_VISION.md) | The original Kakashi hover/hotspot concept — abandoned mid-build, do not implement |
| [LEGACY_ARCHITECTURE.md](archive/LEGACY_ARCHITECTURE.md) | The original architecture doc for that abandoned design, including a wrong package name |

---

## development/
> *How to work on it*

| File | Contents |
|------|----------|
| [DEVELOPMENT.md](development/DEVELOPMENT.md) | Local setup, code conventions, debugging, common issues and fixes. **Note:** its old Phase 1–7 build order described the abandoned pre-pivot design — corrected 2026-07-05 to point to `ROADMAP.md`'s milestone plan instead |
| [ASSET_PIPELINE.md](development/ASSET_PIPELINE.md) | gltf-transform optimisation (Draco + KTX2), file size budgets, HDRI/font sourcing. **Note:** its original Sketchfab-character-sourcing workflow is superseded for v1 by `VISION.md`'s procedural-primitives recommendation — see banner at top of that file |
| [AGENTS.md](development/AGENTS.md) | Cross-tool AI assistant instructions (Cursor, Copilot, etc.) — links back to CLAUDE.md |

---

## deployment/
> *How to ship it*

| File | Contents |
|------|----------|
| [GITHUB_DEPLOYMENT.md](deployment/GITHUB_DEPLOYMENT.md) | SSR → static migration, angular.json changes, GitHub Pages setup, custom domain, 404 routing |
| [GITHUB_INSTRUCTIONS.md](deployment/GITHUB_INSTRUCTIONS.md) | Branch strategy, commit conventions, GitHub Actions workflows (deploy + Lighthouse CI), issue templates, PR template |

---

## Quick links by role

**Starting the project for the first time:**
1. [ROADMAP.md](ROADMAP.md) — understand what happened and what's next
2. [VISION.md](vision/VISION.md) — understand the concept
3. [ARCHITECTURE.md](architecture/ARCHITECTURE.md) — understand the stack
4. [DEVELOPMENT.md](development/DEVELOPMENT.md) — set up locally

**Working on the 3D scene:**
→ [ARCHITECTURE.md](architecture/ARCHITECTURE.md) + [SKILLS_REFERENCE.md](architecture/SKILLS_REFERENCE.md) + [ASSET_PIPELINE.md](development/ASSET_PIPELINE.md)

**Deploying:**
→ [GITHUB_DEPLOYMENT.md](deployment/GITHUB_DEPLOYMENT.md) → [GITHUB_INSTRUCTIONS.md](deployment/GITHUB_INSTRUCTIONS.md)

**AI coding assistant (Claude Code):**
→ Read `CLAUDE.md` at the project root — it's the primary AI instruction file and is loaded automatically.
