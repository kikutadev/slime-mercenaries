# Mobile UI layout production correction

Status: Implemented; deployed and production-accepted on 2026-10-13
Date: 2026-10-13

## Player problem

Combat occupied too little of the portrait canvas. Camp management was a stretched bottom sheet with controls crowded at the top. Training, formation, and equipment inherited that empty layout. The first visit to Dispatch briefly blanked its entire screen, and Forge with no keys had no direct next action.

## Changes

- Give Camp management a dedicated full gameplay surface, preserving the established Camp → management → task back hierarchy.
- Replace duplicated selected-slime cards and one-line truncated tutorial calls to action with concise selections and readable actions.
- Give Training a focused slime/level/upgrade layout, Formation larger front/back slots, and Equipment a selected slime and weapon view. Keep Gold visible while managing.
- Improve the battle camera's portrait framing; suppress routine battle status while the fight is already visibly ongoing; demote the battle activity report.
- Preload screen components separately and keep the previous screen until destination code is ready. Keep Dispatch/Forge controls visible while their 3D environments initialize.
- Show an icon fallback until the 3D Camp hero is ready; stop the initial Nursery task from stretching an empty sheet.
- Make the zero-key Forge state lead directly to Battle and visually separate Settings from the four gameplay destinations.

## Acceptance

- Test a fresh first-play path: birth, training dummy, Sword Slime, management, training, formation, equipment, fusion, battle, dispatch, forge, settings, Forge → Battle.
- Inspect at 390×844 and 430×932 using Chrome for Testing; check no browser errors, correct task hierarchy, visible content during initial destination switching, large enough formation targets, resource visibility, and zero-key Forge CTA.
- Test a six-slime roster at 430×932 and confirm scrollable roster and readable front/back formation.
- Run local TypeScript, UI contract, unit tests, production build, bundle guard. Never substitute unit checks for visual acceptance.

## Follow-on polish

- Longer-session battle readability and motion QA at late-game, crowded six-slime and boss stages.
- Broader design-quality polish of Dispatch/Forge rewards and information density, separate from the first-play layout defects.

## Verification result

- Production build first-play and Forge→Battle at **390×844 / 430×932**, 15 snapshots and seven assertions per viewport: PASS, game-origin console/page errors 0. Runtime **35.17s / 35.01s** respectively.
- Six-class roster and formation at 430×932: PASS; runtime **18.39s**.
- Hero placeholder at the first Sword return is visible before GLB assets are ready, then the authored 3D character replaces it (observed after 4s).
- Full Vitest: 83 files / 498 tests PASS, **4.97s**.
- TypeScript: PASS, **4.19s** final measurement. UI contract: PASS, **0.37s**.
- Vite production build: PASS, **2.85s**. Bundle guard: PASS, **0.41s**, initial gzip **135.9 KiB** (budget 160 KiB).
- No GitHub Actions used.

## Public release

- Game source `dd23f3c` pushed to `origin/main`.
- Published through game portal using `GAMES_ONLY=slime-mercenaries` (no unrelated game build), Cloudflare Workers version `f5add81d-445d-45ba-8137-e6c7b50e045f`.
- Published page serves `assets/main-D9mhL3dq.js` and `assets/main-DTYIoRNa.css` (HTTP 200).
- On the public host, Cloudflare's `/cdn-cgi/rum` may return HTTP 404 independent of the game; the browser QA ignores that single host telemetry path but fails all game HTTP/request/JavaScript errors.

- **Public browser acceptance PASS** at **390×844 (35.97s)** and **430×932 (35.89s)**: 15 captures and seven behavior assertions each, with zero game-origin errors. All checks were run against the actual custom domain.
