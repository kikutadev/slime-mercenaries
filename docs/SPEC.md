# Slime Mercenaries — Current Specification

Status: Current
Date: 2026-09-16

## 1. Product form

- Platform baseline: smartphone portrait, 9:19.5 reference viewport
- Genre: auto-battle idle RPG / collection + fusion progression
- Session shape: 30 secondsでも進み、5〜15分触ると複数のmeaningful rewardが返る
- Main combat formation: 最大6枠、1枠につき1 slime type / 1 visible body
- Enemy population: 通常3〜12体、bossは1体 + 必要に応じてadds
- Primary presentation: fixed 3/4 top-down battlefield, characters move from lower field toward upper field
- Secondary idle use: main formation外のowned slime typesをdispatchへ割り当てる

`6 slots × 5 bodies = 30 friendly bodies` は現行仕様ではない。30体密度検証で小画面可読性とcharacter identityを損なうことを確認したため、メイン画面は少数表示へ変更した。

## 2. Canonical systems

Detailed behavior is owned by:

- evolution / fusion / roster -> [`specs/evolution-roster.md`](specs/evolution-roster.md)
- battle -> [`specs/combat.md`](specs/combat.md)
- progression / economy / loot / dispatch -> [`specs/progression-economy.md`](specs/progression-economy.md)
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
- slimeProgressByType
    - level
    - fusionRank / fusionProgress
    - promotion state
    - equipped weapon
- duplicateStockByType or equivalent unresolved-copy state
- mutationProgress

Formation
- up to six active slots
- assigned slime type per slot

Dispatch
- unlocked contract families
- active dispatch assignments
- startedAt / completesAt
- persisted reward resolution

Equipment
- owned equipment / refinement state
- equipment equipped per slime type
- equipment codex discovery

Economy
- gold
- forgeKeys
- promotion materials
- mutationFragmentsByFamily

