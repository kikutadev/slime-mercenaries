# Multi-Slime Roster / Duplicate Bodies

Status: Implemented
Date: 2026-09-18

## Goal

Change Slime Mercenaries from a one-canonical-record-per-job roster to a persistent **individual slime roster** so the player can keep multiple slimes of the same job type and use them independently.

The product behavior is:

- creating an already-discovered job creates another persistent slime body instead of auto-converting it into Fusion Core
- multiple Sword / Bow / etc. slimes may occupy different battle formation slots at the same time
- spare same-type slimes may be sent on Dispatch independently while another slime of that type is fighting
- each slime owns its own level, promotion path, Fusion rank/form, assignment, and equipment loadout
- Fusion remains explicit: an extra reserve slime may be intentionally converted into that family's Fusion Core; duplicate creation itself must never silently consume/merge the new body
- battle / reserve / dispatch exclusivity is per slime instance, not per job type

This replaces the previous canonical-type roster invariant.

## Product decisions

### 1. Persistent identity

Every combat slime receives a stable `SlimeInstanceId` and a creation serial. `typeId` continues to describe the job family.

```text
slime instance
├─ id
├─ serial
├─ typeId
├─ level
├─ jobTier / promotionPathId
├─ fusionRank / fusionFormId
└─ assignment
```

Formation slots and Dispatch assignments store instance IDs.

### 2. Job creation

`Plain Slime + Job Gear` always produces one new persistent Tier-1 slime.

- first body of a type: discovery event + body created
- later body of the same type: additional body created
- no automatic Fusion Core conversion

Discovery remains type-level metadata derived from whether at least one instance of that type exists; a separate duplicate character system is unnecessary.

### 3. Explicit duplicate-to-core conversion

To preserve the existing Fusion recipe economy without auto-merging duplicates, add an explicit Domain command that converts one chosen reserve slime into one family-specific Fusion Core.

Guardrails:

- the chosen slime must be in `reserve`
- another slime of the same type must remain after conversion
- battle/dispatch bodies cannot be consumed
- removing a slime also removes its loadout assignment; the weapon inventory item itself remains owned

This makes the choice reversible until the player explicitly commits the spare body to Fusion.

### 4. Per-instance progression

Level, Promotion and Fusion commands target `SlimeInstanceId`.

Two Sword slimes can therefore diverge, e.g.:

- Sword A -> Blademaster / high Fusion
- Sword B -> Berserker / different level

This is required for duplicate bodies to become meaningful roster choices rather than visual clones.

### 5. Per-instance equipment

Loadouts are keyed by slime instance ID. Weapon inventory remains global.

A concrete weapon instance may be equipped by only one slime at a time; equipping it to another slime transfers it from the previous holder.

### 6. Save migration

Bump the product schema version. Existing canonical saves are migrated deterministically:

- each old job record becomes one slime instance
- formation type IDs are remapped to the migrated instance IDs
- active Dispatch type IDs are remapped to the same instance IDs
- old per-type loadouts move to those migrated instances
- existing Fusion Core tokens remain untouched

Do not wipe existing local profiles.

## Implementation phases

### Phase A — Domain identity and save migration

- add `SlimeInstanceId`
- change roster storage to instance records
- add deterministic instance creation serial
- migrate schema v3 -> new schema
- add roster lookup helpers by type

Acceptance:

- two same-type instances survive serialization/migration
- existing v3 save retains formation, Dispatch and loadout ownership

### Phase B — Creation / progression / Fusion

- repeated job creation adds another body
- Level / Promotion / Fusion target one instance
- explicit duplicate-to-Fusion-Core command
- semantic events include both `slimeId` and `typeId`

Acceptance:

- creating Sword twice yields two owned Sword instance IDs
- neither body is automatically removed or merged
- either body can be leveled independently
- one reserve duplicate can be explicitly converted into Sword Core

### Phase C — Formation / combat / Dispatch

- formation slots store instance IDs
- remove the no-duplicate-type restriction
- analytical DPS/power counts every slotted instance
- Dispatch stores instance IDs and only locks the dispatched body

Acceptance:

- two Sword instances can occupy two formation slots simultaneously
- Sword A can battle while Sword B is dispatched
- one instance cannot be both battle and Dispatch

### Phase D — Equipment and presentation selectors

- loadouts keyed per instance
- selector/UI identifiers use instance IDs
- duplicate roster entries remain individually selectable
- duplicate labels are distinguishable without clutter

Acceptance:

- selecting one duplicate does not edit the other
- equipment follows the selected instance
- battle runtime receives unique IDs even when assets/behaviors are identical

### Phase E — Validation / simulator / regression

- validation-mode roster preparation uses created instance IDs
- simulator commands target instance IDs where appropriate
- update Domain/Application tests
- run typecheck, unit tests, build and all simulator checks

## Non-goals for this change

- roster capacity limits
- automatic duplicate sorting/locking/favorite systems
- mutation acquisition
- balance tuning of duplicate-heavy formations
- redesigning Camp UI beyond what is necessary to select and use duplicate bodies

Those can follow once the individual-roster invariant is stable.

## Implementation result

Completed on 2026-09-18.

- schema v4 persists stable slime instance IDs and creation serials
- schema v0-v3 migration remaps legacy roster, formation, Dispatch, and loadout references without wiping saves
- repeated normal-job creation produces another persistent body
- same-type instances can occupy separate formation slots and contribute independently to analytical combat
- same-type instances can split between battle and Dispatch
- Level, Promotion, Fusion, equipment, selectors, and validation mode target instance IDs
- spare reserve duplicates can be explicitly converted to family Fusion Core; battle/Dispatch bodies and the last body of a type are protected
- canonical specs were updated to make the individual-roster model authoritative

Verification:

- `pnpm run typecheck` — PASS
- `npm test` — 20 files / 97 tests PASS
- `pnpm run build` — PASS (existing large enemy-motion chunk warning remains)
- `pnpm run simulate:balance` — PASS
- `pnpm run simulate:check` — PASS
- `pnpm run simulate:paced` — PASS
