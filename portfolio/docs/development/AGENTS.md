# AGENTS.md — Cross-Tool AI Assistant Instructions

> **Rewritten 2026-08-23.** The previous version described the Three.js scroll-driven portfolio,
> which was deleted in the pixel-world port. Nothing from that architecture survives in `src/`.

## What this file is

**AGENTS.md** is an open standard (Linux Foundation, 2025) for giving AI coding assistants
project-specific instructions. It is tool-agnostic — Cursor, Copilot, Cody, Factory and others read
it.

**Claude Code** reads [`CLAUDE.md`](../../CLAUDE.md) at the project root instead. That file is
canonical; this one is the cross-tool mirror. **If the two ever drift, `CLAUDE.md` wins.**

---

## The one-line summary

Angular 21 static SPA, deployed to GitHub Pages, presented as a side-scrolling pixel-art world. A
single `<canvas>` renders the world; the visitor walks an avatar east across 3260 world-pixels, and
that position drives which content panel is open, the time of day, and the HUD. No scrolling page,
no 3D, no WebGL — it is a 2D canvas.

## Architecture in three lines

```
WorldRenderer (world/world-renderer.ts)        simulation + painting. Plain TS, zero Angular.
WorldStateService (world/world-state.service.ts)  signals. The only channel between the two.
ui/** components                                read signals. Never touch the renderer.
```

## Non-obvious constraints — read before writing code

1. **The renderer must never touch the overlay.** The design prototype this was ported from had a
   render loop that called `document.querySelectorAll('[data-panel]')` and set `.style.opacity`
   sixty times a second. Untangling that was the point of the port. To make the world affect the
   DOM, add a field to `WorldSnapshot` and bind a component to the resulting signal.

2. **No SSR, but there *is* a prerender.** `angular.json` sets `outputMode: "static"`, which still
   executes the app in Node at build time. Anything touching `window`, `document` or a canvas must
   be inside `afterNextRender`. Forgetting this breaks the build, not just the runtime.

3. **Zoneless change detection.** `provideZonelessChangeDetection()`. Signals only — no
   `NgZone`, no `fakeAsync`/`flush` in tests, no RxJS for UI state.

4. **Panel fades are CSS, not JavaScript.** Visibility is an `.is-open` class with a transition.
   Do not animate opacity from the render loop.

5. **All copy lives in `src/app/content/portfolio.content.ts`.** If you are editing a user-visible
   string inside a template, you are in the wrong file.

6. **Sprites are the art files.** `src/app/world/sprites.ts` holds arrays of equal-length strings;
   each character indexes the `PAL` colour map and `.` is transparent. Rows must stay rectangular —
   a spec enforces it.

7. **Chapter order is load-bearing in three places** and must stay in sync: `CH` in
   `world/world.model.ts`, the panel components selected by index in `app.ts`, and the landmark
   drawn at that X in `world-renderer.ts`.

8. **Do not reintroduce** `three`, `angular-three`, `gsap`, `lenis`, or `ngxtension`. They were
   removed with the old app.

## Conventions

- Standalone components only; no NgModules
- `inject()` for DI, not constructor injection
- `@if` / `@for`, never `*ngIf` / `*ngFor`
- SCSS files, no inline styles in templates; shared tokens in `src/styles.scss`
- No `any` — `unknown` plus type guards at boundaries
- Comments explain *why*, not *what*

## Commands

```bash
npm start                # dev server
npm run build            # production build
npm run typecheck        # tsc --noEmit
npm run lint
npx ng test --no-watch   # Vitest
npm run e2e:local        # Playwright vs a local production build
```

CI runs lint, typecheck, unit tests and a production build on every PR.
