# Combat Specification

Status: Current
Date: 2026-09-18

## 1. Combat goal

Combat must be enjoyable to watch before the player opens any menu.

The intended read is:

> small soft creatures fight with surprisingly committed weapon motions, and each one is readable enough that the player notices when it attacks, gets hit, or collapses.

The system is auto-battle, but units must visibly move, choose targets, react to impacts, and march forward. Stationary damage turrets are not acceptable as the default feel.

## 2. Battlefield

Reference viewport is portrait 9:19.5.

The combat field occupies approximately the upper 65–72% of the screen. Camera is fixed, 3/4 top-down, with shallow perspective rather than a strict grid.

Friendly entry zone: lower third of battlefield.
Enemy entry zone: upper third.
Contact zone: center.

The battlefield internally uses soft navigation space rather than visible lanes. Units may move laterally enough to avoid exact stacking, but should not wander so far that attack relationships become unreadable.

### 2.1 Clover Road visual progression

The first five stages share one geographic route but must not look like one static arena with different enemies. Environment presentation advances independently from combat balance:

```text
Stage 1  Clover Road       open roadside / full fence / bright grass
Stage 2  Leaf Windway      broken fence / leaf tufts / greener wind corridor
Stage 3  Bloom Verge       flower-lined verge / warmer road / pastel accents
Stage 4  Critter Grove     fence disappears / logs + stones / denser trees
Stage 5  Deep Clover Hollow darker canopy / narrow road / hollow mushrooms
```

Rules:

- stage identity must read from geometry and silhouette before a HUD label
- decorative props stay outside the main contact corridor so enemies and friendly jobs remain the focal point
- the route may darken and narrow toward Stage 5, but faces, weapons, enemy tells, HP, and projectiles must stay readable at portrait mobile size
- environment differences are presentation only; they do not alter navigation, HP, damage, work, rewards, or offline simulation
- each wave applies a deterministic roadside scenery phase so consecutive waves do not present the exact same prop layout
- the 1.55-second approach phase may add subtle scenery/camera travel and enemy entry motion, but all units must settle onto their authored combat coordinates before combat starts
- enemy entry depth follows the encounter formation (`front -> mid -> back -> rear`) with a small bounded stagger rather than spawning every enemy on the same frame

## 3. Main formation

The player assigns up to six persistent slime instances to the active battle formation. Multiple instances may share the same job type.

Each slot deploys **one visible slime**.

```text
Preferred front: [A] [B] [C]
Preferred back:  [D] [E] [F]
```

This is a starting/behavior preference, not a rigid tile board.

- melee types naturally advance farther
- ranged types keep more distance
- mobile types may cross the contact zone temporarily
- after a wave, survivors converge into a short march formation

Fusion rank never spawns extra bodies. Battlefield population comes only from owned slime instances assigned to formation slots; same-type owned instances are allowed in separate slots.

## 4. HP and defeat

Each active slime has readable combat HP.

At the current small-party density, one compact world-space HP bar per active slime is acceptable and preferred over a single ambiguous party HP pool.

When HP reaches zero:

1. unit immediately stops acting
2. short hit/recoil pose
3. body spreads laterally into a flattened jelly shape
4. eyes change to clear `×` marks
5. defeated body remains briefly readable before recovery/result flow

The defeat animation should feel cute and slightly pathetic rather than violent.

Fusion rank does not increase max visual body size. HP/stat growth is numeric/behavioral, while defeat deformation remains relative to the same baseline body dimensions.

## 5. Target selection

Initial default logic should remain intentionally simple.

- melee: nearest reachable enemy
- ranged: nearest living enemy within practical range, otherwise nearest living enemy
- enemy fodder: nearest living ally

Target selection must be stable enough to avoid jitter. Do not add threat tables, elaborate role priorities, flank graphs, or per-frame optimization unless a proven combat readability problem requires them.

Tier-specific signature behaviors may later add exceptions, but simple movement and attack readability take priority over sophisticated AI.

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
- damage numbers optional; battlefield must not depend on them for impact

Routine attacks should not constantly shake the screen.

### Enemy presentation and encounter content

