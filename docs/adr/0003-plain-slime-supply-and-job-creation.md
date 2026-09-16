# ADR 0003 — Plain Slime supply and job creation

Status: Accepted
Date: 2026-09-16

## Context

The product already treats discovered combat slimes as canonical type records rather than persistent individual characters. Repeated ownership strengthens a type through Fusion instead of placing duplicate bodies on the battlefield.

However, the acquisition source remained ambiguous: specifications referenced slime acquisition from chests/recruitment while the product fantasy also said that giving equipment to a Plain Slime creates a job. This left several competing models:

- completed Sword/Bow/etc. slimes drop directly
- Plain Slime drops directly
- Plain Slime is created from materials
- Job Gear discovers a profession
- repeated jobs become Fusion input

Without one source model, chest rewards, shop value, duplicate Fusion, and job discovery could not share a coherent economy.

## Decision

Use **Plain Slime as the renewable body source for the normal job tree**.

### Plain Slime supply

- Plain Slime stock can be crafted from common slime-generation materials.
- Plain Slime stock can also be purchased for Gold from the normal shop.
- The Gold shop is a deterministic backstop so material RNG cannot block job creation.
- Plain stock is a countable resource and has no per-body level, equipment, traits, name, or assignment.
- The canonical Plain Slime combat type, if used in formation, is separate from consumable Plain stock.

### Job creation

Normal Tier-1 jobs are created by consuming:

```text
Plain Slime stock x1 + matching Job Gear x1
```

The first creation of a job unlocks its canonical roster record.

Repeating a job that is already discovered does not create a second persistent body. It resolves into the type-specific Slime Core / equivalent Fusion input for that canonical record.

### Job Gear and combat Equipment

Job Gear is a profession catalyst. It is not the same state as persistent combat Equipment.

- Job Gear answers: “what profession does this Plain Slime become?”
- combat Equipment answers: “what weapon/build does this owned profession use in battle?”

The first tutorial Job Gear families are guaranteed. Later normal families become deterministically accessible through area progression. Random drops may accelerate acquisition but do not solely gate the normal tree.

### Fusion and Promotion

Repeated job creation feeds Fusion. Fusion may change `fusionForm` and combat behavior without consuming a promotion tier.

A named milestone such as Greatsword is a Fusion form on the Sword branch. Fighter remains the Tier-2 Promotion. `promotion tier/path` and `fusion rank/form` are separate progression axes.

## Consequences

### Positive

- Normal slime acquisition now has one readable source: create a Plain body, then give it a job.
- Battle materials, Gold, Job Gear, Fusion, and shop spending connect into one economy loop.
- The Gold shop prevents unlucky material drops from creating a hard progression wall.
- Repeated job creation naturally explains where type-specific Fusion Cores come from.
- The game keeps its one-type/one-visible-body battlefield rule.
- Completed normal-job slimes no longer need to appear as arbitrary character-gacha prizes.

### Trade-offs

- Plain Slime stock becomes a new economy resource that needs price/drop-rate tuning.
- Job Gear must be clearly separated from combat Equipment in data and presentation.
- Gold now competes between Type Level and Plain purchase, so simulation is required to prevent one sink from dominating.
- Plain crafting/shop/job creation are authoritative pure Domain commands backed by Kit Currency/Token primitives, and the React presentation now reads the persisted authoritative state rather than a duplicate roster fixture.

## Rejected alternatives

### Completed job slimes as the normal chest reward

Rejected because it weakens the core fantasy of making a slime and giving it a profession, and leaves Job Gear without a clear systemic role.

### Material-only Plain acquisition

Rejected because unlucky drop variance could block the normal job tree. Gold purchase provides the deterministic backstop.

### Shop-only Plain acquisition

Rejected because it disconnects battle/dispatch materials from slime creation and reduces the satisfaction of producing new bodies from gathered resources.

### Persistent individual Plain Slimes

Rejected because it reintroduces per-body management that the canonical type-roster model intentionally removed.

## Current specification owners

- core fantasy / first minutes: [`../CONCEPT.md`](../CONCEPT.md)
- top-level state/acquisition contracts: [`../SPEC.md`](../SPEC.md)
- roster/job/Fusion rules: [`../specs/evolution-roster.md`](../specs/evolution-roster.md)
- economy/drop/shop rules: [`../specs/progression-economy.md`](../specs/progression-economy.md)
- Kit implementation boundary: [`../specs/kit-integration.md`](../specs/kit-integration.md)
