# Evolution, Fusion & Roster

Status: Current
Date: 2026-09-16

## 1. Roster model

The roster is a collection of **persistent slime instances**. A job type describes an instance's family/form, but does not uniquely identify the owned slime.

Each created combat slime receives a stable instance ID and owns its own level, promotion path, fusion rank/form, equipment loadout, and assignment. Plain Slime stock remains the renewable untrained body resource used to create normal jobs; stock itself is not individually managed.

Multiple instances of the same job type may exist, fight in different formation slots, or split between battle, reserve, and Dispatch.

## 2. Growth axes

The core growth model uses three distinct concepts.

### Type level

Frequent Gold-spend growth on one selected slime instance. Primarily increases combat stats and gives the player a regular upgrade action.

### Fusion

Repeated job creation adds another persistent slime instance. Fusion input is produced only when the player explicitly converts a spare **reserve** instance into that family's Slime Core.

Fusion remains recipe-based.

- same-job duplicates remain assignable bodies by default
- a reserve duplicate may be explicitly converted into a Slime Core / equivalent branch item
- the last owned instance of a type cannot be consumed this way
- battle or Dispatch instances cannot be consumed
- fusion recipes may combine Slime Core + weapon ingredient + ordinary material
- exact recipe quantities and rank cap are balance data
- fusion may unlock visible combat behavior or a linear upgraded form at milestones
- the first Sword fusion milestone at Lv.10 unlocks the `Greatsword` fusion form on the selected Sword instance while preserving its promotion tier

### Promotion / evolution

Changes the job form itself and therefore the attack identity.

Promotion is not the same as fusion. Fusion strengthens the selected slime instance and may change its fusion presentation/form, such as Sword Slime -> Greatsword fusion form, without consuming a promotion tier. Promotion changes the actual job tier and later specialization according to progression requirements.

Canonical state therefore keeps these axes separate: `jobTier/promotionPath` and `fusionRank/fusionForm`. Greatsword is not the Tier-2 job that competes with Fighter; Fighter remains the Tier-2 promotion of the Sword branch.

## 3. Body-size invariant

Fusion and ordinary level growth must not increase the slime body's gameplay scale.

Across low/high fusion ranks of the same form:

- baseline body width/height stays constant
- camera occupancy stays constant
- hit readability stays comparable

Strength can be expressed through weapon finish, small accessories, attack pattern, VFX, projectile behavior, timing, or skill unlocks.

A fusion-milestone or promoted form may have a distinct weapon/accessory silhouette while keeping the slime body dimensions stable. “Stronger = simply bigger slime” is not the progression language. Bosses/enemies are not bound by this player-character rule.


## 4. Plain Slime supply and normal-job creation

Plain Slime is the renewable body source for the normal job tree. The player does not wait for a completed Sword/Bow/etc. character to drop directly.

### Plain Slime stock

- Plain Slime stock is created from a small recipe of slime-generation materials.
- Plain Slime can also be purchased for Gold from the normal shop. The shop is the deterministic backstop so material RNG cannot halt job creation.
- Plain stock is a countable resource: stock entries do not own level, equipment, individual stats, names, or assignment.
- The canonical `Plain Slime` combat type may still exist as a discovered roster type; the stock consumed for job creation is a separate resource concept.

Initial conceptual recipe:

```text
Slime Gel + Life Water / equivalent common catalyst
-> Plain Slime stock +1
```

Exact names, quantities, crafting time, and Gold price are balance/content data. Routine Plain creation should remain simple and use no more than a small number of ingredient categories.

### Job creation

Normal Tier-1 jobs use:

```text
Plain Slime stock x1
+ Job Gear x1
-> job creation
```

`Job Gear` is a profession catalyst, distinct from the persistent combat Equipment inventory. A Sword Job Gear creates the Sword job; a Bow Job Gear creates the Bow job, etc. The first tutorial families are guaranteed and later normal families gain deterministic access as areas unlock.

Resolution is state-dependent:

- job not yet discovered -> create the first persistent instance and show NEW presentation
- job already discovered -> create another persistent instance of the same type

Extra same-type bodies remain usable in formation or Dispatch. If the player later wants Fusion input, one eligible reserve duplicate can be explicitly converted into the family Slime Core.

## 5. Evolution tree overview

The longer-term launch-content target retains the following 30 discoverable forms:

