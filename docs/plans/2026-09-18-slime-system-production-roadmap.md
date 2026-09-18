# Slime Mercenaries — System Production Roadmap

Status: In Progress
Date: 2026-09-18
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
- level / promotion / fusion / equipment are per instance
- spare reserve bodies may be explicitly converted into Fusion Core
- schema v4 migration preserves old saves

Detailed plan: `docs/plans/2026-09-18-multi-slime-roster.md`

## Phase 1 — Promotion × Fusion composition correctness

Status: Implemented

Current risk: Sword Fusion presentation can override a promoted Fighter / Blademaster / Berserker, which collapses the intentionally separate Promotion and Fusion axes.

Rules:

- Promotion chooses the job form/model/primary battle behavior.
- Fusion remains an independent growth axis.
- Tier-1 Sword may use the Greatsword fusion model at the authored fusion milestone.
- Once promoted, the promoted job model/behavior remains authoritative; Fusion state is retained and may later add promoted-form modifiers rather than replacing the form.

Acceptance:

- Fighter + Greatsword fusion state still renders/behaves as Fighter.
- promotion does not erase `fusionRank` / `fusionFormId`.
- fusion does not erase `promotionPathId` / `jobTier`.

## Phase 2 — Fusion completeness across six families

Status: Implemented — first production sink for all six normal families

Sword and Bow already have authored Fusion trees. Shield / Wand / Dagger / Gun must have a real Core sink so duplicate-body-to-Core conversion is meaningful for every normal family.

System-completeness slice:

- at least one authored Fusion step for every normal family
- recipe uses already-obtainable shared materials; no new balance economy introduced just to close the system gap
- Fusion rank affects authoritative analytical combat through the existing rank multiplier
- presentation metadata exists for every released step
- later ranks and exact values remain balance/content work, not part of this system pass

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

Status: In Progress — system behaviors separated; production motion/VFX polish remains

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

Status: In Progress — Domain foundation implemented

Implement King / Golden / Dragon / Prism / Mimic as horizontal special forms with deterministic backstops. Do not require indefinite RNG for Codex completion.

## Phase 7 — World/content expansion

Status: In Progress — area registry + per-area save progression implemented

Expand beyond Clover Road toward the authored eight-area world. Reuse the enemy family production pipeline rather than creating area-specific one-off runtime logic.

## Phase 8 — Production release hardening

Status: Planned

- validation sandbox becomes explicit opt-in when the validation build is no longer the intended public build
- mobile performance/code splitting pass
- production economy enabled
- clean same-core simulator / typecheck / test / build gate using pnpm only

## Current implementation notes

- Save schema v5 stores `progression.areas[areaId].highestStageCleared`; schema v4 per-instance saves migrate without changing roster/loadout identity.
- Every normal family now has a usable Fusion Core sink. Sword/Bow keep their deeper authored trees; Shield/Wand/Dagger/Gun currently have the first system-completeness milestone only.
- Temporary combat-effect primitives cover damage reduction, movement slow, execute thresholds and line-pierce distance.
- All 12 Tier-3 specializations now expose distinct battle behavior IDs and distinct runtime mechanics. Animation/VFX review at 1x mobile speed is still required before Phase 4 is complete.
- Forge now contains one Common/Rare/Mythic weapon for all six families using the same per-family 55/18/2 weight pattern, preserving the prior aggregate rarity ratio.
- Existing-body Rare Mutation state exists for King/Golden/Dragon/Prism. Fragment thresholds are intentionally not invented. Dragon selected origins remain closed until authored; Mimic remains a separate special-capture problem.
- Areas are definition-driven instead of Clover-Road hardcoded. Areas 2-8 still need stage content; only the persistence/runtime structure is complete.

## Verification contract

Use pnpm exclusively for this repo:

```text
pnpm run typecheck
pnpm test
pnpm run build
pnpm run simulate:balance
pnpm run simulate:check
pnpm run simulate:paced
```

Do not add npm lockfiles or `npm run` commands.
