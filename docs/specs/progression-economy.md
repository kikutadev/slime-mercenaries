# Progression, Loot & Economy

Status: Current
Date: 2026-09-15

## 1. Economy goal

The economy exists to keep one question alive:

> **次の宝箱・進化・部隊増員で、戦場がどう変わるか。**

Do not create many currencies merely to add systems. Every resource must have an obvious sink and visual payoff.

## 2. Core resources

| Resource | Source | Primary sink | Purpose |
|---|---|---|---|
| Gold | kills, stage rewards, offline | type level, promotion fees | frequent growth |
| Slime Gel | elite enemies, chest, duplicates | population milestones / squad growth | more visible bodies |
| Forge Key | boss, objectives, chest | equipment forge draw | deliberate equipment pull |
| Promotion Material | area/boss family | Tier 2/3 promotion | deterministic evolution |
| Mutation Fragments | mutation-related encounters | guaranteed mutation unlock | RNG backstop |

Premium currency / monetized purchase currency is intentionally not part of the initial product specification. Monetization can be layered later without making core slime types premium-only.

## 3. Areas

Initial world contains eight areas. Each introduces a visual theme, enemy behavior, and progression opportunity.

| Area | Theme | Primary new question | Major boss | Important unlock |
|---|---|---|---|---|
| 1 Clover Road | bright grass road | how do jobs work? | Great Mushroom | Sword/Bow foundation |
| 2 Mushroom Forest | giant colorful fungi | ranged vs swarm | Spore Boar | Wand/Dagger families |
| 3 Amber Mine | crystal mine | armor/break | Amber Golem | Shield/Gun families |
| 4 Sunken Marsh | shallow water/ruins | movement/control | Mire Hydra | first Tier 3 crests |
| 5 Frost Ruins | snow + blue ruins | slowing fields | Frost Colossus | Frost/precision paths |
| 6 Ember Canyon | volcanic red rock | burst/survival | Magma Tortoise | Dragon fragments begin |
| 7 Moonlit Castle | moonlit fantasy keep | mixed elite formations | Crown Warden | King/Prism paths |
| 8 Dragon Crater | black rock, stars, lava | full composition test | Ancient Sky Dragon | guaranteed Dragon Core / world clear |

Area unlock is sequential for the first world. Normal stages inside an area can be farmed after the player hits a blocking boss.

## 4. Chest cadence

Treasure chests are physical battlefield events.

Initial target cadence while actively progressing:

- meaningful chest opportunity roughly every 20–40 seconds
- normal waves may drop Wood/Silver chests
- elites skew Silver/Gold
- bosses guarantee at least Gold-equivalent reward
- Rainbow chests are rare excitement events and also appear at selected deterministic milestones

The exact drop table is balance data. The following chest identities are product-level:

### Wood Chest

Frequent. Gold, Gel, common/rare equipment.

### Silver Chest

Noticeably better reveal. Rare/epic equipment, keys, promotion material.

### Gold Chest

Boss/elite reward. Epic+ emphasis, larger progression materials.

### Rainbow Chest

Major event. High-rarity equipment and special mutation/material chance. A Rainbow reveal must have a distinct short animation and battlefield celebration.

A chest auto-opens after a short delay when ignored. Tapping it is faster and more satisfying, never mandatory.

## 5. Equipment families

Six weapon families align with the six normal branches:

- Sword
- Shield
- Bow
- Wand
- Dagger
- Gun

A slime type equips one family-compatible weapon. This keeps equipment readable and avoids multi-slot inventory micromanagement.

Tier-1 job discovery requires access to the family, but never requires rolling a rare item. A basic family item becomes craftable/guaranteed when the corresponding branch is unlocked.

## 6. Rarity

Five equipment rarities:

1. Common
2. Rare
3. Epic
4. Legendary
5. Mythic

Rarity is not only a scalar.

- Common: clear base attack identity
- Rare: one readable modifier
- Epic: stronger modifier + improved projectile/impact presentation
- Legendary: build-defining behavior change
- Mythic: unique named weapon, signature VFX, strong collection identity

## 7. Forge draw / gacha

Random equipment acquisition has two sources:

1. **battle chest drop** — ambient variable reward
2. **Forge draw** using Forge Keys — deliberate player-initiated draw

The Forge is the conventional gacha-like presentation, but its pool contains equipment rather than slime characters.

Initial rarity targets for a single Forge result:

| Rarity | Base rate |
|---|---:|
| Common | 48% |
| Rare | 30% |
| Epic | 15% |
| Legendary | 6% |
| Mythic | 1% |

These are initial tuning values and can change with simulation, but the pity behavior below is a design contract.

