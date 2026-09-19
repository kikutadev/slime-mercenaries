# UX / UI Specification

Status: Current
Date: 2026-09-19

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

## 6. Camp / Slimes screen

The persistent navigation label is **Camp**. This is the roster/strengthening home, but it must still read as a physical camp rather than a management dashboard.

The screen is split by responsibility:

- upper area: authored 3D camp + the currently selected slime; this is primarily a presence/reaction surface
- lower thumb zone: roster selection and all routine player actions
- do not scatter routine action buttons over the 3D world as spatial hotspots

The lower command area keeps the relationship between **which slime is selected** and **what the player can do to it** physically close:

1. horizontally scrollable roster with portrait/job name/level
2. at most one contextual “next action” row when guidance is useful
3. four stable primary actions: **Strengthen / Fuse / Formation / Recruit**
4. Strengthen and Formation expand inline in the same command area instead of opening another floating dock elsewhere on the screen
5. Fuse may transition to its dedicated full-screen ceremony because it is a signature event

Changing the selected slime while Strengthen or Formation is open keeps that mode open and immediately applies the panel to the newly selected slime.

The selected slime presentation communicates:

- type/form name and role
- type level
- fusion rank/progress
- current assignment
- fusion readiness when relevant

Strengthen exposes Level +1 / +10 / Max. Job/form advancement is handled by Fusion. Formation exposes the six battle slots directly underneath the same action row.

Do not show a population count whose purpose is spawning more same-type bodies. Do not make players hunt across screen corners for Train/Fuse/Recruit/Formation controls.

### 6.1 Recruit / creation presentation

Recruiting and creating slimes must not read as an inventory counter update.

Plain Slime material creation is a short causal sequence:

1. required materials visibly converge on the nursery vat
2. the vat reacts before the result exists visually
3. the Plain Slime emerges with squash/stretch and a short flash
4. +1 is shown as the result; the persistent stock display catches up after the ceremony

Buying a Plain Slime uses a distinct arrival/coin treatment rather than reusing the material-creation motion.

Giving a job to a Plain Slime is also distinct:

- show the actual job-tool silhouette entering the vat
- flash at the handoff
- reveal the resulting job Slime
- return to Camp with that Slime selected and reacting to its arrival

Routine recruit/create actions should have visible cause and effect before any toast or number becomes the main feedback. Avoid generic Unicode pictograms as the primary action art.

## 7. Formation editing

Formation editing is direct and small-party oriented.

- tap a slot to select an owned available type
- multiple owned instances of the same job type may occupy different slots
- a dispatched instance cannot be selected until it returns
- swapping should be immediate and visually clear
- front/back recommendation may be shown as guidance, not as opaque penalty math

Each slot always corresponds to one visible battle body.

## 8. Fusion UI

Fusion is a first-class surface inside Slimes and uses explicit recipes rather than a single duplicate-progress bar.

Recommended selected-slime layout:

```text
Sword Slime
Fusion Rank 1 -> 2

Fusion Recipe
Sword Core        1 / 1
Greatsword Blank  1 / 1
Hardening Gel     2 / 2

Next milestone
Greatsword Slime
1-spin area sweep

[Fuse]
```

The contract is that the player can answer:

- what items do I need?
- which fusion item came from recreating this job?
- which weapon/material is missing?
- what attack behavior gets better?

Type-specific Slime Core items, weapon ingredients, and ordinary materials must be visually distinguishable in the recipe row. Do not create an inventory-management minigame merely to support fusion.

Do not imply power by scaling the slime body larger after fusion.

### Fusion result

First Sword fusion milestone:

- show two Sword Slime 3D models side by side as the fusion fantasy
- pull both models toward the center
- fire a bright central flash at contact
- replace both with Greatsword Slime
- keep slime-body dimensions unchanged; communicate the upgrade through the greatsword silhouette and attack
- immediately preview a fast half-turn horizontal greatsword sweep
- in battle, the sweep damages every living enemy inside its area rather than only the selected target

Later ordinary fusion steps may use a shorter jelly compression + weapon/VFX pulse. Fusion presentation should remain shorter than a NEW job reveal.

## 9. Advanced Fusion UI

Advanced Fusion remains a signature surface.

### Tier 1

Plain Slime with available job gear families around it. Locked-near branches show silhouettes and hints.

### Tier 2

Single clear Fusion result where no choice exists.

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
Material Gathering Fusion material
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

Fusion rank is player progression, not separate Codex entries. Recreating an already-discovered job does not create duplicate collection cards.

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
6. player creates another Plain Slime and uses Sword Job Gear again; it resolves into Sword Slime Core
7. at Lv.10, player uses the Sword Slime Core plus the authored recipe to fuse the owned Sword branch
8. Greatsword fusion form appears with the same slime-body size, a large sword silhouette, and a fast half-turn horizontal sweep
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
