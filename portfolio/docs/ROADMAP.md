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

- [ ] **HUD travel takes ~19 seconds hill→campfire.** The avatar physically walks to the
      destination. This is faithful to the prototype but is a long wait for someone who clicks a nav
      item. Options: a faster travel speed when the destination came from the HUD, a fade-cut, or
      leave it as a deliberate pacing choice.
- [ ] **No mobile or touch story.** The world is keyboard- and pointer-driven, and the panels are
      sized in `vw` against a desktop layout. The old project had an explicit 2D fallback for
      mobile; the port has none. Needs either touch controls, a reduced layout, or a deliberate
      "desktop only" stance.
- [ ] **Canvas content is invisible to assistive tech.** The overlay is fully accessible and the
      canvas is `aria-hidden`, so nothing is *lost* — but the world itself conveys mood, not
      information. Worth confirming that is the intent.

## Open — infrastructure

- [ ] `e2e/perf/baseline.json` does not exist yet. First CI run of `npm run perf:fps` writes it.
      Do not commit a locally captured baseline — this sandbox and CI both software-render.
- [ ] WebKit cannot launch locally in this sandbox (missing system libs); CI covers it.
