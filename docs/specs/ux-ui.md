# UX / UI Specification

Status: Current
Date: 2026-09-15

## 1. UX goal

The primary screen should make the game understandable by watching it.

At rest, the player should see:

- slimes fighting
- current progress
- whether a chest / Forge / evolution opportunity is ready
- one obvious way to inspect and strengthen squads

Do not turn the main view into six large stat cards surrounding a tiny battlefield.

## 2. Navigation model

Persistent bottom navigation has four destinations:

1. **Battle** — main battlefield and quick squad actions
2. **Squads** — six-slot formation, type levels, population, evolution
3. **Forge** — equipment draws, owned equipment, refinement
4. **Codex** — slime and equipment discovery

Settings and secondary information live behind a small overflow/settings entry, not a fifth equal-weight tab.

## 3. Battle screen

Reference composition:

```text
┌────────────────────────┐
│ Area 3-12        Gold  │  compact HUD
│ ▰▰▰▰▱ boss progress    │
│                        │
│        ENEMIES         │
│      enemy group       │
│                        │
│      combat / VFX      │
│                        │
│   slime army 10–30     │
│                        │
│ [chest in battlefield] │
│                        │
├────────────────────────┤
│ Jelly Rush   78%       │  compact action strip
│ Squad power ↑ ready    │
├────────────────────────┤
│ Battle Squads Forge Codex│
└────────────────────────┘
```

The battlefield must remain visually dominant. HUD and controls should float/overlay lightly rather than reserve multiple card rows.

## 4. Top HUD

Persistent information is intentionally small:

- current Area / stage
- boss/progression strip when meaningful
- Gold
- one context-sensitive secondary currency only when relevant

Do not permanently display every resource. Forge Keys and mutation fragments are visible inside their relevant surfaces.

## 5. Battlefield chest interaction

A chest drops into the actual field with a short bounce and rarity-specific glint.

- tap: immediately open with compact reveal
- ignore: auto-open after short delay
- NEW/Legendary/Mythic: stronger reveal strip and short battle slow
- ordinary duplicate: small non-blocking result chip

The chest must never sit on the field indefinitely waiting for a tap.

## 6. Jelly Rush control

Jelly Rush sits immediately above bottom navigation on Battle.

Collapsed state:

```text
JELLY RUSH  ▰▰▰▰▰▰▱  84%
```

Ready state becomes a large tactile button without covering the army.

At full gauge, subtle pulse is allowed. Avoid full-screen flashing until activation.

## 7. Squads screen

The top half shows the current six-slot formation with miniature animated slime previews.

The lower section focuses on the selected type.

Required information:

- type name / Tier / role
- type level and next cost
- visible population 1–5
- mastery progress when near a meaningful unlock
- equipped weapon
- next evolution or specialization opportunity

Primary actions:

- Level Up
- +10 / Max affordable after unlocked
- Grow Squad when Gel milestone is ready
- Evolve when requirements are met
- Change weapon

Do not show a giant table of all stats by default. Detailed stats may be a secondary sheet.

## 8. Formation editing

Formation editing is direct manipulation:

- tap a slot to choose from discovered types
- long-press/drag between slots to swap where reliable
- prevent duplicate type assignment with immediate explanatory feedback
- role icon and Front/Back recommendation visible in picker

The system should provide quick recommendations such as "Front向き" rather than opaque score optimization.

## 9. Evolution UI

Evolution is one of the product’s signature surfaces.

### Tier 1

Plain Slime centered, six job objects arranged around it:

```text
          Shield
   Sword          Bow

      Plain Slime

   Dagger         Wand
           Gun
```

Locked-but-near branches can show silhouettes and unlock hints.

### Tier 2

Single clear promotion path. The UI should not pretend there is a choice.

### Tier 3

Two large side-by-side choices with animated preview:

```text
Blademaster             Berserker
fast cleave              risky burst
[preview]                 [preview]

        Fighter Slime
```

Show behavioral differences in plain language before detailed percentages.

Example:

- "前方をすり抜けて複数体を斬る"
- "HPが減るほど攻撃が速くなる"

This is more important than exposing raw coefficient formulas.

## 10. Forge screen

Forge is visually rewarding but compact.

Core layout:

- key count
- single draw / 10 draw
- current pity progress for Epic+, Legendary+, Mythic
- featured owned/new equipment carousel only when useful
- equipment family filters below draw area

The draw button must state cost before tap.

A 10-draw animation may group Common/Rare reveals and individually emphasize Epic+ results. Do not force ten identical reveal taps.

## 11. Equipment result hierarchy

### Common / Rare duplicate

Inline result tile, fast.

### Epic new / refinement milestone

Short card rise + weapon motion.

### Legendary

Battle pauses if drawn from battlefield; strong weapon silhouette reveal, rarity sound/VFX.

### Mythic

Highest presentation tier: family-colored field, weapon signature animation, named title, then immediate option to equip to a compatible active squad.

Target: exciting in a few seconds, not a long cinematic that becomes annoying on repeat.

## 12. Codex

Codex has two top-level filters:

- Slimes `x / 30`
- Weapons `x / total`

Slime Codex prioritizes the evolution tree over a flat grid. It should make undiscovered possibilities legible.

Discovered node:

- animated mini sprite
- role
- discovery source
- current population / mastery summary

Undiscovered node:

- silhouette
- vague or explicit hint based on prerequisite proximity

Mutation nodes sit outside the six normal branches and use a visibly different frame language.

## 13. Offline return

One bottom sheet, not a sequence of claim dialogs.

Priority order:

1. NEW slime/weapon/mutation event
2. blocked boss / furthest progress
3. Gold / Gel / chest totals
4. ready-to-spend opportunities

Primary action returns directly to Battle.

## 14. First-use teaching

Tutorial principle:

`short cue -> real action -> visible consequence`

Avoid modal tours.

First tutorial sequence:

1. Plain Slime attacks automatically; player watches a few seconds
2. first chest bounces onto field; pointer cue says tap
3. Rusty Sword appears
4. cue points to "渡す"
5. actual on-field slime evolves and immediately attacks differently
6. no further explanation until next meaningful system unlock

## 15. Notifications and badges

Use badges only for immediately actionable, high-value states:

- evolution ready
- population milestone ready
- free/earned Forge draw available
- NEW Codex item not yet viewed

Do not badge every routine level-up affordability state.

Battlefield toasts should be short and non-layout-shifting. Repeated gains can merge into a ticker-style line rather than stack vertically.

## 16. Responsive / safe-area rules

- design for portrait first
- respect top and bottom safe areas
- combat field must not be hidden behind home indicator/navigation
- short-height devices compress HUD/control spacing before shrinking character scale excessively
- landscape is not a first-class play layout in the initial scope; if opened, present a supported fallback rather than attempting a separate dense desktop HUD

## 17. Accessibility/readability

- role identity must not depend on color alone; silhouette and equipment matter
- rarity uses label/icon in addition to color
- large VFX must preserve boss telegraph edges
- damage numbers may be reduced/disabled without losing battle comprehension
- motion reduction setting can reduce camera shake/flashes while preserving attack timing

## 18. UI acceptance

Rendered mobile review must verify:

- battle remains the largest visual object
- 30 slimes do not sit behind bottom chrome
- top HUD is readable but not dominant
- player can reach evolution from Battle -> Squads in at most two intentional actions
- pity state is understandable in Forge
- Tier-3 choice communicates behavior before numbers
- Codex makes "what can I discover next?" obvious within a few seconds
