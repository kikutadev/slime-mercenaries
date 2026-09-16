# Progression, Loot, Dispatch & Economy

Status: Current
Date: 2026-09-16

## 1. Economy goal

The economy exists to keep one question alive:

> **次の宝箱・同種入手・進化・装備更新で、このスライムの戦い方がどう変わるか。**

Do not create currencies merely to add systems. Every resource must have an obvious sink and payoff.

## 2. Core resources and growth inputs

| Input | Source | Primary sink | Purpose |
|---|---|---|---|
| Gold | kills, stage, dispatch, offline | type level, promotion fees | frequent growth |
| Type-specific Slime Core | same-type reacquisition | fusion recipe | preserve duplicate value without extra bodies |
| Forge Key | boss, objectives, chest, dispatch | equipment forge draw | deliberate equipment pull |
| Fusion weapon ingredient | chest/boss/forge/progression | fusion recipe | visible form/attack milestone |
| Fusion material | battle/chest/dispatch | fusion recipe | shared upgrade ingredient |
| Promotion Material | area/boss/dispatch | Tier promotion | deterministic evolution |
| Mutation Fragments | mutation encounters | guaranteed mutation unlock | RNG backstop |

A slime duplicate is immediately represented as a type-specific fusion item (for example `Sword Slime Core`), not a permanent population unit.

`Slime Gel -> visible body count` is removed from current design. If a Gel resource is reintroduced later, it must serve a new explicit purpose rather than resurrecting population growth implicitly.

Premium currency is intentionally outside the initial product specification.

## 3. Areas

Initial world horizon contains eight areas.

| Area | Theme | Primary new question | Major boss | Important unlock |
|---|---|---|---|---|
| 1 Clover Road | bright grass road | jobs + first fusion | Great Mushroom | Sword/Bow foundation |
| 2 Mushroom Forest | giant colorful fungi | ranged vs swarm | Spore Boar | Wand/Dagger families |
| 3 Amber Mine | crystal mine | armor/break | Amber Golem | Shield/Gun families |
| 4 Sunken Marsh | shallow water/ruins | movement/control | Mire Hydra | first Tier 3 crests |
| 5 Frost Ruins | snow + blue ruins | slowing fields | Frost Colossus | Frost/precision paths |
| 6 Ember Canyon | volcanic red rock | burst/survival | Magma Tortoise | Dragon fragments begin |
| 7 Moonlit Castle | moonlit keep | mixed elites | Crown Warden | King/Prism paths |
| 8 Dragon Crater | black rock, stars, lava | full composition test | Ancient Sky Dragon | Dragon Core / world clear |

Area unlock is sequential for the first world. Normal stages can be farmed after a blocking boss.

## 4. Chest cadence

Treasure chests are physical battlefield events.

Initial target cadence while actively progressing:

- meaningful chest opportunity roughly every 20–40 seconds
- normal waves may drop Wood/Silver chests
- elites skew Silver/Gold
- bosses guarantee at least Gold-equivalent reward
- Rainbow chests are rare excitement events and also appear at selected deterministic milestones

Chest contents may include slime acquisition, equipment, Gold, keys, promotion materials, or mutation progress.

A chest auto-opens after a short delay when ignored. Tapping it is faster, never mandatory.

## 5. Slime acquisition and duplicate value

The first acquisition of a type creates/discovers that roster entry.

A later acquisition of the same type converts into a type-specific Slime Core / branch fusion item. The player does not receive another assignable copy.

The product must avoid two failure modes:

1. duplicate = useless trash
2. duplicate = another body that clutters the battle screen

Recipe fusion solves duplicate value without turning collection into population management. A recipe can combine the type-specific Slime Core with a weapon ingredient and ordinary material.

Core normal-job discovery remains deterministic enough that unlucky acquisition cannot block the basic game.

Exact slime acquisition pools/rates are balance/content data and are not fixed by this document yet.

## 6. Fusion economy

Fusion is recipe-based. The canonical ingredient families are:

- one type-specific Slime Core or branch item from same-type reacquisition
- zero or one weapon ingredient when the milestone changes the weapon/form silhouette
- a small quantity of ordinary fusion material

Recipes may scale by fusion rank, but routine fusion should normally stay within 2–3 ingredient families rather than becoming currency soup.

The first Sword recipe is:

`Sword Slime Core x1 + Greatsword Blank x1 + Hardening Gel x2` at Lv.10.

A fusion action should show every recipe item, owned/required counts, level requirement, resulting form, and resulting combat behavior. Missing ingredients are explicit; there is no hidden success chance.

