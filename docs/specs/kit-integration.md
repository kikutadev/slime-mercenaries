# Idle Game Kit Integration

Status: Current implementation boundary
Date: 2026-09-19

## 1. Goal

Slime Mercenaries should use `idle-game-kit` for reusable idle-game invariants without moving product identity into the Kit.

The integration rule is:

> **Kit owns reusable economy/time/persistence primitives. Slime Mercenaries owns combat, job creation, Fusion recipes/branches, and battle-facing behavior.**

The authoritative product Domain, browser profile, React/Three presentation, offline advancement, and balance simulator now share the same persisted `SlimeMercenariesState` and product commands. Three.js remains presentation-only: it animates the current formation/encounter but does not own durable progression, loot, Fusion, Equipment, or Stage rewards.

## 1.1 Current implementation status

Completed on 2026-09-16:

- vendored `idle-game-kit` public package from source commit `ab71170d8cd51297f54f9a1d982fa35c593080e5`
- canonical `GameState<SlimeMercenariesData>` with schema migration, Gold, Tokens, named RNG, Equipment Inventory/Loadout, Dispatch, Formation, and progression state
- definition-driven Plain craft/shop/job creation, Type Level, and branched Fusion
- Forge Key-funded Kit Gacha, persistent Equipment instances, duplicate refinement, family Loadouts, and overflow material
- analytical Wave/Stage/Boss/reward progression with deterministic loot RNG
- Kit Timed Activity-backed deterministic Dispatch
- IndexedDB/ProfileRepository persistence and same-core online/offline world advancement
- same-core simulator command surface for craft/buy/job/level/fuse/forge/equip/dispatch/progress
- balance targets and all routine tuning values centralized in `src/domain/balance.ts`
- React/Three presentation bound to the persisted authoritative state; the old local roster/fusion inventory fixture has been removed

The current content implementation deliberately covers the Sword/Bow vertical slice. Expanding to the full job tree, 30-form content target, and eight areas is content production, not a remaining Kit-integration dependency.

## 2. Package/dependency boundary

Slime Mercenaries is an independent product repository. It must not import Kit source files through relative paths such as `../../src/...` and must not require a sibling Kit working tree to be clean or present at runtime/build time.

Until `idle-game-kit` is published to an immutable package registry, follow the proven Grimoire Rewrite pattern:

```text
clean idle-game-kit source commit
-> pnpm build:kit
-> copy dist-kit public package into slime-mercenaries/vendor/idle-game-kit
-> record source commit/package version in provenance documentation
-> package dependency: file:./vendor/idle-game-kit
```

Product code imports only public entry points:

```ts
import { ... } from 'idle-game-kit';
import { ... } from 'idle-game-kit/web';
import { ... } from 'idle-game-kit/simulator';
import { ... } from 'idle-game-kit/react'; // only if useful
```

Do not deep-import Kit internals. When Kit changes, rebuild from a clean source commit and update the vendored artifact/provenance atomically. Once a registry package is available, replace vendoring with an immutable package version.

## 2.1 Current implementation status (2026-09-18)

Connected and verified:

- vendored public Kit package from recorded clean source commit `ab71170d8cd51297f54f9a1d982fa35c593080e5`
- Gold Currency and countable Token resources
- Plain craft/shop/job creation, Type Level, and branched Fusion
- deterministic Wave/Stage/Boss analytical progression and loot RNG
- same-core online/offline advancement
- ProfileRepository boundary with browser IndexedDB adapter and schema-v0/v1/v2 -> v3 migration
- Equipment Inventory/Loadout, Forge Gacha, refinement, and family restrictions
- reserve Dispatch using Kit Timed Activity
- balance simulator with authored P90 target bands and the same product command adapter
- React/Three presentation consuming the authoritative saved state instead of a local progression fixture

The first-loop target remains first Fusion at 1–3 minutes and Clover Road boss at 3–5 minutes. Exact observations are simulator outputs, not hard-coded production logic.

### Public validation build

