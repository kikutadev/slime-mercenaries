# UX / UI Specification

Status: Current
Date: 2026-09-16

## 1. UX goal

The primary screen should make the game understandable by watching it.

At rest, the player should see:

- a small number of slimes clearly fighting
- each active slime's condition/HP
- current progress
- whether a chest, fusion, equipment, evolution, or dispatch return is ready
- one obvious route to strengthen the roster

Do not turn the main view into stat cards around a tiny battlefield.

## 2. Navigation model

Persistent bottom navigation has four primary destinations:

1. **Battle** — main battlefield and quick formation access
2. **Slimes** — roster, fusion, level, evolution, equipment assignment
3. **Dispatch** — reserve slime jobs and returns
4. **Forge** — equipment draw, owned equipment, refinement

Codex is accessible from Slimes as a secondary destination rather than consuming a fifth persistent tab. Settings remain secondary.

## 3. Battle screen

Reference composition:

```text
┌────────────────────────┐
│ Area 3-12        Gold  │
│ ▰▰▰▰▱ boss progress    │
│                        │
│        ENEMIES         │
│                        │
│      combat / VFX      │
│                        │
│  active slimes 1–6     │
│                        │
│ [chest in battlefield] │
│                        │
├────────────────────────┤
│ ready / result strip   │
├────────────────────────┤
│ Battle Slimes Dispatch Forge │
└────────────────────────┘
```

The battlefield remains visually dominant. HUD and controls float lightly rather than reserving many card rows.

## 4. Active slime HP

Because the active party is small, each visible slime may have a compact world-space HP bar.

Rules:

- bar follows the character without covering its face/weapon
- exact numeric HP may appear in a selected/roster surface; it need not be permanently printed over every body
- defeated slime's bar empties and may fade after the defeat reaction is readable
- avoid individual bars for enemies if they create unnecessary clutter; boss/aggregate enemy HUD may be used contextually

## 5. Battlefield chest interaction

A chest drops into the field with a short bounce and rarity-specific glint.

- tap: open immediately with compact reveal
- ignore: auto-open after short delay
- NEW slime/job or high rarity: stronger reveal
- slime duplicate: concise fusion-progress result
- ordinary equipment duplicate: compact refinement result

The chest never waits indefinitely for mandatory input.

## 6. Slimes screen

The Slimes screen replaces the old population/squad-management concept.

Top area shows the active formation with up to six slots, one slime per slot.

The selected slime detail shows:

- type/form name and Tier
- type level
- fusion rank/progress
- equipped weapon
- current assignment: Battle / Dispatch / Reserve
- next evolution or specialization opportunity

Primary actions:

- Level Up
- +10 / Max affordable after appropriate unlock
- Fuse when enough same-type input exists
- Evolve/Promote when requirements are met
- Change weapon
- Add/remove from battle formation

Do not show a population count whose purpose is spawning more same-type bodies.

## 7. Formation editing

Formation editing is direct and small-party oriented.

- tap a slot to select an owned available type
- prevent duplicate type assignment
- a dispatched type cannot be selected until it returns
- swapping should be immediate and visually clear
- front/back recommendation may be shown as guidance, not as opaque penalty math

Each slot always corresponds to one visible battle body.

## 8. Fusion UI

Fusion is a first-class surface inside Slimes.

Recommended selected-slime layout:

```text
Sword Slime
Fusion Rank 2
●●○○  2 / 3 copies

Next milestone
2-hit slash -> 3-hit slash
Body size: unchanged

[Fuse]
```

The actual rank visualization need not literally use stars or dots; the contract is that the player can answer:

- how close am I?
- what do I spend?
- what gets better?

Do not imply power by scaling the character preview larger after fusion.

### Fusion result

First Sword fusion milestone:

- show two Sword Slime 3D models side by side
- pull both models toward the center
- fire a bright central flash at contact
- replace both with Greatsword Slime
- keep slime-body dimensions unchanged; communicate the upgrade through the greatsword silhouette and attack
- immediately preview the upgraded heavy/two-hit slash

Later ordinary fusion steps may use a shorter jelly compression + weapon/VFX pulse. Fusion presentation should remain shorter than a NEW job reveal.

## 9. Evolution UI

Evolution remains a signature surface.

### Tier 1

Plain Slime with available job gear families around it. Locked-near branches show silhouettes and hints.

### Tier 2

Single clear promotion path where no choice exists.

### Tier 3

Two large behavior-focused choices with animated preview.

Explain behavior before coefficient detail, e.g.:

- 「前方をすり抜けて複数体を斬る」
- 「HPが減るほど攻撃が速くなる」

## 10. Dispatch screen

Dispatch should feel like sending guild members to work, not filling an optimization spreadsheet.

Top:

- active dispatch cards with remaining time
- completed return ready state

Available contracts:

```text
Road Escort        Gold
Forest Exploration Equipment / Key
Material Gathering Promotion material
```

Flow:

1. choose contract
2. choose one available reserve slime type
3. confirm duration/reward emphasis
4. slime visibly departs
5. return state shows compact reward

Do not require selecting multiple duplicate bodies or satisfying hidden success percentages in the initial design.

## 11. Forge screen

Forge remains equipment-focused.

Core layout:

- key count
- single / multi draw
- pity progress if applicable
- important new/refinement results
- equipment family filters

Draw button states cost before tap.

## 12. Equipment result hierarchy

### Common / Rare duplicate

Inline result tile, fast.

### Slime duplicate

Fusion-progress chip or compact slime result. If fusion becomes ready, emphasize that action without forcing an immediate modal.

### Epic new / refinement milestone

Short card rise + weapon motion.

### Legendary / Mythic

Strong but short weapon reveal with immediate compatible equip affordance.

## 13. Codex

Codex lives under Slimes and has at least:

- Slime/forms discovery
- Weapons discovery

Slime Codex prioritizes the evolution tree over a flat grid.

Fusion rank is player progression, not separate Codex entries. Reacquiring the same slime does not create duplicate collection cards.

## 14. Offline return

One compact sheet, not a sequence of claims.

Priority order:

1. NEW slime/weapon/mutation
2. fusion-ready state
3. completed dispatch
4. blocked boss / furthest progress
5. aggregate Gold/rewards

Primary action returns to Battle.

## 15. First-use teaching

Tutorial principle:

`short cue -> real action -> visible consequence`

First sequence:

1. Plain Slime attacks automatically
2. first chest appears
3. Rusty Sword appears
4. player gives Sword to Plain Slime
5. it becomes Sword Slime and immediately attacks differently
6. second Sword Slime acquisition occurs soon after
7. at Lv.10, player fuses the reacquired Sword Slime into the owned Sword branch
8. Greatsword Slime appears with the same slime-body size, a large sword silhouette, and a two-hit attack
9. Bow is discovered
10. later, an unused type receives the first simple dispatch tutorial

Avoid modal tours.

## 16. Notifications and badges

Use badges only for actionable high-value states:

- fusion ready
- evolution ready
- dispatch complete
- earned Forge draw available
- NEW Codex item not yet viewed

Do not badge every affordable level-up.

## 17. Responsive / safe-area rules

- design for portrait first
- respect top and bottom safe areas
- preserve enough battlefield height for 1–6 active slimes and enemy movement
- do not shrink slimes merely to fit a discarded 20–30-body requirement
