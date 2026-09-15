# ADR 0001 — Type-squad roster and equipment-led acquisition

Status: Accepted
Date: 2026-09-15

## Context

A cute slime idle RPG can easily default to a conventional hero-gacha structure: every slime is an individually rolled character with rarity, random stats, equipment slots, duplicate awakening, and a large roster screen.

That model is commercially familiar, but it conflicts with the intended fantasy of this product in three ways.

1. The visible fantasy is a growing **slime army**, not a gallery of named humanoid heroes.
2. Individual management scales poorly once the desired battlefield contains 20–30 friendly bodies.
3. If the slime itself is the primary gacha prize, the deterministic "give a slime equipment and discover what it becomes" loop is weakened by acquisition RNG.

A second option was to remove random acquisition entirely and make every progression deterministic. That would preserve clarity but reduce the recurring surprise and collection tension expected from the idle/loot loop.

## Decision

Use **type squads** as the roster model and **equipment** as the primary random acquisition model.

- Slime identity is represented by 30 discoverable types rather than individually rolled heroes.
- The player manages six squad slots.
- A squad type can field multiple visible bodies, producing a large army without large management burden.
- Normal evolution branches have deterministic unlock paths.
- Random battle chests and Forge draws primarily produce equipment.
- Equipment duplicates refine the exact weapon before overflowing into family mastery.
- Rare mutations may have surprise acquisition, but also have deterministic fragment/core paths.

## Consequences

### Positive

- "next evolution" curiosity remains central.
- Battlefield population can grow dramatically without requiring 30 separate character sheets.
- Loot randomness directly changes combat visuals through weapons and effects.
- Core jobs are not blocked by gacha luck.
- Highest-rarity collection can remain broad through multiple Mythic weapons per family.

### Trade-offs

- The product cannot rely on named-character personality attachment as its main retention device.
- Type-level progression and population progression must be visually rewarding enough to replace conventional hero duplication excitement.
- Equipment art/VFX quality becomes more important because equipment carries much of the random-reward excitement.
- Monetization, if added later, must respect the deterministic access to core slime types rather than quietly converting the design back into hero-gacha gating.

## Rejected alternatives

### Individual hero slime gacha

Rejected as the primary model because it adds management burden and makes the slime-evolution fantasy secondary to roster pulls.

### Fully deterministic equipment

Rejected because it removes too much variable upside from the battle/chest loop.

### Unlimited duplicate squad slots

Rejected because six copies of one optimal type would reduce composition identity and visual variety. Duplicate ownership instead strengthens that type’s population/refinement.