Fusion does not alter slime body size.

## 7. Equipment families

Six weapon families align with the six normal branches:

- Sword
- Shield
- Bow
- Wand
- Dagger
- Gun

A slime type equips one family-compatible weapon. This avoids multi-slot inventory micromanagement.

Basic family access for normal jobs is deterministic. Random drops improve quality rather than deciding whether the branch exists at all.

## 8. Equipment rarity

Five equipment rarities remain the content target:

1. Common
2. Rare
3. Epic
4. Legendary
5. Mythic

Rarity should increasingly affect visible behavior.

- Common: clear base attack identity
- Rare: one readable modifier
- Epic: stronger modifier + improved projectile/impact presentation
- Legendary: build-defining behavior change
- Mythic: named weapon + signature VFX/behavior

## 9. Forge draw

Random equipment acquisition has two sources:

1. battle chest drop
2. Forge draw using Forge Keys

Forge draws equipment, not mandatory core-job access.

Initial rarity targets may use conventional weighted rates and pity, but exact probabilities remain tuning data. Pity counters must persist and cannot be rerolled by reload.

### Equipment duplicates

A duplicate weapon feeds that exact weapon's refinement track first. Once capped, overflow may convert to family material.

Slime duplicate fusion and weapon duplicate refinement are intentionally separate systems.

## 10. Mythic collection

Longer-term target contains multiple Mythics per weapon family so collection does not collapse into one universal best item.

Examples:

| Family | Mythic A | Identity | Mythic B | Identity |
|---|---|---|---|---|
| Sword | Starcleaver | traveling crescent slash | Bloodmoon Edge | echo strike |
| Shield | Aegis of Dawn | team barrier wave | Worldshell | absorb then shockwave |
| Bow | Comet String | piercing star arrow | Tempest Branch | chain multishot |
| Wand | Sunseed Staff | miniature meteor bloom | Zero Crystal | freeze then shatter |
| Dagger | Nightglass Twins | teleport echo strikes | Kingbee Fang | execute mark spread |
| Gun | Jellynova | explosive bouncing rounds | Clockwork Choir | synchronized mini-cannons |

Names are content-level and may change; behavioral differentiation is the important contract.

## 11. Dispatch

Dispatch gives reserve slime types productive work outside the main battlefield.

### Assignment rule

- only owned, non-battle slime types can be dispatched
- one type cannot be assigned to battle and dispatch simultaneously
- same-type duplicate stock is not a dispatchable extra body

### Initial contract families

| Contract | Typical duration | Reward bias |
|---|---:|---|
| Road Escort | short | Gold |
| Forest Exploration | medium | equipment / Forge Key |
| Material Gathering | medium/long | promotion materials |

Exact durations are balance data.

### Complexity guardrail

Initial dispatch does **not** require:

- percentage failure chance
- fatigue/stamina
- per-body headcount requirements
- elaborate element/role bonus matrices
- dozens of simultaneous chores

A simple `choose reserve slime -> choose job -> wait -> return with reward` loop is enough.

## 12. Stage growth and blockers

Enemy power rises smoothly until a boss checkpoint.

If a boss is too strong:

- return to the best cleared farming stage
- Gold/chests/slime acquisition continue
- UI surfaces a few concrete improvement opportunities such as level/fusion/equipment
- offline progress stops at the blocking boss rather than faking a clear

## 13. Offline progression

Offline combat uses analytical simulation.

Return summary prioritizes changes over accounting detail:

```text
OFFLINE 3h 42m
+ Gold
+ chests / equipment
+ slime copies

Fusion ready: Sword Slime
Dispatch complete: Forest Exploration
Boss reached: Frost Colossus
```

Completed dispatches should be resolved deterministically and included in the same concise return flow where practical.

## 14. Daily/recurring systems

Do not lead with checklist-heavy daily missions.

The battle/fusion/evolution/dispatch loop must stand on its own without login chores.

## 15. Long-term prestige

A reset-style prestige system may be considered only after the base world loop proves itself. Do not add prestige merely because this is an idle game.

If adopted, it should preserve major collection/fusion achievements unless a stronger product reason emerges.

## 16. Economy acceptance

Simulation and play testing should eventually confirm:

- first 10 minutes include at least one new job and one fusion
- duplicate slime acquisition always has clear value
- fusion does not create extra battlefield bodies
- normal branch completion is not RNG-gated
- equipment duplicates remain useful
- reserve roster has useful dispatch work
- dispatch does not become mandatory spreadsheet maintenance
- high-rarity equipment is exciting while normal progression remains functional without it
