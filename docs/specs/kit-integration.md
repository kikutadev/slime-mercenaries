# Idle Game Kit Integration

Status: Current implementation boundary
Date: 2026-09-16

## 1. Goal

Slime Mercenaries should use `idle-game-kit` for reusable idle-game invariants without moving product identity into the Kit.

The integration rule is:

> **Kit owns reusable economy/time/persistence primitives. Slime Mercenaries owns combat, job creation, fusion recipes, promotion rules, and battle-facing behavior.**

The authoritative product Domain and balance simulator now execute the same Slime Mercenaries commands and Kit primitives. The React/Three runtime remains a combat/presentation vertical slice and is not yet fully bound to that authoritative state; presentation migration is a separate step.

## 1.1 Current implementation status

Implemented on 2026-09-16:

- vendored `idle-game-kit` public package from source commit `f20e2bfa85229b04f1c03e269aa677edc2125f98`
- canonical `GameState<SlimeMercenariesData>` envelope with Gold, Tokens and named RNG streams
- definition-driven `CraftPlainSlime`, `BuyPlainSlime`, `CreateJobSlime`
- definition-driven `FuseSlime` with `fusionRank/fusionForm` separate from promotion tier
- Type Level command backed by Kit `LevelDefinition` / `previewLevelUp`
- product balance knobs isolated in `src/domain/balance.ts`
- current Fusion presentation fixture reads recipe/min-level data from the authoritative domain definitions

Still pending:

- migrate `App.tsx` from the temporary roster fixture to the authoritative GameState
- persistence / offline resume
- Inventory + Forge/Gacha
- Dispatch / Timed Activity
- pure stage/reward model and same-core balance simulator

The React/Three battle runtime therefore remains a presentation/combat prototype; economy truth now starts in `src/domain`.

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

## 2.1 Current implementation status (2026-09-16)

Connected and verified:

- vendored public Kit package from recorded clean source commit
- Gold Currency and countable Token resources
- Plain craft/shop/job creation, Type Level, Fusion
- deterministic Wave/Stage/Boss analytical progression and loot RNG
- same-core online/offline advancement
- ProfileRepository boundary with browser IndexedDB adapter
- balance simulator with authored P90 target bands
- reserve Dispatch using Kit Timed Activity

The first-loop baseline currently targets and verifies first Fusion at 1–3 minutes and Clover Road boss at 3–5 minutes. Exact observations are simulator outputs, not hard-coded production logic.

Not yet connected:

- React/Three local roster fixture -> authoritative product state/store
- concrete Equipment Inventory/Loadout and Forge
- Promotion/Tier branches
- rendered BattleRuntime damage/HP -> authored analytical combat definitions

## 3. Capability mapping

| Slime Mercenaries concept | Kit capability | Integration | Owner |
|---|---|---|---|
| Gold | `CurrencyDefinition` / transaction | direct | Kit primitive + product balance |
| Plain Slime stock | Token balance | direct | product token ID / Kit count invariant |
| slime-generation material | Token balance | direct | product token IDs |
| Job Gear | Token balance initially | direct | product definitions |
| Forge Key | Token balance | direct | product definition |
| Fusion material/component | Token balance | direct | product definitions |
| Promotion material | Token balance | direct | product definitions |
| Mutation fragments | Token balance | direct | product definitions |
| Type Level curves | `LevelDefinition`, `previewLevelUp` | adapter | Kit curve math + product command |
| equipment ownership | `InventoryState` / `ItemInstanceState` | direct foundation | Kit ownership invariant + product item data |
| per-slime weapon slot | `LoadoutDefinition` / `LoadoutState` | adapter | Kit equip invariant + product family rules |
| equipment rarity/refinement/effects | item `data` + product commands | product-specific | Slime Mercenaries |
| Forge draw | named RNG now; Kit Gacha cost contract under review | pending adapter | Forge Key remains a Token; do not coerce it into Currency merely to fit Gacha |
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
| Promotion | product atomic command using Kit resources/conditions | product-specific | Slime Mercenaries |

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
│  └─ promotion / mutation tokens...
├─ inventory
│  └─ persistent combat equipment instances
├─ activities
│  └─ reusable dispatch timing states where appropriate
├─ RNG streams / gacha state / unlocks
└─ gameData: SlimeMercenariesGameData
   ├─ currentAreaId / stage / highestStageCleared
   ├─ slimeProgressByType
   │  ├─ type level
   │  ├─ promotion tier/path
   │  ├─ fusion rank/form
   │  └─ assignment
   ├─ formation slots
   ├─ per-type loadout references if not represented in a single generic loadout
   ├─ active dispatch assignment metadata
   ├─ boss/checkpoint state
   └─ combat/offline model state needed for deterministic progression
```

Do not represent every discovered slime as a Kit `Instance Character`. The product deliberately has one canonical progression record per slime type, not a warehouse of character instances. Reusing the Character subsystem merely because the entities are characters would reintroduce an incorrect individual-roster model.

Plain Slime stock is likewise a Token/resource, not a Character instance. The canonical Plain Slime combat type, if fielded, remains a product roster record separate from stock.

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
if job undiscovered:
    consume inputs
    create canonical slimeProgressByType record
    mark discovery / Codex
    emit NEW job reward signal
else:
    consume inputs
    grant type-specific Slime Core token
    emit fusion-input reward signal
```

This state-dependent resolution is product gameplay and should not be represented as a generic Kit gacha duplicate policy.

### 4.4 Fuse Slime

Product command:

```text
FuseSlime(typeId, fusionStepId)
```

Inputs are authored recipe requirements such as:

```text
Sword Slime Core x1
Greatsword Blank x1
Hardening Gel x2
minimum Type Level 10
```