Enemy identity is data-driven rather than authored inside the battle renderer. Stage waves and bosses resolve a stable encounter ID, and each encounter resolves one or more enemy definitions containing the production GLB, behavior, combat values, presentation scale, and boss/fodder class. Offline/headless progression continues to use analytical `work` values and does not depend on rendered meshes.

The first production enemy family is Mushroom:

- `tiny-mushroom`: basic bouncing headbutt fodder
- `plump-mushroom`: slower, heavier bump attacker
- `spore-mushroom`: ranged spore projectile attacker
- `great-mushroom`: first large boss with a clearly telegraphed heavy bounce

Normal Mushroom enemies use a small shared visual grammar but must remain visually subordinate to friendly slimes. Normal encounters target 3–12 enemies. Bosses may be much larger, but their face and attack tell must remain visible in the actual portrait battle camera.

Enemy defeat is comic rather than violent: the enemy is displaced slightly away from the contact pile, spreads/tilts into a soft collapsed pose, switches to readable `×` eyes, remains visible briefly, then clears. Production game and gallery use the same enemy GLBs and the same motion/projectile source.

## 7. Fusion readability in combat

Fusion growth should be noticeable while keeping the base body size stable.

Allowed examples:

- stronger weapon finish / small accessory accent
- second strike added to an existing attack
- longer or brighter slash trail
- projectile gains pierce / split / additional shot
- stronger impact shape
- signature behavior unlock at a fusion milestone

Not allowed as the default fusion language:

- body scale increase
- adding clone bodies to the same slot
- full humanoid armor that obscures slime identity

## 8. Wave structure

A standard stage consists of several short waves followed by a boss checkpoint at defined intervals.

Initial target:

- normal wave: 6–15 seconds
- 3–5 normal waves per stage segment
- boss encounter: 15–35 seconds at appropriate power
- wave transition march: 0.8–1.5 seconds

Exact numbers are balance data.

A wave clear should chain naturally:

```text
last enemy defeat
-> loot pops / chest may appear
-> short reaction
-> camera/background advances
-> units march
-> next enemies enter
```

No result modal for normal waves.

The authored `0.8–1.5 seconds` is the visible handoff into marching, not a second authoritative wave timer. If the product/domain combat has not advanced yet, the party may keep marching in place with looping roadside travel until the authoritative encounter changes.

### 8.1 Encounter staging

Enemy composition owns presentation choreography independently from economy balance. A visual encounter may specify semantic formation slots and a minimum first-attack delay without changing HP, work, rewards, or offline simulation values.

Enemy formation uses four depth bands:

```text
front:  melee pressure / family showcase
mid:    second-rank support / mixed melee
back:   readable ranged line
rear:   one late pressure source when the wave needs extra depth
```

Rules:

- a newly introduced family gets one readable spotlight wave before it is mixed with older families
- melee/frontline bodies should establish the contact shape before ranged VFX begin
- ranged enemies should not release every projectile on the same frame; first attacks are deliberately staggered
- formation slots are authored per encounter when role readability matters; simple onboarding waves may use automatic front-to-rear placement
- Stage 5 should read as a mixed gauntlet with front/mid/back roles, not as a wall of simultaneous projectiles
- presentation staging must not become a second combat balance system; subsequent attack cadence remains owned by the enemy definition/motion profile

### 8.2 Wave-clear authority and visual handoff

The domain combat state remains the single source of truth for `currentWaveIndex`, stage completion, rewards, random drops, and boss progression. `BattleRuntime` is presentation-only and must never select or advance the next encounter on a local visual victory.

Visual victory flow:

```text
final visible enemy defeat
-> domain reward event arrives
-> typed Gold/material loot motes converge on the party
-> exact reward receipt appears
-> survivors compact into the forward march formation
-> enemy HP panel exits
-> roadside scenery loops forward while status reads 進軍中
-> domain `encounterKey` changes
-> next runtime starts from the same march formation
-> front/back roles fan out while new enemies enter
```

Rules:

- the old encounter must not respawn after a visual victory while waiting for the domain
- `combatWaveCleared`, `bossDefeated`, and first-clear `stageCleared` events carry `grantedRewards` describing what was actually granted
- battle reward visuals are derived only from that authoritative payload; presentation must not infer Gold/material amounts from balance tables
- Gold uses coin particles; known materials use stable orb/shard visual families; particle counts are capped independently from reward amount
- the battle receipt shows exact quantities (for example `G +24 · スライムジェル +2`) and may aggregate multiple reward events emitted at the same authoritative boundary
- while the Battle screen is active, the routine global `combat-reward` notice is suppressed to avoid duplicating the exact receipt; milestone/boss/retreat notices remain
- Stage 1 / Wave 1 is the only cold-start formation; later waves and stages use the march formation as their approach origin
- the previous march endpoint and the next encounter start x/z coordinates must match exactly for all six party slots
- local visual defeat may still replay the same encounter because presentation HP is not authoritative product state; this retry must not mutate domain progression
- transition presentation must not alter HP, damage, wave work, rewards, random drops, offline simulation, or target-selection rules

Current Clover Road progression:

```text
Stage 1  Mushroom onboarding
Stage 2  Leaf spotlight -> Whirl Leaf backline -> mushroom/leaf mix
Stage 3  Flower spotlight -> Puff Flower backline -> plant/spore mix
Stage 4  Critter spotlight -> Acorn Squirrel backline -> forest mix
Stage 5  mixed frontline/backline gauntlet -> Great Mushroom checkpoint
```

## 9. Bosses

Bosses are much larger than normal combatants and may have a small number of readable tells. The first implementation should not begin with a large library of complex encounter logic.

Initial boss vocabulary can be built from:

- telegraphed heavy strike
- simple area attack
- add summon
- temporary defensive state

One boss should introduce at most one or two new visible questions at a time. Auto movement handles basic survival; player expression comes mainly from growth and formation rather than twitch dodging.

## 10. Optional universal active action

A universal temporary boost such as Jelly Rush remains a possible later system, but it is **not required for the first core loop**.

The product must first prove that:

- attacks are fun to watch
- fusion changes are satisfying
- chests and job discovery create anticipation
- small-party composition works

Do not add multiple active skill buttons to compensate for weak auto combat.

## 11. Defeat and recovery

A frontier defeat can occur on an authored normal stage power check as well as on a boss. Presentation and recovery rules are identical; Boss is not a special static-stop state.

On party defeat:

- do not show a punitive game-over flow
- keep defeated slimes visible long enough for the `べちゃっ + ×目` reaction to read
- emit the defeat as an authoritative Domain result rather than a renderer-only state
- retreat one stage, preserving `highestStageCleared`
- keep granting the existing Gold, material, chest, equipment, Fusion and Promotion economy while farming
- after the authored farm-clear count, automatically return to the uncleared frontier and retry
- if the retry still fails, repeat the same retreat/farm/retry cycle

Offline resume uses the same analytical transition engine. Farming continues while offline, but the first clear of an uncleared major frontier is deferred until an active session; offline time must never become a progression stop.

Do not trap idle simulation in endless failed boss attempts or a static boss-blocked state.

## 12. Speed and idle controls

- baseline speed: 1x
- optional 2x may exist after onboarding
- default presentation must be polished at 1x
- background/offline uses analytical simulation rather than rendering

## 13. Performance guardrails

The active friendly cap is small, so performance budget should be spent on character quality rather than maximizing body count.

Prefer:

- pooled projectiles and VFX
- shared materials/animation assets where safe
- bounded effects
- target queries at sensible intervals
- deterministic/batched calculations where visually equivalent

Do not optimize for a 30-friendly-body battlefield that is no longer a product requirement.

## 14. Combat acceptance

Representative captures should verify at least:

- 1–2 active slimes: screen does not feel broken or empty
- 3–4 active slimes: individual attacks and HP remain obvious
- 5–6 active slimes: each character still reads as a distinct job
- several enemies around melee: attacker/target relationship remains understandable
- one ally defeat: flattened body and `×` eyes remain visible
- high fusion rank vs low fusion rank: stronger behavior is noticeable without a body-size difference
- boss + adds: VFX do not obscure the small active party