The currently published build is intentionally a content-validation sandbox. `VITE_VALIDATION_MODE=true` replenishes Gold and authored token resources at the Application boundary while keeping production Domain commands, recipes, Fusion branches, formation rules, combat projection, and persistence active. The UI renders replenished holdings as `∞` but still shows authored costs. Set `VITE_VALIDATION_MODE=false` when the public build returns to the real economy.

Validation-only helpers may prepare the six normal job families, jump an owned slime to Lv.40, reset one slime to its Tier-1/base form, or restart Clover Road. They must not be used by same-core simulator policies and must remain outside Domain balance/economy definitions.

## 3. Capability mapping

| Slime Mercenaries concept | Kit capability | Integration | Owner |
|---|---|---|---|
| Gold | `CurrencyDefinition` / transaction | direct | Kit primitive + product balance |
| Plain Slime stock | Token balance | direct | product token ID / Kit count invariant |
| slime-generation material | Token balance | direct | product token IDs |
| Job Gear | Token balance initially | direct | product definitions |
| Forge Key | Token balance | direct | product definition |
| Fusion material/component | Token balance | direct | product definitions |
| Mutation fragments | Token balance | direct | product definitions |
| Type Level curves | `LevelDefinition`, `previewLevelUp` | adapter | Kit curve math + product command |
| equipment ownership | `InventoryState` / `ItemInstanceState` | direct foundation | Kit ownership invariant + product item data |
| per-slime weapon slot | `LoadoutDefinition` / `LoadoutState` | adapter | Kit equip invariant + product family rules |
| equipment rarity/refinement/effects | item `data` + product commands | product-specific | Slime Mercenaries |
| Forge draw | `GachaDefinition` + named RNG with Token cost | direct/adapted | Kit draw integrity + product weapon pool/refinement hooks |
| Dispatch timer | `TimedActivityDefinition/State` | adapter | Kit time semantics + product assignment |
| Dispatch eligible slime / power requirement | Game Plugin / product command | product-specific | Slime Mercenaries |
| offline elapsed time | Application offline-time contract | direct | Kit |
| analytical offline combat | product advance/plugin using same state | product-specific | Slime Mercenaries |
| persistence | `ProfileRepository`; Web uses IndexedDB | direct | Kit/platform |
| Cloud Save later | optional Kit Cloud Save | direct after local save | Kit/platform |
| reward aggregation | `Reward` / `RewardSignal` / offline summary | adapter | shared boundary |
| achievements/missions later | Kit definitions | optional | Kit primitive + product content |
| combat runtime | none intentionally | product-specific | Slime Mercenaries |
| target selection / HP / wave / boss | none intentionally | product-specific | Slime Mercenaries |
| Job creation | product atomic command using Kit Currency/Token helpers | product-specific | Slime Mercenaries |
| Fusion recipe | product atomic command using Kit Token helpers | product-specific | Slime Mercenaries |

## 4. Recommended authoritative state boundary

Use Kit `GameState<TGameData>` as the outer save/economy envelope when the integration is implemented. Slime Mercenaries-specific state belongs in `gameData`.

Conceptually:

```text
Kit GameState
├─ simTimeSec / wall-clock metadata
├─ currencies
│  └─ currency.gold
├─ tokens
│  ├─ stock.plain-slime
│  ├─ material.slime-gel
│  ├─ material.life-water
│  ├─ job-gear.sword
│  ├─ job-gear.bow
│  ├─ fusion-core.sword
│  ├─ fusion-component.greatsword-blank
│  ├─ fusion-material.hardening-gel
│  ├─ forge-key
│  └─ mutation tokens...
├─ inventory
│  └─ persistent combat equipment instances
├─ activities
│  └─ reusable dispatch timing states where appropriate
├─ RNG streams / gacha state / unlocks
└─ gameData: SlimeMercenariesGameData
   ├─ currentAreaId / currentStage / areas[areaId].highestStageCleared
   ├─ slimeInstancesById
   │  ├─ stable instance ID + job type
   │  ├─ level
   │  ├─ fusion rank/form + derived job tier
   │  └─ assignment
   ├─ formation slots storing instance IDs
   ├─ per-instance loadout references
   ├─ active dispatch assignment metadata
   ├─ boss/checkpoint state
   └─ combat/offline model state needed for deterministic progression
```

