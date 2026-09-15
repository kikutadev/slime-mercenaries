# Combat Specification

Status: Current
Date: 2026-09-15

## 1. Combat goal

Combat must be enjoyable to watch before the player opens any menu.

The intended read is:

> small soft creatures behave like a surprisingly competent army, with clear jobs and escalating spectacle.

The system is auto-battle, but units must visibly move, choose targets, react to impacts, regroup, and march forward. Stationary damage turrets are not acceptable as the default feel.

## 2. Battlefield

Reference viewport is portrait 9:19.5.

The combat field occupies approximately the upper 65–72% of the screen. Camera is fixed, 3/4 top-down, with shallow perspective rather than a strict grid.

Friendly entry zone: lower third of battlefield.
Enemy entry zone: upper third.
Contact zone: center.

The battlefield internally uses soft navigation bands rather than visible lanes. Units may move laterally enough to avoid exact stacking, but should not wander so far that roles become unreadable.

## 3. Formation

The player assigns up to six unique slime types to six logical slots:

```text
Front preference:  [A] [B] [C]
Back preference:   [D] [E] [F]
```

This is a targeting/starting preference, not a rigid tile board.

- Defender/melee types naturally advance farther.
- Ranged types seek preferred attack distance.
- Mobile types may cross bands temporarily.
- After a wave, all surviving bodies converge into a short march formation before the next wave.

The UI should recommend unsuitable placement but not apply opaque punitive debuffs merely for putting a unit in the other row.

## 4. Squad bodies

One formation slot expands to 1–5 visible bodies based on population milestone.

Bodies within the same squad:

- share type level and equipment
- may offset attack timing slightly to avoid robotic sync
- use the same target preference but do not need identical targets
- share squad HP conceptually for progression calculations while each body can visually react and disappear when the squad takes heavy loss

Implementation may simulate per-body HP or a compressed squad model. Presentation must preserve the sense that damage can thin a squad temporarily.

At the next wave, living population is visually restored according to the game’s recovery rules; permanent body loss is not part of the idle loop.

## 5. Target selection

Default priorities:

- Sword/Fighter: nearest reachable enemy
- Shield/Guardian: nearest threatening enemy, with taunt behavior
- Bow/Ranger: nearest enemy within preferred range, slight elite preference at high tier
- Wand/Mage: cluster density when using AoE
- Dagger/Rogue: exposed flank/backline targets when path is available
- Gun/Gunner: nearest or marked priority target depending specialization

Target changes should be stable enough to avoid jitter. Do not retarget every frame merely because distances change by a few pixels.

## 6. Attack readability

Every attack requires:

`anticipation -> release -> travel/contact -> impact -> recovery`

Even fast attacks need a readable release frame and impact feedback.

Minimum feedback vocabulary:

- body squash/stretch on attack
- short weapon motion
- hit spark / jelly wobble on target
- small hit-stop for large attacks only
- readable projectile for ranged attacks
- damage numbers optional and compressible; the battlefield must not depend on them for impact

Boss-critical, Mythic, evolution, and Jelly Rush attacks may use stronger camera shake, freeze, flash, or time scaling, but routine attacks should not constantly shake the screen.

## 7. Wave structure

A standard stage consists of several short waves followed by a boss checkpoint at defined intervals.

Initial target:

- normal wave: 6–15 seconds
- 3–5 normal waves per stage segment
- boss encounter: 15–35 seconds at appropriate power
- wave transition march: 0.8–1.5 seconds

Exact numbers are balance data, not permanent design constants.

A wave clear should chain naturally:

```text
last enemy defeat
-> loot pops / chest may appear
-> squad celebrates for a fraction of a second
-> camera/background advances
-> units march
-> next enemies enter
```

No result modal for normal waves.

## 8. Bosses

Bosses must test something visible rather than being only higher HP.

Launch boss pattern families:

1. telegraphed frontal smash — rewards spread and tank survival
2. summon adds — rewards AoE
3. armored phase — rewards sustained damage / break windows
4. charging lane attack — creates visible repositioning
5. ranged bombardment — threatens backline
6. healing/add support — creates target priority
7. rotating elemental field — rewards control/resistance timing
8. dragon breath + takeoff — final-world spectacle

Auto movement should handle basic survival. Player skill expression in this idle game comes mainly from formation/composition and Jelly Rush timing, not twitch dodging.

## 9. Jelly Rush

Jelly Rush is the single universal active combat action.

### Gauge

Gauge fills from:

- dealing damage
- defeating enemies
- taking significant damage
- opening a battlefield chest gives a small bonus

### Activation

When full:

- active player can tap the prominent Jelly Rush button
- if untouched for a short grace period, it auto-activates
- offline simulation treats it as periodic expected output

### Effect

For approximately 5 seconds:

- all deployed squads gain attack speed and move speed
- each Tier 3 / mutation type triggers its signature skill once near the start
- battle presentation becomes noticeably more energetic
- camera/VFX intensity rises without hiding targets

The button is not one of many cooldowns. It exists as a satisfying optional interruption to watching.

## 10. Defeat and recovery

On party defeat:

- do not show a punitive game-over flow
- squad retreats/bounces backward
- show the blocking boss/stage and the clearest growth opportunities
- return to the latest farmable stage automatically

Example compact recovery sheet:

```text
DRAGON CRATER 8-10
あと少し！ Boss HP 18%

おすすめ
↑ Shield squad Lv. 38 -> 40
NEW Forge ready ×3
[強化を見る]   [再挑戦]
```

The system may auto-repeat the boss only when the player has materially improved or explicitly chooses retry; it should not trap the simulation in endless failed attempts.

## 11. Speed and idle controls

- baseline speed: 1x
- optional 2x unlock may exist after onboarding
- default presentation must be polished at 1x; 2x is not an excuse for slow baseline motion
- app background/offline uses analytical simulation rather than rendering

## 12. Performance guardrails

The visual target of 30 friendly bodies must not imply 30 expensive independent systems.

Prefer:

- pooled entities/projectiles
- shared animation clips/materials
- bounded VFX emitters
- spatial/target queries at sensible intervals
- deterministic or batched damage where equivalent
- LOD-like reduction of tiny secondary effects when battlefield density is high

Do not reduce body count purely to simplify architecture before testing the actual target device/browser budget.

## 13. Combat acceptance

Representative acceptance captures should verify at least:

- 1 squad / 1–2 bodies: still charming, not empty
- 3 squads / ~10 bodies: roles readable
- 6 squads / 20–30 bodies: no severe overlap or VFX washout
- boss with adds: target priorities remain understandable
- Jelly Rush: clearly more exciting than normal combat
- Cannoneer/Archmage/Dragon/Prism attacks: visibly distinct at a glance
