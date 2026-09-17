# Tier3 Defense production motion — worker handoff

Date: 2026-09-18
Branch: `tier3-motion-defense`
Baseline: `95a3c85706ee2d7fa4c166c1556ee03d0dbf657e`

## Scope

Owned/changed only:

- `src/game/slime-motions/tier3/defense.ts`
- `src/game/slime-motions/tier3/defense.test.ts`
- `.tmp/tier3-motion-workers/defense-done.md`

No BattleRuntime, GalleryStage, gallery definition, other branch motion, main, package metadata, deployment, or shared motion file edits.

## Production direction

### Paladin

The authored read is intentionally not “Guardian, but faster/larger.”

1. **White-gold shield consecration / flash**
   - shield winds inward while the body compresses;
   - `shieldFlashPulse` peaks before contact;
   - production VFX places the flash on the shield world position, not on the whole character.

2. **Single heavy holy shield-edge strike**
   - one committed body/shield release, rather than multi-hit speed;
   - `strikeProgress`, `holyImpactPulse`, and `hitStopPulse` expose the exact impact beat;
   - body translation remains restrained enough that the shield/body silhouette stays the hero.

3. **Post-impact sanctuary / barrier**
   - barrier starts only after the contact threshold;
   - `barrierProgress`, `barrierPulse`, and `sanctuaryPulse` are runtime-facing contract values;
   - the signature VFX contains a thin shell plus two ground sanctuary rings so the support effect reads as a sacred protected area rather than a generic flash.

Runtime contract:

- `getPaladinAttackMotion(u)`
- `createPaladinSignatureVfx()`
- `applyPaladinSignatureVfx(group, pose, cameraQuaternion, casterPosition, shieldPosition)`

Named production VFX nodes:

- `PaladinShieldFlashRing`
- `PaladinShieldFlashBlade`
- `PaladinHolyImpact`
- `PaladinBarrierShell`
- `PaladinSanctuaryOuter`
- `PaladinSanctuaryInner`

### Fortress

The authored read is “absolute immovability,” not a high-speed attack.

1. **Broad compression / brace**
   - reaches much deeper squash than Guardian;
   - no jump is authored anywhere in the full 0..1 timeline.

2. **Pavise slam / plant**
   - `plantProgress` drives a large negative shield angle into the planted pose;
   - body translation stays below 0.12 throughout;
   - `impactPulse` and `dustPulse` mark contact.

3. **Fortify lock**
   - after plant, character translation effectively stops;
   - body remains broad/low and the shield stays visibly planted;
   - `fortifyLock` reaches 1 and holds;
   - environmental motion carries the spectacle through `groundWaveProgress`, `groundWavePulse`, dust, lock ring, and four locking plates.

Runtime contract:

- `getFortressAttackMotion(u)`
- `createFortressSignatureVfx()`
- `applyFortressSignatureVfx(group, pose, cameraQuaternion, casterPosition)`

Named production VFX nodes:

- `FortressPlantImpact`
- `FortressGroundWave`
- `FortressLockRing`
- `FortressDust0..5`
- `FortressLockPlate0..3`

## Timing contract

- Paladin attack: **1.18 s**
  - shield flash marker: `u=0.27`
  - contact marker: `u=0.46`
  - barrier start marker: `u=0.50`
- Fortress attack: **1.38 s**
  - plant marker: `u=0.43`
  - fortify-lock marker: `u=0.50`
  - ground-wave end marker: `u=0.76`

These are exported through `TIER3_DEFENSE_TIMING` and `TIER3_DEFENSE_THRESHOLDS`; parent runtime should consume these instead of duplicating magic numbers.

## Stability / finite behavior

Both public motion functions normalize inputs at the module boundary.

- finite values are clamped to 0..1;
- NaN / +Infinity / -Infinity resolve to the stable start pose;
- `u=1` returns body/equipment to neutral transforms;
- Fortress `jump === 0` for every sampled frame.

This is covered by tests, including out-of-range/non-finite inputs and a 101-sample Fortress timeline.

## QA

Passed:

- `pnpm run typecheck`
  - executed with `pnpm_config_verify_deps_before_run=false` because pnpm 11's automatic dependency-status check tries to install/update this detached worktree before running scripts;
  - result: **PASS** (`tsc --noEmit`).
- `pnpm exec vitest run src/game/slime-motions/tier3/defense.test.ts`
  - same verify-deps override;
  - result: **PASS — 1 file, 6 tests**.
- targeted tests cover:
  - signature beat ordering;
  - stable return / finite values;
  - Fortress no-hop/no-dash invariant;
  - Paladin shield-local flash and post-impact barrier;
  - Fortress plant dust / ground wave / persistent lock geometry.
- `git diff --check`: run before commit.

Note: an initial pnpm invocation attempted to create `pnpm-lock.yaml` / `pnpm-workspace.yaml` due the dependency-status check. Those generated files were immediately removed; package metadata is unchanged. The pre-existing untracked `node_modules` symlink was left untouched.

## Parent integration notes

- Parent runtime should position Paladin's signature group with both **caster world position** and **shield world position**. This is important: the pre-impact white-gold flash must originate from the shield.
- Fortress should not inherit normal bounce while `fortifyLock` is active. The authored motion deliberately keeps `jump=0`; parent runtime should not layer an independent hop over it.
- A visual 1x/mobile acceptance capture cannot be produced inside this worker without editing/wiring the shared runtime/gallery, which is explicitly outside this lane. The module exposes all pose/VFX state required for the parent integration pass.
- Early compatibility exports `createPaladinBarrierVfx/applyPaladinBarrierVfx` and `createFortressLockVfx/applyFortressLockVfx` remain available, but new wiring should use the full signature functions above.

## Unresolved

No module-local blocker. Remaining work is coordinator-owned runtime/gallery wiring and real 1x/mobile visual acceptance after integration.