Slime Mercenaries now owns a persistent individual-roster model, but it does not need to force those records into Kit `Instance Character`. Stable slime instance IDs and their product-specific progression live in `gameData`; Kit Inventory/Loadout and other primitives are composed around those IDs. Extract a generic character-instance abstraction only if another product proves the same contract.

Plain Slime stock is likewise a Token/resource, not a Character instance. A fieldable Plain Slime, if introduced, remains a product roster instance separate from Plain stock.

## 5. Atomic product commands

### 4.1 Craft Plain Slime

Product command:

```text
CraftPlainSlime(recipeId, count)
```

Responsibilities:

1. resolve authored recipe
2. preview all Token requirements
3. reject with original state if any requirement is missing
4. spend required generation materials
5. grant `stock.plain-slime`
6. emit one semantic product event / reward signal
7. checkpoint through Application policy

Kit Token helpers can perform immutable count updates, but multi-resource atomicity belongs in the product command. Do not mutate the state after the first spend until every requirement has been validated.

### 4.2 Buy Plain Slime

Product command:

```text
BuyPlainSlime(count)
```

Uses Kit Currency transaction rules and the same authored price curve used by UI/simulator. It must atomically spend Gold and grant Plain stock.

The shop is a deterministic progression backstop, not premium monetization.

### 4.3 Create Job Slime

Product command:

```text
CreateJobSlime(jobFamilyId)
```

Inputs:

- Plain Slime stock x1
- matching Job Gear x1
- optional authored Gold cost

Resolution:

```text
consume inputs
create a new persistent slime instance with stable instance ID
if this is the first owned instance of the type:
    mark discovery / Codex
    emit NEW job reward signal
else:
    emit duplicate-body/recruit reward signal
```

Duplicate creation never auto-merges. A separate product command may explicitly convert an eligible reserve duplicate into the family Slime Core; that conversion is product gameplay and should not be represented as a generic Kit gacha duplicate policy.

### 4.4 Fuse Slime

Product command:

```text
FuseSlime(slimeInstanceId, fusionStepId?)
```

Inputs are authored recipe requirements such as:

```text
Sword Slime Core x1
Greatsword Blank x1
Hardening Gel x2
minimum Type Level 10
```

The command validates the whole recipe first, spends all resources atomically, and advances `fusionRank/fusionForm` together with the authored `jobTier`. If the current rank has multiple results, `fusionStepId` is required so the player explicitly chooses the specialization. The command emits combat-behavior unlock metadata used by presentation and simulator.

Fusion is the only normal form/tier progression command. The first family enhancement, Tier-2 form, and Tier-3 specialization all use this same atomic path.

## 6. Level integration

Use Kit `LevelDefinition` and curve/preview functions for Type Level math. Do not use a second product-only level-cost implementation.

The Slime roster record remains in product `gameData`, so level-up should be a thin product command:

```text
preview Type Level with Kit LevelDefinition
-> verify/spend Gold with Kit Currency transaction
-> update slimeInstancesById[slimeInstanceId].level
-> emit semantic level event
```

This gives production UI and simulator the same cost/stat curves without requiring the product-owned slime instance record to become a Kit Character instance.

## 7. Equipment / Forge integration

Use Kit Inventory/Loadout as the ownership/equip foundation, but keep RPG behavior product-owned.

Recommended split:

- `ItemDefinition.tags`: weapon family / equipment category eligibility
- `ItemInstanceState.data`: rarity, refinement progress, product-specific roll/version metadata
- `LoadoutDefinition`: one combat-weapon slot per slime-equipment context where practical
- product selectors: effective ATK/projectile/behavior modifiers
- product commands: duplicate refinement, cap overflow, named weapon effects

Current vertical-slice implementation stores one unique weapon instance per definition, increments `refinementRank` on duplicates, converts capped duplicates to family material, auto-equips the first compatible weapon into an empty instance Loadout, and applies the effective weapon/refinement multiplier to analytical combat. A concrete weapon instance may be equipped by only one slime instance at a time; equipping it elsewhere transfers it.