```text
Plain Slime
├─ Sword Slime
│  └─ Fighter Slime
│     ├─ Blademaster Slime
│     └─ Berserker Slime
├─ Shield Slime
│  └─ Guardian Slime
│     ├─ Paladin Slime
│     └─ Fortress Slime
├─ Bow Slime
│  └─ Ranger Slime
│     ├─ Sniper Slime
│     └─ Storm Archer Slime
├─ Wand Slime
│  └─ Mage Slime
│     ├─ Archmage Slime
│     └─ Frost Mage Slime
├─ Dagger Slime
│  └─ Rogue Slime
│     ├─ Ninja Slime
│     └─ Assassin Slime
└─ Gun Slime
   └─ Gunner Slime
      ├─ Cannoneer Slime
      └─ Engineer Slime

Rare mutations:
- King Slime
- Golden Slime
- Dragon Slime
- Prism Slime
- Mimic Slime
```

Count: 1 root + 6 Tier 1 + 6 Tier 2 + 12 Tier 3 + 5 mutation = **30 forms**.

This is a content horizon. The first production slice should prove the loop with a much smaller subset.

## 6. Standard forms

| # | Type | Tier | Battlefield identity | Signature behavior | Visual read |
|---:|---|---:|---|---|---|
| 1 | Plain Slime | 0 | base | weak bounce attack | clean aqua blob |
| 2 | Sword Slime | 1 | melee | short slash | oversized sword |
| 3 | Fighter Slime | 2 | melee bruiser | 2-hit combo | headband + broader sword |
| 4 | Blademaster Slime | 3 | fast cleave | dash-through arc | scarf + long blade |
| 5 | Berserker Slime | 3 | burst melee | faster at low HP | chipped greatsword + wild brow |
| 6 | Shield Slime | 1 | defender | body-block / guard | round shield almost body-sized |
| 7 | Guardian Slime | 2 | tank | guard pulse | tower shield + small helm |
| 8 | Paladin Slime | 3 | sustain tank | nearby barrier pulse | white-gold shield + halo crest |
| 9 | Fortress Slime | 3 | pure tank | planted heavy reduction | square pavise + squat stance |
| 10 | Bow Slime | 1 | ranged | single arrow | bow carried sideways |
| 11 | Ranger Slime | 2 | ranged | quick double shot | green hood + recurved bow |
| 12 | Sniper Slime | 3 | boss killer | long aim, piercing shot | enormous longbow + sight |
| 13 | Storm Archer Slime | 3 | wave clear | fan volley / chain arrow | feather crest + electric tips |
| 14 | Wand Slime | 1 | magic | small magic orb | crooked wand + tiny cap |
| 15 | Mage Slime | 2 | magic AoE | splash projectile | pointed hat + floating rune |
| 16 | Archmage Slime | 3 | burst AoE | meteor/rune burst | tall star hat + orbiting motes |
| 17 | Frost Mage Slime | 3 | control | freeze field / slow | pale crystal crown + frost mist |
| 18 | Dagger Slime | 1 | skirmisher | quick stab | tiny hood + dagger |
| 19 | Rogue Slime | 2 | mobile DPS | sidestep + back attack | dark hood + twin daggers |
| 20 | Ninja Slime | 3 | mobile multi-hit | vanish dash + shuriken | scarf tails + forehead plate |
| 21 | Assassin Slime | 3 | execute | low-HP burst | narrow mask + curved blades |
| 22 | Gun Slime | 1 | ranged rapid | pistol shot | comically large flintlock |
| 23 | Gunner Slime | 2 | ranged sustained | burst fire | goggles + short carbine |
| 24 | Cannoneer Slime | 3 | explosive AoE | arcing shell | cannon behind body |
| 25 | Engineer Slime | 3 | utility DPS | temporary turret | goggles + wrench + mini turret |

## 7. Rare mutation forms

Rare mutations are horizontally special rather than universal upgrades.

| # | Mutation | Eligible origin | Identity | Surprise path | Deterministic backstop |
|---:|---|---|---|---|---|
| 26 | King Slime | Tier 3 families | team aura | rare Royal Crown event | Crown Fragments |
| 27 | Golden Slime | Tier 2+ | economy/support | Golden Jelly event | Gold Gel Fragments |
| 28 | Dragon Slime | selected Tier 3 | elite bruiser | Dragon Core | guaranteed late milestone |
| 29 | Prism Slime | magic/ranged Tier 3 | elemental burst | Prism Core | Prism Shards |
| 30 | Mimic Slime | special capture | trick DPS | hostile mimic event | Mimic Heart path |