Meta
- codex completion
- area/boss discoveries
- settings
- timestamps required for offline progress
```

Exact runtime schema may differ, but implementation must preserve these product concepts.

## 4. Roster model

A slime type is not a collection of persistent individual bodies.

Each discovered type owns one canonical progression state:

- `type level`: frequent Gold-based growth
- `fusion rank / progress`: same-type reacquisition-based growth
- `promotion`: branch-specific evolution Tier
- `equipped weapon`: one family-compatible weapon state
- `assignment`: battle / dispatch / reserve

A second copy of a discovered type is primarily fusion input. It does not permanently increase a population counter and does not add another same-type body to the battlefield.

## 5. Main formation

Normal combat uses up to six unique slime types.

Each occupied slot deploys exactly one visible slime body. Duplicate slime types cannot occupy several slots simultaneously; repeated acquisition strengthens the existing type through fusion instead.

Formation is a small-party composition decision, not a squad-size management system.

Initial product may unlock fewer than six slots during onboarding, but six is the cap unless a later product decision explicitly changes it.

## 6. Fusion contract

Fusion is a core growth path.

- reacquiring an already-discovered slime type grants fusion input for that type
- fusion raises that type's persistent fusion progression
- fusion must produce meaningful combat growth
- exact rank count, duplicate requirements, and coefficients are balance data
- reload must not duplicate or reroll a resolved fusion/acquisition result

### Body-size invariant

Fusion rank must **not** permanently increase the slime body's gameplay scale.

Strength progression should instead surface through:

- weapon quality / accents
- minor non-body silhouette accessories
- attack timing / count
- projectile / slash behavior
- trail / impact / VFX intensity
- unlocked signature behavior

A stronger slime should look more capable, not simply larger.

## 7. Evolution structure

The current content target retains 30 discoverable slime forms:

- 1 Plain Slime
- 6 Tier-1 job slimes
- 6 Tier-2 job slimes
- 12 Tier-3 specializations
- 5 rare mutation forms

This is a content target, not a requirement to produce all 30 before validating the core loop.

Core normal jobs are never locked solely behind premium acquisition or extremely low RNG.

## 8. Assignment contract

An owned slime type is conceptually in one of three states:

- `battle`: occupies one main formation slot
- `dispatch`: assigned to one active external contract
- `reserve`: owned but currently unassigned

A type cannot be in battle and dispatch at the same time.

Fusion input is not an independent deployable character and therefore has no assignment state.

## 9. Battle continuity

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

## 10. Loot contract

Enemies can produce battle drops and treasure chests. Chests are a primary excitement container.

Contents can include:

- slime acquisition / duplicate acquisition where appropriate
- equipment
- Gold
- Forge Keys
- promotion materials
- mutation fragments / rare cores

A dropped chest appears physically on the battlefield. The player may tap it to open immediately; if ignored it auto-opens so idle progression never stalls.

First-time normal job access remains deterministic even if repeated slime acquisition later contains variable rewards.

## 11. Equipment contract

Equipment remains a major random-draw collection system.

- equipment rarity and named weapons create collection depth
- duplicates convert into refinement progress, not dead inventory
- core evolution branches have deterministic unlock paths
- highest rarity contains multiple desirable items rather than one universal best item
- high-rarity equipment changes readable battle presentation, not only hidden stat multipliers

Slime fusion and equipment refinement are separate growth axes: slime duplicates strengthen the type; weapon duplicates strengthen the weapon.

## 12. Dispatch contract

Dispatch provides productive use for developed slime types that are not in the active battle formation.

Initial contract families stay simple:

- escort / guard -> Gold-biased
- exploration -> equipment / Forge Key-biased
- gathering -> promotion-material-biased

Dispatch is time-based and deterministic enough for an idle product. Initial core does not require failure chance, fatigue, elemental staffing grids, or per-body headcount.

A dispatch reward must be persisted when resolved so reload cannot reroll or duplicate it.

## 13. Progression layers

### Seconds/minutes

- Gold
- chest drops
- attacks / kills / hit reactions

### Minutes

- type levels
- fusion opportunities
- equipment upgrades
- job discovery / promotion
- dispatch start / return

### Session/day

- new area
- new specialization
- rare weapon
- mutation progress
- codex completion

### Long-term

- broad job/form discovery
- high fusion ranks on favorite types
- Mythic equipment collection
- post-launch prestige only after the base world loop is proven

## 14. Offline progression

Offline progression simulates expected combat output rather than replaying every entity.

On return, show one concise summary:

- elapsed effective offline time
- stages progressed or boss block reached
- Gold / equipment / material gains in aggregated form
- completed dispatches
- any NEW discovery separately emphasized

Offline normal-stage progress stops at an uncleared major boss intended as a progression checkpoint. It must never silently discard overflow reward.

## 15. Save and determinism expectations

Important progression actions must be idempotent where practical, especially:

- slime acquisition / duplicate resolution
- fusion
- chest opening
- equipment draw and pity advancement
- duplicate weapon refinement conversion
- evolution/promotion
- mutation redemption
- dispatch reward resolution / claim
- offline reward claim

Random results should be persisted at resolution time so reloads do not reroll already-resolved outcomes.

## 16. Initial content scope

Longer-term content target:

- 30 slime forms
- 8 areas
- 8 major bosses
- 6 weapon families
- 5 equipment rarities
- at least 12 Mythic named weapons
- 5 rare mutation paths
- Codex for slime and equipment discovery
- several reusable dispatch contract families

The first production-quality vertical slice should use a much smaller subset while preserving data structures capable of the target set.

## 17. Acceptance principles

The product is not accepted solely because numbers progress correctly.

A representative mobile play session must confirm:

- battlefield visually dominates UI
- 3〜6 friendly slimes remain individually readable
- each active slime's HP, attack source, hit reaction, and defeat are understandable
- fusion growth is noticeable without increasing body scale
- new job acquisition visibly changes silhouette and attack behavior
- high-rarity equipment visibly changes effects
- repeated slime acquisition creates a satisfying fusion opportunity rather than unwanted battlefield clutter
- reserve slimes can produce useful dispatch value without becoming spreadsheet micromanagement
