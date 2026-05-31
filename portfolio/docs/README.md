# docs — Documentation Index

All documentation for the Kakashi 3D Portfolio project.

---

## vision/
> *What we're building and why*

| File | Contents |
|------|----------|
| [VISION.md](vision/VISION.md) | Project concept, Kakashi body part → section mapping, visual design direction, content outline, IP notice |

---

## architecture/
> *How it's built*

| File | Contents |
|------|----------|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Tech stack decisions (NGT, Three.js, signals), folder structure, state management, interaction flow, mobile fallback pattern |
| [SKILLS_REFERENCE.md](architecture/SKILLS_REFERENCE.md) | Every library with install commands, key API snippets, dev tools, browser support targets |

---

## development/
> *How to work on it*

| File | Contents |
|------|----------|
| [DEVELOPMENT.md](development/DEVELOPMENT.md) | Local setup, Phase 1–7 build order, code conventions, debugging, common issues and fixes |
| [ASSET_PIPELINE.md](development/ASSET_PIPELINE.md) | Sourcing the Kakashi GLB from Sketchfab, gltf-transform optimisation (Draco + KTX2), file size budgets |
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
1. [VISION.md](vision/VISION.md) — understand the concept
2. [ARCHITECTURE.md](architecture/ARCHITECTURE.md) — understand the stack
3. [DEVELOPMENT.md](development/DEVELOPMENT.md) — set up locally

**Working on the 3D scene:**
→ [ARCHITECTURE.md](architecture/ARCHITECTURE.md) + [SKILLS_REFERENCE.md](architecture/SKILLS_REFERENCE.md) + [ASSET_PIPELINE.md](development/ASSET_PIPELINE.md)

**Deploying:**
→ [GITHUB_DEPLOYMENT.md](deployment/GITHUB_DEPLOYMENT.md) → [GITHUB_INSTRUCTIONS.md](deployment/GITHUB_INSTRUCTIONS.md)

**AI coding assistant (Claude Code):**
→ Read `CLAUDE.md` at the project root — it's the primary AI instruction file and is loaded automatically.
