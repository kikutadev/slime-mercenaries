# Gallery shared playback freeze regression

Date: 2026-10-13
Status: Implemented; public production acceptance PASS

## User-visible regression

The previous release linked users to `?slime=sword&motion=defeat&frame=1&camera=front` as if it were an animation preview. The `frame=1` parameter was introduced exclusively to freeze the last attack/defeat frame for screenshot review. The public UI also preserved the parameter when Replay, motion, camera, or selected slime changed, so visitors saw a static GLB even while the Loop and Replay controls appeared enabled.

Production Chrome for Testing (390×844) before this correction confirmed that the ordinary no-frame URL changed rendered poses while the old `frame=1` URL remained fixed over five separate observations.

## Correction

- A fixed `frame` is honored **only** when accompanied by `qa=1`. A bare `frame` from previously shared links is removed automatically, and the scene animates normally.
- All interactive gallery controls exit fixed-frame QA mode before applying user changes: slime selection, motion, speed, camera, Loop, Dummy, and Replay. Replay cannot remain stuck in a frozen phase.
- The existing full-motion screenshot QA runner now explicitly uses `qa=1` for deterministic poses. No consumer-facing play controls depend on the review parameter.
- Combat gameplay and underlying slime motion curves remain unchanged.

## Acceptance requirements

- Old public shared URL containing `frame=1` must animate without the visitor having to edit the URL.
- Explicit `qa=1&frame=1` must remain deterministic for capture tooling.
- Replay and motion changes from a QA URL must restore live playback and remove the two QA parameters.
- Verify the changing pixels of the actual WebGL stage in real Chrome, not merely the existence of a running timer.
- Run unit tests, full suite, TypeScript, production build, initial bundle guard, and the same visual QA against the public custom domain after deployment.

## Local verification

- Production custom domain **before fix**: no-frame defeat URL displayed changing real 3D poses, while `frame=1` stayed identical across five screenshots. Both loaded with zero page errors.
- Local Chrome for Testing **after fix** (390×844, 7.34s): ordinary *old* shared URL produced 3 distinct rendered frames, explicit `qa=1&frame=1` produced exactly 1, Replay after QA produced 3, and selecting Attack resumed animation. JavaScript/asset errors: 0.
- Full Vitest: 86 files/512 tests PASS (5.70s), TypeScript PASS (3.95s), UI contract PASS (0.37s), Vite build PASS (2.86s), initial bundle PASS (0.41s, gzip 135.9 KiB/160 KiB budget).

## Public deployment and verified outcome

- GitHub `origin/main` implementation commit `a01dfd7`.
- Cloudflare Workers custom domain `https://games.kikuta.dev/slime-mercenaries/gallery/` deployed as version `b8da180b-9ce7-4caf-b69b-f643218d7f97`, serving `gallery-B0puqgOF.js`.
- On the live domain, verified at 390×844 that the formerly frozen `frame=1` shared URL now generated **three distinct actual WebGL frames**, explicit `qa=1&frame=1` remained deterministic (**one distinct frame**), and Replay and Attack selection resumed playback (**three distinct frames each**). Zero page/asset errors, 10.38s.
- The game combat system was not modified; this correction is confined to gallery playback URLs and QA tools.
