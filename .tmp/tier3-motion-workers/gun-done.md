# Tier3 Gun production motion — done

Date: 2026-09-18
Branch: `worker/tier3-motion-gun`
Scope: Cannoneer / Engineer production motion contract only

## Changed files

- `src/game/slime-motions/tier3/gun.ts`
- `src/game/slime-motions/tier3/gun.test.ts`
- `.tmp/tier3-motion-workers/gun-done.md`

No BattleRuntime, GalleryStage, gallery definition, other branch motion, model, main, deploy, or shared motion file was edited.

## Cannoneer

Implemented a deliberately single-shot Tier-3 signature rather than extending Gunner burst fire.

Timeline / contract:

- duration: 1.62s
- brace: early body/cannon planting
- charge: long compression/tremor through approximately u=0.49
- shell release: u=0.50
- giant muzzle flash/core: starts exactly at release, not before it
- recoil peak: u=0.56
- maximum authored body recoil: -0.46 along attacker -> target axis
- shell/tracer flight: u=0.50 -> 0.77
- shell arc height contract included
- impact: u=0.77
- impact flash, expanding explosion, lingering impact smoke, and optional screen-punch scalars included
- character/equipment returns to stable baseline by u=1

Parent-runtime handoff fields are exposed through `CannoneerSignatureMotionPose` / `CannoneerSignatureVfxPose`, plus:

- `getCannoneerShellReleaseU()`
- `getCannoneerImpactU()`
- `CANNONEER_SIGNATURE_TIMING`

The runtime can independently consume muzzle flash, smoke, tracer, shell travel/arc, impact flash, explosion radius, impact smoke, and screen punch.

## Engineer

Implemented a build/deploy signature where the gadget lifecycle is the visual centerpiece.

Timeline / contract:

- loose-parts gathering begins u=0.06
- jelly-assisted assembly u=0.20 -> 0.49
- turret deployment u=0.43 -> 0.63
- turret activation beat u=0.64
- short payoff burst only after deployment: u=0.70 / 0.78 / 0.86
- retract starts u=0.90
- character/equipment/turret visible transform returns to stable baseline by u=1

Assembly contract exposes:

- loose-parts opacity/radius/rotation/lift
- gathering energy pulse/scale
- assembly sparks
- turret activation pulse
- turret deploy progress / visibility / lift / yaw
- turret recoil / muzzle pulse
- active shot index / shot-local progress
- ordered shot release helper

This intentionally keeps most of the authored duration on gathering, assembly, deployment, and activation; the burst is a short final payoff, not Gunner with more bullets.

Parent-runtime entry points:

- `getEngineerSignatureMotion(u)`
- `getEngineerTurretShotReleaseU(index)`
- `ENGINEER_SIGNATURE_TIMING`

## Stability / robustness

Both signature functions sanitize non-finite and out-of-range normalized input before evaluating the timeline.

Tests verify:

- finite numeric return values for boundary, out-of-range, NaN, and Infinity inputs
- stable character/equipment endpoint
- stable turret/VFX visibility endpoint
- Cannoneer has no pre-release muzzle flash
- Cannoneer charge/brace, large recoil, shell arc/tracer, smoke, and impact explosion are all independently observable
- shell release occurs before impact
- Engineer parts/energy and assembly occur before turret deployment/fire
- turret activation occurs before burst
- burst release points are ordered and compressed into a short post-deployment window
- turret retracts after the burst

## QA

Passed:

```text
pnpm --config.verify-deps-before-run=false exec vitest run \
  src/game/slime-motions/tier3/gun.test.ts \
  src/game/slime-motion.test.ts \
  --pool=threads --maxWorkers=1

Test Files  2 passed (2)
Tests      10 passed (10)
```

Passed:

```text
pnpm --config.verify-deps-before-run=false run typecheck
$ tsc --noEmit
```

The config override is required only because this worktree's untracked `node_modules` is a symlink to the main repo node_modules; pnpm 11 otherwise refuses its dependency pre-run safety check because the resolved modules directory is outside this worktree. No dependency/source file was modified for this.

## Parent integration notes

- Cannoneer `bodyOffset` follows the existing motion convention: negative means recoil away from the target.
- Cannoneer shell spawn/damage should use the exported release/impact timing helpers rather than deriving thresholds separately.
- `shellTravelProgress` is -1 before spawn and 0..1 in flight; `impactProgress` is -1 before impact and 0..1 afterward.
- Engineer turret is expected to be hidden/folded when `turret.visibility` is zero. Runtime should use `EngineerTurretRoot` / turret muzzle nodes from the model when parent wiring is added.
- Engineer loose part placement can use `partsRotation` as a shared phase and offset individual parts by index around `partsRadius`.
- Runtime/gallery visual acceptance at real 1x smartphone scale remains parent integration work because this lane is explicitly forbidden from editing BattleRuntime/GalleryStage/gallery definitions.

## Unresolved

No module-level blocking issue.

The remaining acceptance item is parent-side runtime/gallery wiring and real 1x smartphone visual inspection of the supplied VFX contracts.
