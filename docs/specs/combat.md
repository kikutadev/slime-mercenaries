# Combat Specification

Status: Current
Date: 2026-09-17

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
