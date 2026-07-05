# GitHub Instructions — Workflow, CI/CD, and Repository Setup

## Repository Structure

```
portfolio/                        ← repo root
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml            ← GitHub Pages deployment
│   │   └── lighthouse.yml        ← Performance audit on PRs
│   ├── ISSUE_TEMPLATE/
│   │   ├── config.yml
│   │   ├── 01-bug-report.yml
│   │   └── 02-feature-request.yml
│   └── pull_request_template.md
└── portfolio/                    ← Angular project root
    ├── CLAUDE.md
    ├── angular.json
    └── src/
```

---

## Branch Strategy

**Solo developer, GitHub Pages target.**

| Branch | Purpose | Protection |
|--------|---------|-----------|
| `main` | Production — always deployable | Force-push disabled, deletion blocked |
| `feat/<name>` | New features (e.g., `feat/kakashi-model`) | None |
| `fix/<name>` | Bug fixes | None |
| `chore/<name>` | Tooling, deps, CI changes | None |

**Flow:**
```
feat/add-panel-animations
  → open PR → Actions run (build + Lighthouse)
  → self-review → merge to main
  → deploy.yml triggers → GitHub Pages updates
```

For a solo portfolio you don't *need* PRs, but keeping them gives you:
- A CI gate before `main` updates
- A searchable history of what changed and why
- A place to leave notes for your future self

---

## Commit Message Convention

Follow **Conventional Commits** (https://conventionalcommits.org):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

| Type | When to use |
|------|-------------|
| `feat` | New feature or section |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `style` | CSS/visual-only changes |
| `refactor` | Code restructure, no behaviour change |
| `test` | Adding or fixing tests |
| `chore` | Deps, CI, build config |
| `docs` | Documentation only |

**Examples:**
```
feat(kakashi): add raycasting hotspot directive
fix(panel): prevent flicker on quick hover-out
perf(scene): lazy-load Three.js chunk on first user interaction
chore(deps): upgrade angular-three to v4.1.0
docs(vision): update section mapping table
```

---

## Enabling Branch Protection (GitHub UI)

1. Go to **Settings → Branches → Add branch ruleset**
2. Target branches: `main`
3. Enable:
   - [x] Restrict deletions
   - [x] Block force pushes
   - [ ] ~~Require pull request reviews~~ (skip for solo — blocks yourself)
   - [x] Require status checks to pass — add: `build` (from `deploy.yml`)
4. Save

---

## GitHub Actions: Deploy Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:     # allow manual trigger from Actions UI

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: portfolio/package-lock.json

      - name: Install dependencies
        working-directory: portfolio
        run: npm ci

      - name: Build
        working-directory: portfolio
        run: |
          npx ng build \
            --configuration production \
            --base-href /portfolio/
        # ↑ Replace /portfolio/ with your actual GitHub repo name

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: portfolio/dist/portfolio/browser

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: https://nk-0-0.github.io/portfolio/
    steps:
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

---

## GitHub Actions: Lighthouse CI Workflow

**File:** `.github/workflows/lighthouse.yml`

Runs on every PR to catch performance regressions before they hit `main`.

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 20    # REQUIRED — prevents "Could not find hash" LHCI error

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: portfolio/package-lock.json

      - name: Install dependencies
        working-directory: portfolio
        run: npm ci

      - name: Build production
        working-directory: portfolio
        run: npx ng build --configuration production --base-href /portfolio/

      - name: Serve build + run Lighthouse
        uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: ./portfolio/lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true    # Posts a URL to the PR with results
```

**`portfolio/lighthouserc.json`** (this is the actual current file, verified 2026-07-05 — it also has a `seo` assertion that a previous version of this doc omitted):
```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist/portfolio/browser",
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:performance":    ["warn",  { "minScore": 0.75 }],
        "categories:accessibility":  ["error", { "minScore": 0.90 }],
        "categories:best-practices": ["warn",  { "minScore": 0.85 }],
        "categories:seo":            ["warn",  { "minScore": 0.80 }]
      }
    }
  }
}
```

> **Note on performance score:** A 3D WebGL portfolio will score lower than a standard site on Lighthouse performance (large JS chunk, WebGL initialization). `minScore: 0.75` is a `warn`, not `error`, for exactly this reason — tighten it once optimized. Accessibility is the only `error`-level gate (0.90+) — the 2D fallback makes this achievable.

---

## GitHub Actions: Test Workflow (Optional)

Add to the build job or as a separate job:

```yaml
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: portfolio/package-lock.json
      - run: npm ci
        working-directory: portfolio
      - name: Run tests
        working-directory: portfolio
        run: ng test --run