Forge uses Kit deterministic Gacha with a Token-funded cost. Kit `GachaDefinition.cost` was extended backward-compatibly to accept either Currency or Token cost, with Kit-level regression tests and the existing Currency consumers preserved. Slime Mercenaries keeps Forge Key as a Token, supplies the weapon pool/pity data, and resolves acquisition/duplicate hooks into Kit Inventory/Loadout plus product refinement semantics. The vendored package records the exact Kit source commit that contains this contract.

Job Gear should **not** be stored as combat Equipment instances initially. It is a countable profession catalyst and fits Token storage better. If future Job Gear becomes individually rolled/equippable, reconsider then rather than over-modeling now.

## 8. Dispatch integration

Kit Timed Activity is a good clock/completion primitive but not the whole dispatch system.

Product-owned dispatch assignment records the slime instance ID on each contract and enforces:

- instance is owned
- instance is reserve, not battle
- instance is not already dispatched
- another same-type instance may remain in battle
- product power threshold or other simple requirement is met

Recommended initial rule remains deterministic power thresholds rather than failure percentages.

A dispatch run can use a Timed Activity state for duration/completion semantics. If multiple concurrent runs of the exact same contract definition are required, Slime Mercenaries should maintain distinct assignment/run IDs in `gameData` and use the Kit timed-activity functions as the run-state primitive; do not force all runs into one global `activityId` state.

Completion rewards should resolve through Kit Reward where the reward leaf is generic (Gold/Token/etc.) and through typed product hooks for product-specific equipment or unlock effects.

## 9. Combat and stage progression boundary

Do **not** add Slime Mercenaries combat to Kit Core.

The Kit specification explicitly treats battle engines as out of scope. Slime Mercenaries should own:

- unit stats derived from roster/equipment
- formation
- target selection
- movement
- HP/damage
- attack behavior
- waves
- bosses
- stage clear/blocking rules
- chest-drop model
- analytical offline combat model

The important integration contract is not visual Three.js state. It is a pure product domain model capable of answering, from authoritative progression state and deterministic RNG:

```text
combat power / encounter resolution
stage progress
reward resolution
frontier reached / defeat / retreat / retry
```

The rendered `BattleRuntime` should eventually become a presentation/execution view of the same authored combat definitions, not the only place where damage values and progression rules exist.

## 10. Offline progression

Use Kit offline elapsed-time handling and persistence, but keep battle advancement product-owned.

Recommended flow:

```text
Kit resolves effective offline elapsed seconds
-> Slime Mercenaries analytically advances combat through the same frontier rules used online
-> failed frontier retreats one stage and continues authored farming/retry cycles instead of stopping time
-> defer only the first clear of an uncleared major frontier until an active session
-> advance dispatch runs through Timed Activity semantics
-> aggregate Gold / Token / equipment / discoveries
-> persist resolved results
-> build Kit-compatible OfflineReturnSummary / RewardSignals
```

Do not simulate every projectile/entity while offline. Do not let presentation timers determine offline rewards. Offline time must continue producing farm rewards after defeat; a static boss-blocked state is not an acceptable idle-time boundary.

## 11. Simulator integration

The target architecture should allow a headless simulator policy to execute the same commands:

- level type
- craft/buy Plain Slime
- create jobs
- fuse
- promote
- equip/refine
- start dispatch
- progress/farm stage

Priority simulator measurements for this game:

- time to first Plain creation
- material path vs Gold-shop share of Plain acquisition
- time to first Sword job
- time to first repeated Sword creation / explicit spare-to-Core conversion
- time to first fusion
- time to first authoritative defeat / retreat
- retreat farm-clear count and frontier retry count
- time from defeat to first farm clear / retry / breakthrough
- Gold competition between Type Level and Plain purchase
- reward droughts / max no-action window
- duplicate/fusion ingredient droughts
- dispatch contribution by session/day
- seed variance for normal job access (target: low because deterministic backstops exist)

