# Tier3 Bow production motion worker — DONE

Status: complete
Worktree: `/Users/kiku28/pj/game/.slime-tier3-motion-bow`

## Owned outputs

- `src/game/slime-motions/tier3/bow.ts`
- `src/game/slime-motions/tier3/bow.test.ts`
- `.tmp/tier3-motion-workers/bow-done.md`

No BattleRuntime, GalleryStage, gallery definition, other-family, main, or deploy files were changed.

## Sniper production contract

Primary read at 1x/mobile is **stillness -> tiny sight lock -> near-instant piercing line -> heavy recoil -> compact critical impact**.

Timing:
- attack: `1.18s`
- sight lock starts: `u=0.525`
- release: `u=0.565`
- impact: `u=0.658`
- projectile flight: `0.11s`
- normalized release-to-impact distance is aligned with `sniperArrowFlight`

Motion:
- aim deformation is intentionally tiny (no aim wobble/jump)
- lock is a short dedicated `sightLockPulse`
- release reaches full extension almost immediately
- recoil is large but short, followed by a small damped settle
- `u=1` returns deformation/equipment/VFX pulses to the stable combat anchor

VFX:
- `createSniperSignatureVfx()`
- `applySniperSignatureVfx(group, pose, source, target, cameraQuaternion)`
- `source` must be the **ProjectileOrigin world position**
- `target` must be the real target/impact world position
- hero shape is a thin source-to-target core/glow line
- sight lock is a compact cross glint at ProjectileOrigin
- critical impact is a compact four-ray star at the target
- no large ring/field substitute

Runtime behavior expected from parent wiring:
- use `TIER3_BOW_TIMING` / `TIER3_BOW_THRESHOLDS`; do not re-hardcode timing
- projectile/damage arrival should use the same 0.11s flight contract
- gallery must call the same VFX/motion functions as runtime

## Storm Archer production contract

Primary read at 1x/mobile is **charge -> airborne full draw -> three tightly grouped fan lines -> post-impact short chain lightning**.

Timing:
- attack: `1.10s`
- releases: `u=0.485 / 0.535 / 0.585`
- third-shot-to-chain start: `u=0.730`
- projectile flight: `0.16s`
- normalized third release-to-chain distance is aligned with `stormArrowFlight`

Motion:
- grounded electric charge compresses the slime
- full draw transitions into a clearly airborne pose
- three `shotPulses` overlap enough to read as one fan-volley signature, not Ranger-style double-shot
- body remains airborne through the short flight window
- chain/landing is a separate payoff beat
- recovery returns exactly to stable deformation/equipment at `u=1`

VFX:
- `createStormSignatureVfx()`
- `applyStormSignatureVfx(group, pose, source, [impact0, impact1, impact2], cameraQuaternion)`
- `source` must be the **ProjectileOrigin world position**
- the three impact points must come from actual runtime fan/multi-target behavior
- each shot owns an explicit thin core/glow line
- impact points are connected by short jagged chain segments after arrival
- charge accents are small local slashes only
- **no RingGeometry / TorusGeometry field is used**

Runtime behavior expected from parent wiring:
- select/provide three real fan endpoints or three actual targets
- resolve per-arrow hit/damage using the production release/flight timing
- begin chain behavior only after the last-arrow arrival contract
- do not replace the three real trajectories with a gallery-only fan

## QA / verification

Automated coverage includes:
- finite values across clamped and out-of-range samples
- exact stable return at `u=1`
- Sniper pre-release activity materially quieter than Tier2 Ranger
- Storm airborne overlapping 3-shot signature distinct from Ranger double-shot
- ordered/tightly grouped release timing
- release/impact and release/chain timing aligned with projectile-flight constants
- ProjectileOrigin-to-target beam placement/orientation
- three distinct Storm fan lines
- chain segment visibility
- explicit assertion that Storm signature contains no ring/torus field geometry

Verified:
- `pnpm typecheck` against this worktree tsconfig: PASS
- target Vitest: 11/11 PASS
- `git diff --check`: PASS

Because this detached worktree shares `node_modules` with the main checkout, pnpm 11 rejects direct worktree execution as an unsafe modules-dir target. Verification was therefore launched through the main checkout's pnpm installation while explicitly targeting this worktree's `tsconfig.json` / Vitest root; source under test is the worktree source.

## Parent integration note

This worker intentionally did not touch shared runtime/gallery wiring. The parent should wire these exports directly into BattleRuntime and the gallery, preserving the exact timing, source/target anchors, and VFX helpers above. No gallery-only fake motion is needed or desired.
