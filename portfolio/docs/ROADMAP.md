# Roadmap

Last updated: 2026-08-23.

## Where things stand

The Three.js scroll-driven portfolio was **scrapped** and replaced by a port of the pixel-world
design prototype. The rewrite is complete and green: lint, typecheck, 23 unit tests, 6 Playwright
smoke tests, and Lighthouse at 100 across all four categories.

What carried over from the old project: the Angular 21 toolchain, ESLint/Prettier config, Vitest
setup, the Playwright local-build harness, the frame-timing gate, and the four CI workflows. What
did not: every line of `src/app`, the 3D dependencies, and the vision/architecture docs.

## Open — content

The port is faithful to the prototype, which means it inherits the prototype's **placeholder copy**.
None of this is a code change; it is all `src/app/content/portfolio.content.ts`.

- [ ] Real name and tagline (currently `YOUR NAME` / `FULL-STACK & GAMES`)
- [ ] Real employers and dates in `EXPERIENCE` (three × `Company Name`)
- [ ] Real institution in `EDUCATION` (`University Name`)
- [ ] Real contact links in `CAMPFIRE.links` (`you@example.com`, bare `github.com`/`linkedin.com`)
- [ ] Real project links in `PROJECTS[].detail.links` (`itch.io`, `example.com`)
- [ ] Project screenshots into `public/projects/`, wired to `detail.image`
- [ ] Decide whether to keep the two `EMPTY_SLOTS` filler tiles or drop them

## Open — product decisions

- [x] **HUD travel time** — done 2026-08-23. Travel now holds a target duration (~4.5s cap)
      floored at run speed, and the view eases out while sprinting so the speed reads as motion
      rather than a teleport. Hill→campfire went from 19s to ~4.5s; short hops stayed quick.
- [x] **Mobile / touch** — done 2026-08-23. Pixel scale now derives from the tighter viewport
      axis, portrait re-frames the scene (ground and horizon lift, camera centres), panels dock as
      bottom sheets, the chapter nav becomes a horizontal strip, and the prompt bubble doubles as
      the touch interact control. Tap-to-walk and drag-to-scrub are wired with a 10px threshold.
- [ ] **Real-device performance is unmeasured.** At portrait scale a phone repaints ~82k buffer
      pixels/frame vs a laptop's 64k, on weaker hardware. `npm run perf:fps` is Chromium-desktop
      only and won't catch this — it needs a real device.
- [ ] **Landscape phones** fall on the desktop side of the 720px breakpoint and the `h/w > 1.3`
      portrait test, so they get the side-panel layout in a 390px-tall viewport. Untested.
- [ ] **Canvas content is invisible to assistive tech.** The overlay is fully accessible and the
      canvas is `aria-hidden`, so nothing is *lost* — but the world itself conveys mood, not
      information. Worth confirming that is the intent.

## Open — reach

- [x] **Link-unfurl metadata** — done 2026-08-23. Open Graph + Twitter card tags with absolute URLs
      and `public/preview.png`, since the client-only build gives unfurlers nothing else to read.
- [ ] **Still no crawlable content without JS.** `/read` fixes skimmability but not crawlability —
      it is a client-side route, so the served HTML is still an empty `<app-root>`. Enabling
      build-time prerendering would emit both routes as real HTML. Worth noting this is *not* the
      same as re-enabling SSR: prerendering runs at build time and the output stays static files,
      compatible with GitHub Pages. Decision pending.
- [x] **Skim path** — done 2026-08-23. `/#/read` renders the whole portfolio as one plain document
      from the same `portfolio.content.ts`, with print styles for PDF export. Linked prominently
      from the world's header.
- [x] **Positioning rebalance** — done 2026-08-23. The accent now falls on the engineering project
      and TypeScript rather than the game and Unreal, so a skimmer reads "engineer who does game
      dev" rather than the reverse. Guarded by tests in `portfolio.content.spec.ts`.

## Open — infrastructure

- [x] **Lighthouse CI was failing on every PR** — fixed 2026-08-23. Two bugs: the treosh action
      resolved `staticDistDir` against the repo root rather than `portfolio/`, and the job built
      with `--base-href /portfolio/` while LHCI serves from root, which would have graded a blank
      page. Now runs `@lhci/cli` directly (pinned devDependency) with `working-directory: portfolio`.
      Note it had never passed — it only triggers on `pull_request`, and all prior work was pushed
      straight to `main`.
- [ ] `e2e/perf/baseline.json` does not exist yet. First CI run of `npm run perf:fps` writes it.
      Do not commit a locally captured baseline — this sandbox and CI both software-render.
- [ ] WebKit cannot launch locally in this sandbox (missing system libs); CI covers it.