The product exposes three same-core CLI profiles. They all call the public `idle-game-kit/simulator` runner with the production `advanceSlimeWorldTo()` and production commands; no UI-only or simulator-only economy implementation exists.

```text
pnpm run simulate:balance  # efficient: proactive spending, progression-speed regression
pnpm run simulate:check    # defeat-loop: wait for defeat, then spend aggressively while farming
pnpm run simulate:paced    # paced-defeat: at most one strengthen command per retreat-farm phase
```

`--seed`, `--seeds`, `--max-sec`, `--json`, and `--check` are available through `pnpm run simulate -- ...`. Balance bands live only in `src/domain/balance.ts`; CLI validation consumes typed Kit `BalanceTargetDefinition` values, including the reusable `repetition-count` target from Kit source commit `ab71170d8cd51297f54f9a1d982fa35c593080e5`. The CLI keeps only true invariants such as defeat/retreat event parity outside those authored numeric bands.

Current deterministic reference observations after the frontier-defeat loop integration are approximately 210 seconds / 0 defeats for `efficient`, 255 seconds / 1 defeat / 3 farm clears for `defeat-loop`, and 709 seconds / 2 defeats / 6 farm clears for `paced-defeat`. These are simulator observations, not production constants.

This is where Plain-shop price, material drop rates, Fusion recipe quantities, stage curves, defeat cadence, and retry cadence should be tuned. Do not tune those values only from the rendered battle prototype.

## 12. What should be added to Kit vs kept local

### Reuse now; no Kit change

- Currency
- Token
- Level curves and previews
- Inventory/Loadout ownership primitives
- Gacha/RNG
- Reward engine
- Timed Activity
- offline-time resolution
- IndexedDB/ProfileRepository
- Cloud Save later
- same-core simulator framework

### Product adapter / plugin only

- Plain crafting and purchase commands
- job creation resolution
- persistent slime-instance roster with stable IDs
- Fusion recipe/state
- stage/combat/offline battle model
- dispatch assignment/power rules
- equipment effects/refinement semantics

### Potential Kit extraction only after proven twice

Token-funded Gacha cost is no longer pending: Slime Mercenaries plus the existing material-paid forge use case provided sufficient evidence for a narrow reusable cost contract, so Kit now supports Currency or Token Gacha cost without adding product-specific Forge semantics.

Do not add a generic recipe/crafting engine yet. Slime Mercenaries currently needs atomic multi-resource recipes for Plain crafting and Fusion, but one product is insufficient evidence that a generic crafting subsystem belongs in Kit.

If a second independent Kit product requires the same typed pattern—validated multi-input recipe, deterministic spend, typed output, preview, atomic commit—then extract a small generic `RecipeDefinition/previewRecipe/applyRecipeCosts` primitive. Until then, keep recipe definitions and commands product-owned while reusing Currency/Token helpers underneath.

Similarly, do not add a generic battle engine, job-tree engine, or fusion engine to Kit.

## 13. Integration completion

The planned integration sequence is complete for the current Sword/Bow vertical slice:

1. [done] vendored Kit public package dependency
2. [done] canonical `SlimeMercenariesGameData`, Currency, Tokens, RNG, schema/save boundary
3. [done] pure Plain craft/purchase/job commands
4. [done] authoritative Fusion recipe/rank/form commands
5. [done] Type Level on Kit `LevelDefinition`
6. [done] IndexedDB/ProfileRepository + schema migration + same-core offline resume
7. [done] analytical Wave/Stage/Boss/reward model + balance targets/simulator
8. [done] Dispatch through Kit Timed Activity
9. [done] Inventory/Loadout + Token-funded Kit Gacha Forge + refinement
10. [done] React/Three presentation bound to persisted authoritative state; visual runtime no longer owns durable progression/rewards
11. [done] branched Fusion as the sole form/tier growth axis, plus current vertical-slice Equipment content

Future work is deliberately outside this integration plan: additional job families/forms/areas, richer equipment behavior/VFX, Cloud Save enablement when desired, and further UI/presentation refinement. New content must continue to use the same Domain/Kit boundaries rather than adding a second progression state in React or Three.js.