```

---

## Enabling GitHub Pages

1. Go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**
3. Save — no branch selection needed (Actions handle deployment)

After the first successful `deploy.yml` run, your site is live at:
```
https://<your-username>.github.io/portfolio/
```

---

## Issue Templates

Issue templates live in `.github/ISSUE_TEMPLATE/`. The files below are described in `docs/` but the actual template files need to be created at the repo root level:

### `.github/ISSUE_TEMPLATE/config.yml`
```yaml
blank_issues_enabled: false
contact_links:
  - name: Portfolio live site
    url: https://<username>.github.io/portfolio/
    about: View the live portfolio
```

### `.github/ISSUE_TEMPLATE/01-bug-report.yml`
```yaml
name: Bug Report
description: Something is broken or rendering incorrectly
labels: [bug]
body:
  - type: dropdown
    id: area
    attributes:
      label: Affected area
      options:
        - 3D scene / WebGL
        - Panel / content
        - Mobile fallback
        - Deployment / build
        - Other
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: What happened?
      placeholder: Describe the bug — include browser, OS, and screen size
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: What should happen?
    validations:
      required: true
  - type: input
    id: browser
    attributes:
      label: Browser + version
      placeholder: e.g. Chrome 124 on macOS 14
```

### `.github/ISSUE_TEMPLATE/02-feature-request.yml`
```yaml
name: Feature / Enhancement
description: Suggest a new portfolio section, effect, or improvement
labels: [enhancement]
body:
  - type: textarea
    id: idea
    attributes:
      label: What's the idea?
      placeholder: Describe the feature clearly
    validations:
      required: true
  - type: textarea
    id: why
    attributes:
      label: Why would this improve the portfolio?
  - type: dropdown
    id: effort
    attributes:
      label: Estimated effort
      options:
        - Small (< 2 hours)
        - Medium (half day)
        - Large (1+ days)
```

---

## PR Template

**`.github/pull_request_template.md`:**
```markdown
## What does this PR do?

<!-- One sentence -->

## Type of change
- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] perf — performance improvement
- [ ] chore — tooling / deps
- [ ] docs — documentation only

## Checklist
- [ ] `ng build` passes locally
- [ ] `ng test --run` passes
- [ ] Tested in browser (Chrome + Firefox)
- [ ] Mobile 2D fallback still works
- [ ] No new `any` types introduced
- [ ] Bundle size delta is acceptable (check Actions summary)

## Screenshots (if visual change)

<!-- Before / After -->
```

---

## Secrets Required

This project currently has **no secrets** — it's a fully static portfolio with no backend.

If a contact form is added:
| Secret | Where to add | Used in |
|--------|-------------|---------|
| `FORMSPREE_ID` | Settings → Secrets → Actions | Contact form endpoint |

Add secrets at: **Settings → Secrets and variables → Actions → New repository secret**

---

## Release Tagging (Optional)

When the portfolio reaches a milestone worth marking:

```bash
git tag -a v1.0.0 -m "Initial launch — Kakashi scene complete"
git push origin v1.0.0
```

Then use the GitHub Releases page to attach the optimised `kakashi.glb` as a release asset (keeps large binaries out of the main git history).

---

## Quick Reference

```bash
# Check what Actions are running
gh run list --limit 5

# Watch a specific run
gh run watch <run-id>

# Manually trigger the deploy workflow
gh workflow run deploy.yml

# View Pages deployment status
gh api repos/:owner/:repo/pages
```
