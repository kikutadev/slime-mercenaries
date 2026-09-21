# Rare Mutation Production

Status: Existing-body mutations implemented locally — release verification pending
Date: 2026-09-21

## Goal

Rare Mutationを「stateにIDが付くだけ」の未完成機能から、通常プレイで獲得し、Campから選択し、Battle / Fusion / Dispatchで見た目と効果が維持される製品機能へする。

Mimic Slimeは既存個体への変異ではなく hostile mimic の特殊捕獲なので、この実装へ混ぜない。King / Golden / Dragon / Prism の4種をexisting-body mutationとして完成させ、Mimicは次の独立content sliceとする。

## Product contract

Mutationは通常職の上位Tierではない。元のFusion form / weapon / signature behaviorを維持したまま、横方向の特殊性を一つだけ重ねる。

| Mutation | Eligibility | Gameplay identity | Visual identity | First-world deterministic route |
| --- | --- | --- | --- | --- |
| Golden | Tier 2+ | active battle Gold +15% | gold jelly + sparkles | Sunken Marsh S5 + Frost Ruins S2 fragments |
| King | Tier 3 | active party DPS/Power +8% | crown + royal aura | Moonlit Castle S2 + S5 fragments |
| Prism | Bow/Wand/Gun Tier 3 | personal DPS +16%, Power +8% | prism crystals + halo | Moonlit Castle S3 + Dragon Crater S2 fragments |
| Dragon | selected physical Tier 3 forms | DPS +14%, Power +18%, visual HP +18% | horns + ember dorsal spikes | Dragon Crater S4 catalyst |

Dragon eligible branches:
Blademaster / Berserker / Paladin / Fortress / Ninja / Assassin / Cannoneer.

A slime can own only one Mutation. Mutation survives later Fusion because it is stored on the persistent slime instance.

## Fragment backstop

All existing-body fragment families use one authored first-pass threshold: 10 fragments -> 1 catalyst.

Crossing the threshold converts complete batches immediately and retains the remainder. This avoids adding a second hidden crafting action only to turn fragments into the already-authoritative catalyst resource.

First-world deterministic rewards ensure Golden, King and Prism can each reach one catalyst without RNG. Dragon receives a guaranteed late catalyst because its authored path is a Dragon Core milestone rather than a generic fragment track.

## Presentation

Mutation visuals decorate the existing authored job GLB instead of replacing it.

- King: crown + jewel + aura
- Golden: body recolor + floating sparkles
- Dragon: warm-red body + paired horns + ember dorsal spikes
- Prism: crystal tint + orbit-like prism accents

The same decorator is consumed by Camp, Battle, Fusion ceremony and Dispatch traveler presentation. This keeps a mutated Blademaster visibly a Blademaster rather than replacing it with one generic mutation model.

## UI

Camp surfaces a compact Rare Mutation entry only when the selected slime has relevant progress, is eligible, has a catalyst, or is already mutated.

The panel shows:

- mutation name
- gameplay identity
- fragment name and current / required amount
- catalyst readiness
- eligibility
- mutated state

A ready mutation is also included in the shared Camp upgrade attention selector, so the player does not need to discover the panel manually.

## Acceptance

- [x] deterministic fragment -> catalyst conversion
- [x] authored first-world backstops for Golden / King / Prism / Dragon
- [x] Dragon selected origins authored
- [x] four mutations have distinct gameplay effects
- [x] one-mutation-per-body invariant remains
- [x] Camp action path uses authoritative mutate command
- [x] navigation / next-action attention surfaces ready mutations
- [x] Camp uses the actual Fusion-form model and mutation visual
- [x] Battle runtime reload key includes mutation identity
- [x] Battle / Fusion / Dispatch consume the shared mutation decorator
- [ ] full tests / typecheck / UI contract
- [ ] world balance gates
- [ ] production build / bundle guard
- [ ] mobile visual QA for four mutations
- [ ] origin/main
- [ ] production deploy / public smoke

## Deliberately separate

Mimic Slime remains a special-capture system:

hostile mimic encounter -> capture/heart resolution -> persistent Mimic ownership.

It should not consume a normal Sword/Bow/etc. body and should not be implemented as a fifth value of the existing-body `mutationId` field.
