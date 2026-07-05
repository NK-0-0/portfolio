# angular-dev — learning log

Read this before implementation work; append after. Terse, non-obvious, actionable entries only — wrong package names, framework gotchas, bundle-budget near-misses, API surprises. No routine/unsurprising work. Newest entries at the top.

<!-- Format: - <finding> — <why it matters / how to apply next time> -->

- `@angular/router` is NOT a dead dependency despite the app defining no routes — `angular-three@4.2.2` statically imports it (`import * as i1 from '@angular/router'` for `NgtRoutedScene`) at the top of its fesm bundle, and does NOT declare it in peerDependencies. Removing it from package.json passes `npm install` but breaks `ng build` with `Could not resolve "@angular/router"`. Keep it installed; you can still drop `provideRouter`/`app.routes.ts` since `NgtRoutedScene` is never instantiated (this app uses `NgtCanvas` from `angular-three/dom`).
- `ng test --run` does NOT exist in the Angular 21 `@angular/build:unit-test` (Vitest) builder — errors `Unknown argument: run`. Use `ng test --no-watch` (watch also defaults to false in non-TTY/CI). CLAUDE.md/docs historically wrote `--run` (a Vitest-CLI-ism); it's wrong. Use `--no-watch` in CI workflows.
- Re-adding a removed `@angular/*` dep with a caret (`^21.2.0`) makes npm resolve the newest patch (e.g. router 21.2.17), whose peer wants `@angular/core@21.2.17` while the rest of the workspace is pinned to 21.2.15 → ERESOLVE. Fix: `git checkout -- package-lock.json` then `npm install` so npm honors the already-locked compatible version instead of bumping.
- `@gltf-transform/cli@4.4.1`: the `optimize` flag is `--texture-size <px>`, NOT the older `--texture-resize` shown in ASSET_PIPELINE.md (errors `Unknown option`). `--texture-compress ktx2` shells out to the external KhronosGroup `ktx` binary (KTX-Software) — fails at the `uastc` step if not on PATH. Fallback `--texture-compress webp` needs no external binary (smoke test: mask 2.91MB → 98KB).