The command validates the whole recipe first, spends all resources atomically, advances `fusionRank/fusionForm`, and emits the combat-behavior unlock metadata used by presentation and simulator.

Greatsword is a fusion form on the Sword branch, not a Tier-2 promotion.

### 4.5 Promote Slime

Product command:

```text
PromoteSlime(typeId, promotionId)
```

Promotion consumes authored Gold/material/crest requirements and changes `jobTier/promotionPath`. It is independent of `fusionRank/fusionForm` and preserves applicable fusion progression according to product rules.

## 6. Level integration

Use Kit `LevelDefinition` and curve/preview functions for Type Level math. Do not use a second product-only level-cost implementation.

The Slime roster record remains in product `gameData`, so level-up should be a thin product command:

```text
preview Type Level with Kit LevelDefinition
-> verify/spend Gold with Kit Currency transaction
-> update slimeProgressByType[typeId].level
-> emit semantic level event
```

This gives production UI and simulator the same cost/stat curves without turning slime types into Kit Character instances.

## 7. Equipment / Forge integration

Use Kit Inventory/Loadout as the ownership/equip foundation, but keep RPG behavior product-owned.

Recommended split:

- `ItemDefinition.tags`: weapon family / equipment category eligibility
- `ItemInstanceState.data`: rarity, refinement progress, product-specific roll/version metadata
- `LoadoutDefinition`: one combat-weapon slot per slime-equipment context where practical
- product selectors: effective ATK/projectile/behavior modifiers
- product commands: duplicate refinement, cap overflow, named weapon effects

Forge should use Kit deterministic RNG and inventory invariants. The current Kit `GachaDefinition` cost is Currency-only, while the product specification intentionally models Forge Key as a Token. Do not convert Forge Key into Currency just to reuse that API. Before implementing Forge, choose one of two clean paths: (a) a small backward-compatible Kit Gacha cost extension that accepts Token cost, justified by a second consumer, or (b) a product atomic `spendToken -> named RNG -> weighted selection -> inventory/refinement` command. Adventurer Guild already has a token/material-paid random forge, so a narrowly scoped Kit cost extension is now a credible extraction candidate, but it should be implemented and regression-tested in Kit rather than hidden inside this product.

Job Gear should **not** be stored as combat Equipment instances initially. It is a countable profession catalyst and fits Token storage better. If future Job Gear becomes individually rolled/equippable, reconsider then rather than over-modeling now.

## 8. Dispatch integration

Kit Timed Activity is a good clock/completion primitive but not the whole dispatch system.

Product-owned dispatch assignment must record which canonical slime type is on which contract and enforce:

- type is owned
- type is reserve, not battle
- type is not already dispatched
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
boss reached / boss blocked
```

The rendered `BattleRuntime` should eventually become a presentation/execution view of the same authored combat definitions, not the only place where damage values and progression rules exist.

## 10. Offline progression

Use Kit offline elapsed-time handling and persistence, but keep battle advancement product-owned.

Recommended flow:

```text
Kit resolves effective offline elapsed seconds
-> Slime Mercenaries analytically advances normal combat
-> stop at uncleared major boss checkpoint
-> advance dispatch runs through Timed Activity semantics
-> aggregate Gold / Token / equipment / discoveries
-> persist resolved results
-> build Kit-compatible OfflineReturnSummary / RewardSignals
```

Do not simulate every projectile/entity while offline. Do not let presentation timers determine offline rewards.

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
- time to first repeated Sword creation / first Slime Core
- time to first fusion
- time to first boss block
- Gold competition between Type Level and Plain purchase
- reward droughts
- duplicate/fusion ingredient droughts
- dispatch contribution by session/day
- seed variance for normal job access (target: low because deterministic backstops exist)

This is where Plain-shop price, material drop rates, Fusion recipe quantities, and stage curves should be tuned. Do not tune those values only from the rendered battle prototype.

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
- one-canonical-record-per-type roster
- Fusion recipe/state
- Promotion
- stage/combat/offline battle model
- dispatch assignment/power rules
- equipment effects/refinement semantics

### Potential Kit extraction only after proven twice

Do not add a generic recipe/crafting engine yet. Slime Mercenaries currently needs atomic multi-resource recipes for Plain crafting, Fusion, and Promotion, but one product is insufficient evidence that a generic crafting subsystem belongs in Kit.

If a second independent Kit product requires the same typed pattern—validated multi-input recipe, deterministic spend, typed output, preview, atomic commit—then extract a small generic `RecipeDefinition/previewRecipe/applyRecipeCosts` primitive. Until then, keep recipe definitions and commands product-owned while reusing Currency/Token helpers underneath.

Similarly, do not add a generic battle engine, job-tree engine, or fusion engine to Kit.

## 13. Recommended integration order

1. [done] introduce vendored Kit public package dependency without presentation changes
2. [done] define canonical `SlimeMercenariesGameData`, Gold, Tokens, RNG streams, save/schema version
3. [done] implement pure `CraftPlainSlime`, `BuyPlainSlime`, and `CreateJobSlime` commands
4. [done] move Fusion recipe/rank rules to authoritative product definitions/domain command
5. [done] connect Type Level to Kit LevelDefinition
6. [done] connect IndexedDB/ProfileRepository boundary and same-core offline resume
7. [done] extract analytical Wave/Stage/Boss/reward progression and connect same-core simulator/balance targets
8. [done] connect Dispatch through Kit Timed Activity
9. [next] connect Inventory/Loadout and settle Forge Key Token vs Kit Gacha cost boundary
10. [next] bind React/Three presentation to authoritative state and authored combat definitions
11. [later] add Promotion and remaining launch content

Do not begin by making the Three.js runtime import every Kit subsystem. Establish authoritative domain state and commands first, then make presentation subscribe to/project that state.
