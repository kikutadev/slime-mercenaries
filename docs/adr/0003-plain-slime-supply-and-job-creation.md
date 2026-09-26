# ADR 0003 — Plain Slime supply and job creation

Status: Accepted — amended for persistent roster and Fusion-only form growth
Date: 2026-09-16
Amended: 2026-09-27

## Context

The product fantasy requires one coherent answer to two questions:

1. Where do normal job slimes come from?
2. What does recreating an already discovered job mean?

Earlier drafts mixed several incompatible models:

- completed Sword/Bow/etc. slimes drop directly
- Plain Slime drops directly
- Plain Slime is created from materials
- Job Gear discovers a profession
- repeated jobs automatically become Fusion input
- one canonical body exists per type

The product later adopted a persistent individual-roster model and unified normal form growth under Fusion. This ADR is amended to preserve the original Plain-supply rationale while reflecting those current semantics.

## Decision

Use **Plain Slime stock as the renewable body source for the normal job tree**.

### Plain Slime supply

- Plain Slime stock can be crafted from common slime-generation materials.
- Plain Slime stock can also be purchased for Gold from the normal shop.
- The Gold shop is a deterministic backstop so material RNG cannot block job creation.
- Plain stock is a countable resource and has no per-body level, equipment, traits, name, or assignment.
- A fieldable Plain Slime, if used as a combat character, is a separate persistent roster concept from consumable Plain stock.

### Job creation

Normal Tier-1 jobs are created by consuming:

```text
Plain Slime stock x1 + matching Job Gear x1
```

Every successful creation creates **one new persistent slime instance** with a stable instance ID.

- first creation of a job also records the Codex discovery / NEW state
- repeated creation creates another independently usable body
- same-job bodies may occupy different battle slots or be split between battle, reserve, and Dispatch
- repeated creation never auto-merges and never auto-converts into Fusion material

When the player wants Fusion input, a separate explicit command may convert an eligible **reserve duplicate** into the family Slime Core / equivalent authored input.

The last owned body of that type, a battle-assigned body, or a dispatched body cannot be consumed by that conversion.

### Job Gear and combat Equipment

Job Gear is a profession catalyst. It is not the same state as persistent combat Equipment.

- Job Gear answers: “what profession does this Plain Slime become?”
- combat Equipment answers: “what weapon/build does this owned slime use in battle?”

The first tutorial Job Gear families are guaranteed. Later normal families become deterministically accessible through area progression. Random drops may accelerate acquisition but do not solely gate the normal tree.

### Fusion owns normal form growth

Fusion is the sole normal form/tier growth path.

A named milestone such as Greatsword, Fighter, or Blademaster is an authored Fusion result on the same persistent slime instance. There is no separate Promotion axis.

Canonical progression:

```text
Rank 1: Tier-1 job
-> Rank 2: first family enhancement/form
-> Rank 3: Tier-2 job form
-> Rank 4: player-selected Tier-3 specialization
```

Fusion may change `fusionFormId`, derived `jobTier`, model/equipment silhouette, attack behavior, projectile/VFX, and signature behavior while preserving the selected persistent slime's identity and body-size invariant.

## Consequences

### Positive

- Normal slime acquisition has one readable source: create a Plain body, then give it a job.
- Battle materials, Gold, Job Gear, Fusion, and shop spending connect into one economy loop.
- The Gold shop prevents unlucky material drops from creating a hard progression wall.
- Repeated job creation is never a silent duplicate conversion; the new slime remains useful as a real character.
- The player chooses when roster depth becomes Fusion input.
- Multiple same-job instances can support battle composition and Dispatch without changing the one-visible-body-per-slot rule.
- Completed normal-job slimes do not need to appear as arbitrary character-gacha prizes.
- Normal form progression has one understandable owner: Fusion.

### Trade-offs

- Plain Slime stock is an additional economy resource that needs price/drop-rate tuning.
- Job Gear must be clearly separated from combat Equipment in data and presentation.
- Gold competes between Level growth and Plain purchase, so simulation is required to prevent one sink from dominating.
- Persistent duplicates increase roster/assignment state and require explicit consume eligibility rules.
- Fusion UI must explain both the value of keeping a duplicate and the consequence of converting it into a Core.

## Rejected alternatives

### Completed job slimes as the normal chest reward

Rejected because it weakens the core fantasy of making a slime and giving it a profession, and leaves Job Gear without a clear systemic role.

### Material-only Plain acquisition

Rejected because unlucky drop variance could block the normal job tree. Gold purchase provides the deterministic backstop.

### Shop-only Plain acquisition

Rejected because it disconnects battle/dispatch materials from slime creation and reduces the satisfaction of producing new bodies from gathered resources.

### Persistent individual Plain stock entries

Rejected because consumable Plain stock does not need per-body level, equipment, assignment, traits, or names. Persistent individuality begins when a combat job slime is created.

### Automatic duplicate-to-Core conversion

Rejected because it makes a newly created same-job slime feel disposable and contradicts the persistent roster/Dispatch fantasy.

### Separate Promotion and Fusion form-growth axes

Rejected because two overlapping normal evolution systems make the player's next growth action and authored form ownership harder to understand. Fusion owns normal form/tier progression.

## Current specification owners

- core fantasy / first minutes: [`../CONCEPT.md`](../CONCEPT.md)
- top-level state/acquisition contracts: [`../SPEC.md`](../SPEC.md)
- roster/job/Fusion rules: [`../specs/evolution-roster.md`](../specs/evolution-roster.md)
- economy/drop/shop rules: [`../specs/progression-economy.md`](../specs/progression-economy.md)
- tutorial/onboarding: [`../specs/tutorial-onboarding.md`](../specs/tutorial-onboarding.md)
- Kit implementation boundary: [`../specs/kit-integration.md`](../specs/kit-integration.md)
