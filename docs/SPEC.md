# Slime Mercenaries — Current Specification

Status: Current
Date: 2026-09-15

## 1. Product form

- Platform baseline: smartphone portrait, 9:19.5 reference viewport
- Genre: auto-battle idle RPG / collection progression
- Session shape: 30 secondsでも進み、5〜15分触ると複数のmeaningful rewardが返る
- Core controlled objects: 6 squad slots
- Runtime battlefield population: 味方最大おおむね30体、敵は通常3〜12体、bossは1体＋必要に応じてadds
- Primary presentation: fixed 3/4 top-down battlefield, characters move from lower field toward upper field

## 2. Canonical systems

Detailed behavior is owned by:

- evolution / roster -> [`specs/evolution-roster.md`](specs/evolution-roster.md)
- battle -> [`specs/combat.md`](specs/combat.md)
- progression / economy / loot -> [`specs/progression-economy.md`](specs/progression-economy.md)
- UX/UI -> [`specs/ux-ui.md`](specs/ux-ui.md)
- art -> [`specs/art-direction.md`](specs/art-direction.md)

This document owns only top-level contracts shared by multiple systems.

## 3. Player-owned state

The durable player state must conceptually contain:

```text
Progression
- currentAreaId
- currentStage
- highestStageCleared
- unlockedSystems

Roster
- discoveredSlimeTypeIds
- squadProgressByType
- plainSlimePopulation
- mutationProgress

Formation
- six squad slots
- assigned slime type per slot

Equipment
- owned equipment / refinement state
- equipment equipped per slime type
- equipment codex discovery

Economy
- gold
- slimeGel
- forgeKeys
- mutationFragmentsByFamily

Meta
- codex completion
- area/boss discoveries
- settings
- timestamps required for offline progress
```

Exact runtime schema may differ, but the implementation must preserve these product concepts.

## 4. Unit model

A slime type is not a named individual hero.

Each discovered type owns:

- `type level`: ordinary Gold-based growth
- `mastery`: usage/evolution progression
- `population`: how many bodies that type can field
- `equipped weapon`: one weapon record or weapon family state
- `promotion`: branch-specific Tier

The player does not manage separate per-body inventories or random personal stats.

## 5. Six-slot formation

Exactly six squad slots form the normal combat team.

Each slot represents one slime type. Duplicate slime types cannot occupy multiple formation slots simultaneously; increasing the same type is expressed through its population and squad growth instead.

A type deploys multiple visible bodies according to squad size:

| Squad milestone | Visible bodies |
|---|---:|
| initial | 1 |
| early growth | 2 |
| established | 3 |
| veteran | 4 |
| endgame cap | 5 |

Six maxed squads therefore produce up to 30 visible friendly slimes.

## 6. Evolution structure

The launch roster contains exactly 30 discoverable slime types:

- 1 Plain Slime
- 6 Tier-1 job slimes
- 6 Tier-2 job slimes
- 12 Tier-3 specializations
- 5 rare mutation slimes

Core jobs are never locked behind premium-only acquisition or extremely low RNG.

## 7. Battle continuity

Combat is continuous.

```text
wave enters
-> auto movement / target selection / attack
-> wave clear
-> short march forward
-> reward resolution without leaving battlefield
-> next wave
-> boss at stage boundary
```

Routine rewards must not require a claim modal.

When the player is idle, full Jelly Rush gauge auto-fires after a short grace period; active players can fire immediately. Manual interaction accelerates gratification but does not determine whether offline/idle combat functions.

## 8. Loot contract

Enemies can produce battle drops and treasure chests. Chests are the primary excitement container.

Chest contents can include:

- equipment
- Gold
- Slime Gel
- Forge Keys
- promotion materials
- mutation fragments / rare cores

A dropped chest appears physically on the battlefield. The player may tap it to open immediately; if ignored it auto-opens so idle progression never stalls.

## 9. Equipment contract

Equipment acquisition is the main random-draw collection system.

- character/slime types are not sold as a conventional hero gacha pool
- equipment rarity and named weapons create collection depth
- duplicates convert into refinement progress, not dead inventory
- core evolution branches have deterministic unlock paths
- highest rarity contains multiple desirable items rather than one universal best item

Equipment must affect readable battle presentation at higher rarity, not only hidden stat multipliers.

## 10. Progression layers

Progression is split into four visible horizons.

### Seconds/minutes

- Gold
- chest drops
- squad attacks / kills
- Jelly Rush

### Minutes

- equipment upgrades
- type levels
- squad population increase
- Tier progression

### Session/day

- new area
- new specialization
- rare weapon
- mutation progress
- codex completion

### Long-term

- full 30-type discovery
- Mythic equipment collection
- high squad population
- post-launch Migration prestige, only after the base world loop is proven

## 11. Offline progression

Offline progression simulates expected combat output rather than replaying every entity.

On return, show one concise summary:

- elapsed effective offline time
- stages progressed or boss block reached
- Gold / Gel earned
- chests/equipment obtained in aggregated form
- any NEW discovery separately emphasized

Offline progress may advance normal stages but must stop at an uncleared major boss that is intended as a progression checkpoint. It must never silently discard overflow reward.

## 12. Save and determinism expectations

Important progression actions must be idempotent where practical, especially:

- chest opening
- equipment draw and pity advancement
- duplicate refinement conversion
- evolution/promotion
- mutation fragment redemption
- offline reward claim

Random reward results should be persisted at resolution time so reloads do not reroll already-resolved outcomes.

## 13. Initial content scope

Initial content target:

- 30 slime types
- 8 areas
- 8 major bosses
- 6 weapon families
- 5 equipment rarities
- at least 12 Mythic named weapons
- 5 rare mutation paths
- 1 Jelly Rush system
- Codex for slime and equipment discovery

The first implementation may ship with less content while preserving data structures capable of the target set.

## 14. Acceptance principles

The product is not accepted solely because numbers progress correctly.

A representative mobile play session must confirm:

- battle space visually dominates UI
- 10+ friendly bodies remain readable
- 20〜30 friendly bodies still look intentional rather than noisy
- new job acquisition visibly changes silhouette and attack behavior
- high-rarity equipment visibly changes effects
- chest cadence produces anticipation without interrupting battle every few seconds
- player can understand formation and improvement opportunities without reading stat spreadsheets
