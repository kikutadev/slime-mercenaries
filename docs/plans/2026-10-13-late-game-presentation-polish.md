# Late-game visual readability, dispatch, and forge polish

Status: Implemented; local production acceptance PASS, deploy pending
Date: 2026-10-13

## Why

The first-play mobile layout correction left late-stage combat and non-first-use interactions insufficiently reviewed. In a six-slime party, full-health world-space bars overlapped bodies and an especially large boss could disappear behind the front row. The lava, moonlit-castle and dragon areas made the stage label nearly unreadable. Dispatch with no reserve exposed two competing controls, one disabled, and Forge's ten-draw result did not identify the ten weapons.

## Visual and interaction contract

1. Individual authoritative HP, combat timing, targeting, defeat and stage recovery remain unchanged. Hide only full-health *world-space* bars; preserve top enemy segments and party HP at all times. World-space bars return on damage.
2. When an encounter is a boss, spread front-line presentation anchors away from the boss silhouette, within portrait-safe bounds. Refresh the presentation anchors after every wave transition, not only initial load. Preserve the six distinct slots and combat simulation inputs.
3. Give the stage label a contrast-stable background across all authored environments and distinguish a boss HP HUD visually without obscuring combat.
4. With no reserve, Dispatch offers one unmistakable "編成を変更する" action; the selection, departure, running and return states remain intact.
5. Forge charging fills the workspace instead of revealing an empty console region. Each ten-draw result shows a weapon name, rarity, and new/duplicate outcome, and the list scrolls horizontally. Keep the best weapon announcement unobscured, with no duplicate success toast.

## Acceptance

- Inspect six job types at stage 5 in the early clover crowd and four late area bosses, including multiple combat frames for the dragon boss. Check full hero silhouettes in portrait and HUD/background contrast.
- Cover all eight areas in stage 1 and stage 5/boss with production gameplay assets.
- Run dispatch full party → formation → reserve → dispatch candidate → departure → running, and forge ten results, including horizontal exploration at 390×844 and 430×932.
- Run first-play normal-mode regression, targeted unit tests, full Vitest, typecheck, UI contract and production build, then release through the game portal and verify deployed UI.

## Observed results

- Chrome for Testing 390×844 authored scene sampling: five early/late states with screenshots (7.24s baseline, 12.71s portrait correction check), plus five boss states settled (12.67s) and five combat states (19.12s). Dragon-boss time series captured approximately every 0.85 seconds across attack/deformation/VFX beats (8.12s). Stage labels and boss silhouettes were inspected in those screenshots.
- Fixed the legacy world content QA script to use the separate Chrome for Testing binary and the development profile instead of the regular user Chrome and an inactive profile. All eight areas × stage 1/stage 5: 16 checks passed (19.25s).
- 390×844 midgame dispatch→forge live browser QA: PASS, 4.76s; 430×932: PASS, 4.70s. Ten detailed result cards each visible and horizontally scrollable; departure and running states verified.
- 390×844 normal first-play regression: PASS, zero game errors, 35.10s.

- Boss presentation adjusted again after comparison: first wider fan clipped leftmost ally on 390px portrait. Final anchors keep all six characters inside the camera view while reserving a lane to show the boss.
- Dragon boss combat motion inspected over several seconds (2s–6s), including separate enemy HP reduction, VFX hits, boss visibility, and party silhouettes.
- Full Vitest: 83 files / 500 tests PASS in 3.63s. TypeScript: PASS in 3.40s; UI contract PASS in 0.34s. Vite production build PASS in 2.52s, initial bundle guard PASS in 0.35s (135.9 KiB gzip / 160 KiB limit).
- Built production preview midgame UI PASS at 390×844 in 4.54s, including all ten weapons and real Dispatch departure.
- GitHub Actions not used.