No Codex completion should require indefinite luck.

## 8. Promotion rules

### Plain -> Tier 1

The defining fantasy is **create a Plain Slime, give it Job Gear, discover a job**.

Requirements:

- Plain Slime stock x1
- relevant Job Gear x1
- small Gold / progression requirement if needed

The first Sword and Bow family access is tutorial-guaranteed. Other normal families become deterministically accessible as areas unlock.

### Tier 1 -> Tier 2

Requirements may include:

- type level threshold
- common promotion material
- Gold

Tier 2 is a clear branch upgrade, not a random result.

### Tier 2 -> Tier 3

Requirements may include:

- type level threshold
- branch crest from relevant area/boss
- player selects one of two specializations

Tier 3 has a global progression floor at Area 4 / Sunken Marsh, the first authored Tier-3 crest area. This is only the earliest gate: branch-specific crest definitions may require a later area or boss once that content is authored. Owning generic promotion material early must not bypass the Area-4 floor.

Exact thresholds beyond that floor are balance/content data.

## 9. Fusion behavior

When a normal job is created from Plain Slime + Job Gear:

### First creation

- discover/unlock the type if not already owned
- create a persistent slime instance with its own progression state
- show NEW presentation when appropriate

### Repeated creation

- create another persistent slime instance
- keep it assignable to formation, Dispatch, or reserve
- never auto-merge or silently convert it into Fusion material

Fusion is recipe-based. A recipe may consume the type-specific Slime Core together with a weapon ingredient and ordinary material, and may also require a level threshold. A Slime Core is obtained by an explicit conversion of an eligible spare reserve instance, never by automatic duplicate resolution.

The first Sword milestone requires Lv.10 plus `Sword Slime Core x1 + Greatsword Blank x1 + Hardening Gel x2`. The fusion presentation still shows two Sword Slime models merging for readability and fantasy, but the durable inventory cost is the recipe items. The result unlocks the Greatsword fusion form on the Sword branch: same promotion tier, same slime-body scale, visibly broader greatsword, and a fast half-turn horizontal sweep that damages nearby enemies.

Fusion preserves the selected instance's already-earned level and identity. A milestone may replace the equipped weapon/form presentation as part of the upgrade; it is not a reset and does not create another persistent body.

## 10. Fusion milestone presentation

A fusion milestone should be satisfying without pretending the character became a physically larger creature.

Possible milestone rewards:

- stat bump
- weapon accent improvement
- attack changes motion class, such as single-target slash -> spinning area sweep
- projectile gains pierce/split
- impact trail becomes stronger
- passive/signature behavior unlocks

The first fusion tutorial uses two same-size Sword Slime models side by side, pulls them into the center, flashes at contact, then reveals same-body-size Greatsword Slime and immediately previews its fast half-turn horizontal sweep.

## 11. Assignment states

Each owned slime instance can be:

- in the active battle formation
- dispatched on one contract
- reserve

Multiple instances of the same type may occupy different battle slots. A single instance cannot battle while it is dispatched, but another same-type instance may do so.

A duplicate remains independently assignable until the player explicitly converts that reserve body into Fusion input.

## 12. Role interactions

The six branches create understandable differences without hard rock-paper-scissors requirements.

- Sword: reliable frontline damage
- Shield: survival / protection
- Bow: safe physical range
- Wand: area magic / control
- Dagger: mobility / execute
- Gun: sustained or explosive ranged damage

Behavior should be visible first and numerically optimized second.

## 13. Discovery presentation

Codex can show the full long-term tree while hiding exact recipes until relevant.

When a NEW form is created:

1. battlefield briefly slows without a long hard-cut
2. slime jumps / compresses
3. equipment or form silhouette changes
4. bright jelly flash
5. new job name + one-line behavior tag
6. return directly to battle with the new attack demonstrated

Target duration: roughly 1.5–2.5 seconds for normal forms; mutation reveal may be longer.

Fusion uses a shorter presentation than a new-form discovery.

## 14. Balance guardrails

- Fusion strengthens favorites without forcing duplicate bodies onto the field.
- Type level remains a frequent deterministic growth path so duplicate drought does not stop all progress.
- Normal branch discovery is not gated solely by low-probability acquisition.
- Tier 3 specialization is a role choice first, power increase second.
- Mutation does not obsolete the normal tree.
- A favorite type remains usable after new forms are discovered.
