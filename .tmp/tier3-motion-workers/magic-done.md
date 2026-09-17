# Tier3 Magic production motion — worker handoff

Date: 2026-09-18
Branch: `tier3-motion-magic`
Baseline: `95a3c85706ee2d7fa4c166c1556ee03d0dbf657e`
Scope: production motion module/tests only; shared runtime/gallery wiring intentionally untouched.

## Implemented

### Archmage

- Attack duration: `1.42s`; explicitly slower and more ceremonial than Mage.
- Deep body/weapon coil, then vertical release rather than a scaled Mage orb.
- Four independent converging rune VFX anchors plus the model/runtime mote boost contract.
- Large target-side ritual circle with outer/inner rings and spokes.
- Vertical meteor/large-spell descent contract:
  - `runeCharge`
  - `runeConvergence`
  - `moteBoost`
  - `grandCircle`
  - `meteorRelease`
  - `meteorDrop`
  - `impactPulse`
  - `impactDominance`
- Impact VFX has a large flash, ground shockwave, and camera-facing halo. The geometry scale is intentionally large enough for a brief 1x/mobile screen-dominant beat.
- Parent runtime thresholds:
  - release: `TIER3_MAGIC_THRESHOLDS.archmageReleaseU = 0.54`
  - impact: `TIER3_MAGIC_THRESHOLDS.archmageImpactU = 0.69`

### Frost Mage

- Attack duration: `1.32s`.
- Staff plant -> cold concentration -> rigid stillness -> sharp ice lance -> freeze field/crystal eruption.
- `coldStillness` explicitly exposes the frozen/no-bounce beat; the field phase has zero authored wobble/jump.
- Frost identity is geometry/timing based rather than Archmage recoloring:
  - six converging frost shards around the staff origin
  - long faceted lance rig
  - target-side freeze ring + translucent frozen interior
  - freeze flash
  - ten radial crystal spikes
- Parent runtime contract:
  - `staffPlant`
  - `frostCharge`
  - `coldStillness`
  - `boltRelease` / `iceLance`
  - `freezeField`
  - `spikeBurst`
- Parent runtime thresholds:
  - lance release: `TIER3_MAGIC_THRESHOLDS.frostReleaseU = 0.48`
  - target impact / field start: `0.64`
  - suggested persisted field hold is exported as `TIER3_MAGIC_TIMING.freezeFieldHold = 0.62s`

## Parent runtime integration contract

The module exports the production motion and VFX constructors/apply functions directly:

- `getArchmageAttackMotion`
- `createArchmageSignatureVfx`
- `applyArchmageSignatureVfx`
- `getFrostMageAttackMotion`
- `createFrostMageSignatureVfx`
- `applyFrostMageSignatureVfx`
- `TIER3_MAGIC_TIMING`
- `TIER3_MAGIC_THRESHOLDS`
- `TIER3_MAGIC_VFX_NODES`

Expected runtime usage:

1. Drive body/equipment from the returned pose.
2. Archmage: use `archmageReleaseU` to begin the large-spell descent and `archmageImpactU` for damage/camera shake/hit-stop. `impactDominance` is the short visual-impact envelope.
3. Frost Mage: use `frostReleaseU` to launch the lance, `frostImpactU` for damage/control application, and `freezeFieldHold` for the gameplay freeze-field lifetime if the runtime persists the field after the authored attack finishes.
4. VFX functions are null-safe so runtime/gallery owners can wire them incrementally.

No BattleRuntime, GalleryStage, gallery definition, model socket, or other branch file was edited.

## Stability / QA

Motion input is normalized through a finite-safe unit helper:

- finite values are clamped to `[0, 1]`
- `NaN` resolves to motion start
- `-Infinity` resolves to start
- `+Infinity` resolves to end

Tests cover:

- finite/deterministic return for normal, clamped, NaN, and infinite inputs
- Archmage charge -> convergence -> meteor descent -> impact -> recovery timing
- giant Archmage circle and large impact surface sizing
- Frost staff plant / cold stillness / lance / field / spike timing
- Frost field/spike VFX activation and size
- null-safe VFX application
- timing/threshold ordering

Validation completed:

```text
pnpm exec vitest run src/game/slime-motions/tier3/magic.test.ts --reporter=verbose
  1 file passed
  7 tests passed

pnpm typecheck
  PASS
```

The worktree shares a node_modules link whose lock metadata is stale. Validation therefore used
`pnpm_config_verify_deps_before_run=warn` so pnpm would run the existing toolchain without performing an automatic install. The first pnpm invocation attempted dependency synchronization; the two worktree-local untracked lock/workspace files it created were removed and are not part of this handoff.

## Residual / coordinator-owned work

- Wire this module into BattleRuntime and gallery definitions/stage.
- Hook Archmage `impactDominance` to production camera shake/hit-stop/optional exposure flash; this worker does not edit shared runtime.
- Apply actual meteor AoE and Frost freeze/slow gameplay effects at the exported impact thresholds.
- Persist Frost field for the desired gameplay duration using `freezeFieldHold`; the authored attack pose itself returns cleanly to idle at `u=1`.
- Validate the final integrated effect at real 1x portrait/mobile camera after parent-runtime wiring. The module intentionally provides large VFX geometry, but camera composition is owned by the parent integration.
