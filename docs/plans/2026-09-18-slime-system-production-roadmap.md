# Slime Mercenaries — System Production Roadmap

Status: In Progress
Date: 2026-09-21
Package manager: pnpm (`pnpm@11.25.0`)

## Goal

Bring the non-UI game system from the current strong vertical slice to the intended production structure without adding balance churn or mock-only behavior.

The plan is ordered by structural risk first, then content breadth.

## Phase 0 — Individual multi-slime roster

Status: Implemented

- persistent `SlimeInstanceId`
- same-type duplicate bodies remain owned instead of auto-merging
- same-type bodies can occupy multiple formation slots
- battle / reserve / dispatch exclusivity is per instance
- level / fusion / equipment are per instance
- spare reserve bodies may be explicitly converted into Fusion Core
- schema v4 migration preserves old saves

Detailed plan: `docs/plans/2026-09-18-multi-slime-roster.md`

## Phase 1 — Fusion form-growth correctness

Status: Implemented

Normal job form growth is now one authored Fusion axis rather than separate Promotion and Fusion systems.

Rules:

- Rank 1 is the Tier-1 job base.
- Rank 2 is the first family-specific combat/form enhancement.
- Rank 3 resolves to the authored Tier-2 form.
- Rank 4 requires an explicit choice between two authored Tier-3 specializations.
- `jobTier` is derived metadata written atomically by the Fusion step.
- branch identity is `fusionFormId`; no parallel promotion state is required.

Acceptance:

- Fusion never changes slime body size.
- Tier-3 branch choice is explicit and deterministic.
- Battle/Gallery resolve the same authored form and behavior from the stored Fusion state.

## Phase 2 — Fusion completeness across six families

Status: Implemented — complete Rank 1 -> 4 trees for all six normal families

All six families have the first enhancement, one Tier-2 form, and two explicit Tier-3 branch choices. Duplicate-body-to-Core conversion therefore has an authored sink through the full first-world growth path.

- recipes use obtainable shared materials
- Fusion rank affects authoritative analytical combat through the existing rank multiplier
- presentation metadata/model/behavior exists for every released Tier-2/Tier-3 form
- Tier-3 choice is deterministic and player-selected

## Phase 3 — Combat status/effect foundation

Status: Implemented

Introduce reusable product-owned combat effect primitives required by later jobs without moving combat into Kit Core:

- slow / freeze-style temporary control
- barrier / damage-reduction effect
- execute/low-HP condition helper
- temporary summoned attacker lifecycle
- bounded AoE / line-pierce target selection helpers

These should be deterministic and usable by live BattleRuntime and authoritative simulation where applicable.

## Phase 4 — Tier-3 production combat identity

Status: Implemented — production motion/VFX integrated and verified

All 12 Tier-3 models exist, but currently reuse Tier-2 battle behavior. Give every Tier-3 specialization a dedicated production motion/behavior and signature VFX using the gallery and battle runtime from the same implementation.

Families:

- Sword: Blademaster / Berserker
- Shield: Paladin / Fortress
- Bow: Sniper / Storm Archer
- Wand: Archmage / Frost Mage
- Dagger: Ninja / Assassin
- Gun: Cannoneer / Engineer

Primary acceptance is spectacle/readability at 1x mobile battle speed, not beat count.

## Phase 5 — Equipment family completeness

Status: Implemented — first-pass six-family Forge pool

Loadout infrastructure supports all six families, but authored weapon content is still concentrated in Sword/Bow.

- add production weapon pools for Shield/Wand/Dagger/Gun
- preserve per-instance loadouts
- keep concrete inventory instances single-owner when equipped
- later expand rarity/effect language without coupling it to roster identity

## Phase 6 — Rare mutations

Status: Existing-body mutations implemented — Mimic special capture remains

King / Golden / Dragon / Prism now have deterministic first-world acquisition, fragment backstops, authoritative Camp mutation actions, distinct gameplay effects, and shared Camp/Battle/Fusion/Dispatch visuals. They remain horizontal special forms layered on the authored normal job.

Mimic is deliberately separate because its identity is hostile-mimic capture, not conversion of an owned normal slime. It remains the unfinished part of this phase.

Detailed pass: `docs/plans/2026-09-21-rare-mutation-production.md`

## Phase 7 — World/content expansion

Status: Implemented — eight Areas / 40 Stages connected to production enemies, environments and progression

The first world now runs sequentially from Clover Road through Dragon Crater. Areas 2-8 have authored encounters, bosses, environment kits, stage rewards, frontier gates and same-core balance coverage.

## Phase 8 — Production release hardening

Status: In Progress — runtime economy modes, save transfer, route splitting, bundle guard and release gates implemented

- Settings exposes Normal / Development economy modes as separate durable profiles; Development resources, growth and Stage progress cannot contaminate Normal saves
- save export / import / delete is available through the shared Kit save envelope and operates on the active mode profile
- mobile performance/code splitting pass remains active
- release verification includes Clover Road profiles plus the full-world Tier-3 progression simulator

## Current implementation notes

- Save schema v6 stores `progression.areas[areaId].highestStageCleared` plus durable Codex discoveries/NEW state. Schema v4/v5 saves migrate without changing roster/loadout identity; inferred legacy Codex entries are marked viewed to avoid false NEW spam.
- Codex discovery is independent of current ownership: Tier-1 jobs, Fusion job forms, Rare Mutation forms, and weapon definitions persist once discovered. Fusion rank/form remains progression rather than a separate Codex entry.
- Every normal family has a complete Rank 1 -> Rank 4 Fusion tree, including one Tier-2 form and two Tier-3 choices.
- Temporary combat-effect primitives cover damage reduction, movement slow, execute thresholds and line-pierce distance.
- All 12 Tier-3 specializations now expose distinct battle behavior IDs, dedicated production motion contracts, and shared Gallery/BattleRuntime VFX. Tier-2 prototype fallbacks and the fake Engineer turret runtime were removed; Engineer uses the actual model turret root.
- Forge now contains one Common/Rare/Mythic weapon for all six families using the same per-family 55/18/2 weight pattern, preserving the prior aggregate rarity ratio.
- King/Golden/Dragon/Prism existing-body mutations now use a 10-fragment deterministic catalyst backstop, authored first-world milestones, selected Dragon origins, distinct combat/economy modifiers, and one shared visual decorator across Camp/Battle/Fusion/Dispatch. Mimic remains a separate special-capture problem.
- The first world contains eight canonical Areas and 40 authored Stages. Production enemies, bosses, environments, rewards and frontier balance are connected through the same sequential resolver.
- Area-aware battle activity/offline reports order progress across all 40 Stages, so an Area transition from Stage 5 to the next Area Stage 1 is shown as forward progress rather than a retreat.
- Battle, Camp resident 3D, and Fusion 3D are lazy boundaries. The production entry no longer statically preloads Three/R3F; current initial static JS is 408.5 KiB raw / 120.3 KiB gzip. `pnpm run check:bundle` enforces a 160 KiB gzip budget and rejects WebGL/3D-only chunks in the initial static graph.
- `pnpm run verify:release` is the single release-check entry point and runs typecheck, UI contract, full tests, production build, initial-bundle guard, the three Clover Road profiles, and the full-world Tier-3 progression gate.

## Verification contract

Use pnpm exclusively for this repo:

```text
pnpm run verify:release

# Individual gates remain available:
pnpm run typecheck
pnpm test
pnpm run build
pnpm run check:bundle
pnpm run simulate:balance
pnpm run simulate:check
pnpm run simulate:paced
pnpm run simulate:world:check
```

Do not add npm lockfiles or `npm run` commands.