### Pity

- every 10 draws: Epic+ guaranteed if the preceding nine had no Epic+
- by 50 draws since last Legendary+: Legendary+ guaranteed
- by 120 draws since last Mythic: Mythic guaranteed
- pulling the guaranteed class naturally resets that class’s counter
- pity state persists across sessions

### Duplicate handling

A duplicate weapon is never discarded for generic currency only.

Duplicates feed that exact weapon’s refinement track first. Refinement increases strength and, at key levels, improves the weapon’s visible effect. Once refinement is capped, overflow converts to family mastery material.

## 8. Mythic collection

Launch target contains at least 12 Mythic weapons, two per family. There is deliberately no single universal Mythic that ends collection desire.

| Family | Mythic A | Identity | Mythic B | Identity |
|---|---|---|---|---|
| Sword | Starcleaver | long crescent slash travels forward | Bloodmoon Edge | frenzy echoes repeat last strike |
| Shield | Aegis of Dawn | periodic team barrier wave | Worldshell | absorbs a heavy hit then shockwaves |
| Bow | Comet String | piercing star arrow | Tempest Branch | chain-lightning multishot |
| Wand | Sunseed Staff | miniature meteor bloom | Zero Crystal | freeze field then shatter burst |
| Dagger | Nightglass Twins | teleport echo strikes | Kingbee Fang | rapid execute marks spread on kill |
| Gun | Jellynova | explosive bouncing rounds | Clockwork Choir | deploys synchronized mini-cannons |

Names are current content names but may be localized later. Their behavioral identities should remain differentiated even if names change.

## 9. Equipment effect examples

A modifier vocabulary should favor visible behavior:

- +1 projectile
- pierce 1 target
- projectile splits after first hit
- explosion radius
- ricochet
- attack leaves short-lived field
- critical hit creates a visible follow-up
- shield bash emits wave
- dagger kill resets dash
- turret duration / count

Flat attack/HP multipliers still exist for balance but should not be the only reason to care about a high-rarity item.

## 10. Squad growth

Slime Gel is primarily the population-growth resource.

Population milestones unlock visible bodies 1→2→3→4→5. Costs rise by milestone and by Tier.

The first few additional bodies should be cheap enough that a new player sees the army grow during the first session.

Past five visible bodies, further Gel investment may grant squad-size stat bonuses without spawning extra runtime entities.

## 11. Evolution materials

Promotion materials are area-linked, not random-exclusive.

- Tier 2 material: common area crest/ore, farmable
- Tier 3 branch crest: boss/elite progression reward plus farmable fragments
- mutation: surprise item can skip grind, deterministic fragment path guarantees eventual acquisition

The player should not spend days waiting for one specific low-probability core before accessing a normal branch.

## 12. Stage growth and blockers

Normal progression uses stage numbers inside the current area. Enemy power rises smoothly until a boss checkpoint.

If a boss is too strong:

- the player returns to the best cleared farming stage
- Gold/Gel/chests continue accumulating
- the UI surfaces 1–3 concrete improvement opportunities
- offline progress stops at the blocking boss rather than faking a clear

## 13. Offline rewards

Offline simulation uses capped effective time, initially targeting 8 hours without special upgrades.

Return summary prioritizes changes over raw totals:

```text
OFFLINE 3h 42m
+ 128K Gold
+ 84 Gel
+ 7 chests

NEW! Legendary Wand
Population ready: Ranger 2 -> 3
Boss reached: Frost Colossus
```

The player can inspect details, but the default return surface must not become an accounting report.

## 14. Daily/recurring systems

Do not lead with a checklist-heavy daily mission system.

Initial recurring incentives should be lightweight:

- first boss clear rewards
- Forge Key earned naturally through play
- optional daily bonus chest may exist later

The battle/evolution loop must stand on its own without login chores.

## 15. Long-term prestige

A reset-style prestige system named **Migration** is reserved for post-base-world expansion.

It must not be implemented merely because this is an idle game. Add it only after the 8-area loop proves that replay compression creates a desirable new experience.

If adopted, Migration should preserve:

- Codex discovery
- Mythic weapon ownership/refinement
- mutation unlocks
- major account-level achievements

and reset/recompress ordinary area/stage growth. Exact behavior is deferred.

## 16. Economy acceptance

Simulation and play testing should eventually confirm:

- first 10 minutes contain at least two visible roster changes
- chest droughts do not create long dead stretches
- normal branch completion is not RNG-gated
- duplicate equipment remains useful
- pity cannot be rerolled by reload
- five-body population milestones feel visually valuable enough to justify Gel spending
- Mythics are exciting but normal progression remains functional without them
