# ADR 0002 — Small active party, duplicate fusion, and reserve dispatch

Status: Accepted
Date: 2026-09-16

## Context

The previous design treated one roster slot as a type squad that could expand from one to five visible bodies. Six slots therefore targeted up to 30 friendly slimes on the portrait battlefield.

A real 30-body density test was added to the runtime at the existing camera and character scale. The result produced the intended sense of quantity, but harmed the qualities that matter more to this product:

- individual slime faces and equipment became difficult to read
- squad boundaries were visually ambiguous
- weapons overlapped heavily
- little space remained for enemies, projectiles, defeat poses, and reward events
- per-unit hit/HP/defeat feedback would become excessive

At the same time, the intended progression fantasy already depended on reacquiring and combining the same slime to make it stronger. Treating duplicates as population created a second, conflicting purpose for the same acquisition: keep copies as bodies versus consume copies for fusion.

The product also needs a useful role for developed slime types that are not in the main formation, without turning those types into dead collection entries.

## Decision

Replace the type-squad/population model with **small active party + same-type fusion + reserve dispatch**.

### Active battle

- Keep up to six logical battle slots.
- Each occupied slot deploys exactly one visible slime.
- The same slime type cannot occupy multiple battle slots.
- The product no longer targets 20–30 friendly bodies on the main battlefield.

### Duplicate acquisition

- The first acquisition discovers/owns the slime type.
- Reacquiring the same type provides fusion input for that owned type.
- Duplicate copies are not persistent independent bodies by default.
- Fusion progression strengthens the type rather than increasing battlefield population.

### Body size

- Fusion and ordinary level growth do not change the baseline gameplay body size of the slime.
- Power escalation is shown through equipment accents, attack pattern, projectile/trail/impact behavior, VFX, and signature unlocks.

### Reserve use

- Owned types not assigned to the main battle formation may be sent on dispatch contracts.
- A type cannot battle and dispatch simultaneously.
- Dispatch uses roster types, not duplicate-body headcount.
- Initial dispatch stays simple: select a reserve slime, select a contract, wait, receive deterministic-enough rewards.

### Acquisition philosophy

- Normal job discovery remains deterministically accessible through progression/equipment.
- Variable slime reacquisition may feed fusion, but the product does not require a conventional named-hero gacha as its identity.
- Equipment remains a major random collection/reward axis.

## Consequences

### Positive

- Characters remain large/readable enough for expressive squash, weapon motion, HP, and `べちゃっ + ×目` defeat.
- Duplicate acquisition has one clear purpose: strengthen the favorite type.
- Fusion and collection no longer create pressure to render more bodies.
- Up to six active slots still allow meaningful job composition without army clutter.
- Reserve discoveries remain useful through dispatch.
- Art/animation budget can focus on fewer, better visible characters.

### Trade-offs

- The game loses the original “army grows to fill the screen” spectacle.
- Fusion milestones and equipment behavior must carry more of the visible growth fantasy.
- Dispatch needs enough value to make reserve types relevant without becoming chore-heavy.
- Acquisition/fusion pacing must avoid making unlucky duplicate drought the only blocker; deterministic level/evolution growth remains necessary.

## Rejected alternatives

### Keep 30 bodies and shrink all slimes

Rejected because it sacrifices the character readability and cute motion already proving valuable in the runtime prototype.

### Keep one-to-five bodies but hide some dynamically

Rejected because the underlying population progression would still conflict with fusion and make the visible representation inconsistent.

### Persistent individual slime roster

Rejected for the initial product because it introduces per-body management, equipment, assignment, and random-stat pressure that is not needed for the core fantasy.

### Remove reserve value entirely

Rejected because discovered/promoted types outside the active six would become collection dead weight. Dispatch provides a simple secondary use without requiring more battle bodies.

## Current specification owners

- roster / fusion / evolution: [`../specs/evolution-roster.md`](../specs/evolution-roster.md)
- battle formation: [`../specs/combat.md`](../specs/combat.md)
- dispatch / economy: [`../specs/progression-economy.md`](../specs/progression-economy.md)
- body-size invariant: [`../specs/art-direction.md`](../specs/art-direction.md)
