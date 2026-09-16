# Progression, Loot, Dispatch & Economy

Status: Current
Date: 2026-09-16

## 1. Economy goal

The economy exists to keep one question alive:

> **次の宝箱・Plain生成・職業作成・合成・装備更新で、このスライムの戦い方がどう変わるか。**

Do not create currencies merely to add systems. Every resource must have an obvious sink and payoff.

## 2. Core resources and growth inputs

| Input | Source | Primary sink | Purpose |
|---|---|---|---|
| Gold | kills, stage, dispatch, offline | type level, Plain Slime shop purchase, promotion fees | frequent growth + deterministic body supply |
| Slime-generation material | battle, chest, dispatch | Plain Slime crafting | renewable body supply |
| Plain Slime stock | crafting, Gold shop | normal-job creation | untrained body source; no individual progression |
| Job Gear | tutorial, area progression, chest/component crafting | normal-job creation | choose/discover a Tier-1 profession |
| Type-specific Slime Core | repeated creation of an already-discovered job | fusion recipe | preserve duplicate value without extra bodies |
| Forge Key | boss, objectives, chest, dispatch | equipment forge draw | deliberate equipment pull |
| Fusion weapon ingredient | chest/boss/forge/progression | fusion recipe | visible form/attack milestone |
| Fusion material | battle/chest/dispatch | fusion recipe | shared upgrade ingredient |
| Promotion Material | area/boss/dispatch | Tier promotion | deterministic evolution |
| Mutation Fragments | mutation encounters | guaranteed mutation unlock | RNG backstop |

A repeated job creation is immediately represented as a type-specific fusion item (for example `Sword Slime Core`), not a permanent population unit.

Slime-generation material such as Gel is valid specifically as an input for **Plain Slime stock crafting**. It does not directly increase battlefield body count. Plain stock is consumed when creating jobs and carries no individual progression state.

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

Chest contents may include slime-generation materials, Job Gear/components, fusion ingredients, equipment, Gold, keys, promotion materials, or mutation progress. Completed normal-job slimes are not the default chest reward.

A chest auto-opens after a short delay when ignored. Tapping it is faster, never mandatory.

## 5. Plain Slime supply, shop, and job creation

Normal-job acquisition begins from Plain Slime stock. Completed Sword/Bow/etc. slimes are not the ordinary random-drop unit.

### Material crafting

A small common recipe creates one Plain Slime stock. Initial product should use only a small number of ingredient categories, for example:

```text
Slime Gel + Life Water / equivalent catalyst
-> Plain Slime stock x1
```

Exact names and quantities are balance data. Crafting is deterministic once ingredients are owned; there is no failure roll.

### Gold shop backstop

Plain Slime stock can also be purchased directly for Gold. This is not intended as a premium shortcut. It is the deterministic backstop that prevents unlucky material drops from blocking job creation.

The shop price should compete meaningfully with Type Level spending without becoming so expensive that normal-job creation stalls. Repeated purchase price may be flat or use a mild authored curve; exact values require simulation.

### Job creation

Normal Tier-1 job creation uses:

```text
Plain Slime stock x1 + Job Gear x1 -> resolve job creation
```

Job Gear is a profession catalyst and is separate from persistent combat Equipment. The first Sword/Bow Job Gear is tutorial-guaranteed; later normal Job Gear families unlock deterministically with area progression. Random drops may accelerate acquisition but cannot be the only route.

Resolution:

- undiscovered job -> create the canonical roster record and mark it NEW
- already-discovered job -> convert the repeated creation into that job's type-specific Slime Core / fusion input

No repeated job creation produces another assignable same-type body. This keeps duplicate value while preserving the one-type/one-body battlefield rule.

## 6. Fusion economy

Fusion is recipe-based. The canonical ingredient families are:

- one type-specific Slime Core or branch item from repeated job creation
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

The current runtime uses Forge Key as a Token-funded Kit Gacha cost. Draw RNG/pity state is persisted by Kit; newly drawn weapons become persistent Kit Inventory instances, one family-compatible weapon can be equipped through a Kit Loadout, duplicate draws increase product-owned refinement rank, and capped duplicates overflow to family material.

The Sword/Bow vertical slice currently includes Common/Rare/Mythic representatives (`Bronze Saber`, `Clover Blade`, `Starcleaver`, `Hunter Bow`, `Windstring`, `Comet String`). Epic/Legendary content and additional families remain content expansion; the ownership/draw/refinement contract is already fixed.

Initial rarity targets may use conventional weighted rates and pity, but exact probabilities remain tuning data. Pity counters must persist and cannot be rerolled by reload.

### Equipment duplicates

A duplicate weapon feeds that exact weapon's refinement track first. Once capped, overflow may convert to family material.

Repeated-job fusion and weapon duplicate refinement are intentionally separate systems.

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
- Plain stock and type-specific fusion inputs are resources, not dispatchable bodies

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
- Gold/chests/slime-generation materials/Job Gear components continue
- UI surfaces a few concrete improvement opportunities such as level/fusion/equipment
- offline progress stops at the blocking boss rather than faking a clear

## 13. Offline progression

Offline combat uses analytical simulation.

Return summary prioritizes changes over accounting detail:

```text
OFFLINE 3h 42m
+ Gold
+ chests / equipment
+ Plain-generation materials / Job Gear / fusion ingredients

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
- repeated job creation always has clear fusion value
- Plain Slime can always be obtained through either deterministic crafting or the Gold-shop backstop
- fusion does not create extra battlefield bodies
- normal branch completion is not RNG-gated
- equipment duplicates remain useful
- reserve roster has useful dispatch work
- dispatch does not become mandatory spreadsheet maintenance
- high-rarity equipment is exciting while normal progression remains functional without it
