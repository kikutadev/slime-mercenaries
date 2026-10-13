# Ally defeat X-eye regression: visual review correction

Date: 2026-10-13
Status: Implemented, deployed, and verified on production domain

## What failed the player

The previous full-roster death-motion signoff (`2026-10-13-slime-all-job-motion-review.md`) was wrong. The eyes detached from the flattened jelly edge in **all 25 character screenshots**, yet were accepted because the old tests only asserted "visible" and "scale increased". The review did not judge whether the face was physically attached to the character. This prior acceptance is explicitly withdrawn.

## Root cause

`createAllyDefeatEyes` added two X meshes directly under the model root. Their material disabled depth testing and forced `renderOrder=12`, so they drew in front even outside the mesh. During defeat `updateAllyDefeat` scaled the whole jelly root vertically but divided the X-eye Y scale by that same factor and added a vertical offset; the gallery duplicated that logic. At full squash the eyes were visually detached from the front silhouette.

## Player-visible correction

- The X eyes now have normal depth testing and ordinary render order. Reduce bar size to fit a slime face.
- Reposition each pair continuously from standing face to the **upper surface** of the flattened jelly. Rotate the X strokes from forward-facing to upward-facing while collapsing; do not unscale or elevate them separately.
- Share exactly the same X-eye placement helper between battle runtime and the gallery. Reset restores the original eye positions/orientation, scales, and normal eyes for the next stage.
- Preserve actual defeat squash, character size, all gear, and underlying combat logic.

## Verification required

- Focused tests must assert normal depth behavior, surface-constrained coordinates, squash/recovery, and restoration; testing visibility alone is insufficient.
- Review real Chrome for Testing screenshots at 390×844 for 25 characters at 25/60/100% defeat progress; inspect the result as *a face still attached to the body*, not just presence of XX strokes.
- Confirm gameplay camera and full first-play browser QA. Then local full tests/build and public recheck after deployment.

## Local measured acceptance

- Focused defeat/eye tests: 8 / 8 PASS (0.72s). TypeScript: PASS (3.36s).
- Full Vitest: 86 files / 511 tests PASS (5.57s); UI contract PASS (0.38s); Vite production build PASS (2.96s); initial bundle guard PASS (0.41s, gzip 135.9 KiB under 160 KiB).
- Gallery at 390×844: all 25 actual GLBs × three defeat phases (25%, 60%, 100%) captured, 26.37s. Visual contact sheet manually inspected. The XX strokes lie inside the collapsed blue slime and no longer project below/in front of the body's edge.
- Front and original gameplay-facing camera checked; gameplay-facing sword family captured three phases in 5.18s.
- Live simulated boss battle (development fixture, all six allies at level 1, Dragon Crater stage 5): 48 frames captured in 14.95s; actual fallen ally shows eyes on the collapsed jelly, not a detached overlay.
- Normal-mode first-play at 390×844: 15 captures / 7 assertions PASS, game-origin errors 0, 35.40s.

We explicitly do **not** count these numerical test results as a substitute for inspecting the resulting geometry in the real mobile renderer. The acceptance statement above is backed by both screenshots and tests.

## Public release and verification

- Commit `21b829a` pushed to `origin/main`; deployed Cloudflare Worker version `2aead9a9-237d-412f-96bf-d33f330d8e35` at `https://games.kikuta.dev/slime-mercenaries/`.
- Live gallery at 390×844: 25 GLB characters × 3 defeat phases = 75 screenshot samples. Captures successful, no browser/page/asset errors (40.84s). Sword, Archmage and Engineer final defeat images individually inspected: X eyes are on the flattened jelly surface.
- Live Dragon Crater stage-5 boss battle: 48 rendered frames captured (16.40s) with six low-level combatants. This verifies actual battle rendering, **not** all 25 defeat animations in live combat. Do not call it a full animation acceptance.
- Public normal first-play 390×844: 15 screenshots, seven assertions PASS, zero game-origin errors (37.07s).

Future visual QA must include the explicit reject case of an X expression projected *in front of, above, or outside* the collapsed jelly silhouette. Merely checking that an X mesh exists or remains visible is insufficient.
