# GitHub Deployment Guide — Static Site on GitHub Pages

## Overview

This project deploys as a **static site** to GitHub Pages via GitHub Actions. The Angular SSR configuration that ships with the default Angular 21 scaffold is disabled and replaced with static prerendering.

---

## Part 1: Migrate from SSR to Static Output

The default scaffold uses `outputMode: "server"` (SSR). GitHub Pages cannot run a Node server, so switch to static output before any deployment work.

### 1.1 Update `angular.json`

```json
// angular.json → projects.portfolio.architect.build.options
{
  "outputMode": "static",
  "prerender": true
}
```

Remove the `ssr` block entirely:
```json
// DELETE this block:
"ssr": {
  "entry": "src/server.ts"
}
```

### 1.2 Remove server-side files

These files are only needed for SSR and can be deleted:
```bash
rm src/main.server.ts
rm src/server.ts
rm src/app/app.config.server.ts
rm src/app/app.routes.server.ts
```

### 1.3 Update `package.json` scripts

Remove the `serve:ssr:portfolio` script — it no longer applies.

### 1.4 Verify the static build works locally

```bash
ng build --configuration production
ls dist/portfolio/browser/
# Should contain: index.html, main-*.js, *.css, models/
```

---

## Part 2: Configure for GitHub Pages

### 2.1 Repository setup

Your GitHub repository must be named exactly `portfolio` (or any name — just note it). GitHub Pages will serve the site at:

```
https://<your-username>.github.io/<repo-name>/
```

This means the Angular app's `base href` must match the repo name.

### 2.2 Set `base-href` in build

Do **not** hardcode `base-href` in `index.html`. Set it at build time:

```bash
ng build --base-href /portfolio/
```

In the GitHub Actions workflow (next section), this flag is passed automatically.

If you use a **custom domain** (e.g., `nkateko.dev`), the base href becomes `/` and this step is simpler. See Part 5.

### 2.3 Fix Angular routing on GitHub Pages

GitHub Pages serves a 404.html for unknown URLs. For a single-page Angular app, every route refresh must redirect back to `index.html`. Add a `404.html` file in `public/`:

**`public/404.html`:**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <script>
    // Redirect all 404s to index.html with the original path preserved as a query param
    const path = window.location.pathname + window.location.search;
    window.location.replace('/?redirect=' + encodeURIComponent(path));
  </script>
</head>
<body></body>
</html>
```

Then in `src/main.ts` or `app.ts`, read the redirect param and navigate there on startup.

> **For this project:** since there are no Angular routes (navigation is via 3D click, not URLs), this is only needed if you add hash routing later. The `404.html` is still worth adding defensively.

---

## Part 3: GitHub Actions Workflow

Create the workflow file:

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

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
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
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
        # Replace /portfolio/ with your actual repo name

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

> **Working directory:** Note `working-directory: portfolio` — the Angular project is nested inside the repo at `/portfolio`. Adjust if your repo structure differs.

---

## Part 4: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions** (not the legacy "Deploy from branch")
3. Save

Push to `main` — the Actions workflow will trigger and deploy automatically.

Your site will be live at:
```
https://<username>.github.io/portfolio/
```

---

## Part 5: Custom Domain (Optional)

If you own a domain (e.g., `nkateko.dev`):

1. In **Settings → Pages → Custom domain**, enter your domain
2. Add a CNAME record with your DNS provider pointing to `<username>.github.io`
3. GitHub will auto-provision an SSL certificate (Let's Encrypt) — takes up to 24 hours
4. Change the `--base-href` in the workflow to `/` (the root)
5. Add a `CNAME` file in `public/` containing just your domain:
   ```
   nkateko.dev
   ```
   GitHub Pages uses this file to keep the custom domain after each deploy.

---

## Part 6: Handling Large Assets (GLB Model)

GLB files (the 3D model) can be up to 3MB. GitHub Pages has no file size limit under 100MB, so this is fine. However, there are two things to watch:

### Git LFS (recommended for models > 1MB)

Large binary files in Git cause bloated repository history. Use Git LFS:

```bash
# Install Git LFS (once per machine)
git lfs install

# Track GLB files
git lfs track "*.glb"
git lfs track "*.hdr"
git lfs track "*.ktx2"

# Commit the .gitattributes file
git add .gitattributes
git commit -m "chore: track binary assets with Git LFS"
```

> **GitHub Pages and Git LFS:** GitHub Pages **does not serve Git LFS objects** by default. If you use LFS, place large assets in `public/` and reference them by URL, or use a CDN (Cloudflare R2, Bunny CDN, or even a separate GitHub release asset URL).

### Alternative: Store model in GitHub Releases

Upload `kakashi.glb` as a release asset (no LFS needed) and reference it by its raw GitHub release URL in your Angular code. This keeps the repo lean.

```typescript
readonly modelUrl = 'https://github.com/<user>/portfolio/releases/download/v1.0/kakashi.glb';
```

---

## Part 7: Local Preview of Production Build

Always test the production build locally before pushing:

```bash
cd portfolio

# Build production
ng build --configuration production --base-href /portfolio/

# Serve the static output (requires serve or similar)
npx serve dist/portfolio/browser -l 4200

# Open http://localhost:4200/portfolio/
```

Alternatively:
```bash
npx http-server dist/portfolio/browser -p 4200 --proxy http://localhost:4200?
```

---

## Deployment Checklist

- [ ] `outputMode` changed to `"static"` in `angular.json`
- [ ] Server-side files deleted
- [ ] `public/404.html` added
- [ ] `.github/workflows/deploy.yml` created with correct `base-href`
- [ ] GitHub Pages source set to "GitHub Actions" in repo settings
- [ ] Large assets (GLB, HDR) handled via LFS or release assets
- [ ] Production build tested locally before push
- [ ] `--base-href` matches actual repo name (or `/` for custom domain)
- [ ] Footer IP attribution present for Kakashi character
