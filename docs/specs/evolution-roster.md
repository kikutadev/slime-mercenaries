# Evolution, Fusion & Roster

Status: Current
Date: 2026-09-16

## 1. Roster model

The roster is a collection of **slime types/forms**, not a warehouse of persistent individual bodies.

For each discovered type, the player owns one canonical progression record. Reacquiring the same type supplies fusion input to that record rather than permanently increasing a population count.

The active battlefield therefore shows at most one body of a given type.

## 2. Growth axes

The core growth model uses three distinct concepts.

### Type level

Frequent Gold-spend growth. Primarily increases combat stats and gives the player a regular upgrade action.

### Fusion

Reacquiring the same type provides fusion progress for that type.

Fusion is the main answer to “what happens when I get this slime again?”

- duplicates are useful
- duplicates are not extra battlefield bodies
- exact duplicate requirements and rank cap are balance data
- fusion may unlock visible combat behavior at milestones

### Promotion / evolution

Changes the job form itself and therefore the attack identity.

Promotion is not the same as fusion. Fusion makes the owned form stronger; promotion moves the branch to a new form/specialization according to progression requirements.

## 3. Body-size invariant

Fusion and ordinary level growth must not increase the slime body's gameplay scale.

Across low/high fusion ranks of the same form:

- baseline body width/height stays constant
- camera occupancy stays constant
- hit readability stays comparable

Strength can be expressed through weapon finish, small accessories, attack pattern, VFX, projectile behavior, timing, or skill unlocks.

A promoted form may have a distinct silhouette because it is a different design, but “stronger = simply bigger slime” is not the progression language. Bosses/enemies are not bound by this player-character rule.

## 4. Evolution tree overview

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

## 5. Standard forms

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

## 6. Rare mutation forms

Rare mutations are horizontally special rather than universal upgrades.

| # | Mutation | Eligible origin | Identity | Surprise path | Deterministic backstop |
|---:|---|---|---|---|---|
| 26 | King Slime | Tier 3 families | team aura | rare Royal Crown event | Crown Fragments |
| 27 | Golden Slime | Tier 2+ | economy/support | Golden Jelly event | Gold Gel Fragments |
| 28 | Dragon Slime | selected Tier 3 | elite bruiser | Dragon Core | guaranteed late milestone |
| 29 | Prism Slime | magic/ranged Tier 3 | elemental burst | Prism Core | Prism Shards |
| 30 | Mimic Slime | special capture | trick DPS | hostile mimic event | Mimic Heart path |

No Codex completion should require indefinite luck.

## 7. Promotion rules

### Plain -> Tier 1

The defining fantasy is **give equipment, discover a job**.

Requirements:

- relevant Job Gear family unlocked
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

Exact thresholds are balance data.

## 8. Fusion behavior

When a slime type is acquired:

### First acquisition

- discover/unlock the type if not already owned
- create its canonical roster progression state
- show NEW presentation when appropriate

### Reacquisition

- add fusion input for that exact type or its canonical branch record
- show a compact “fusion ready/progress” result
- do not create a second persistent character card by default

When fusion requirements are met, the player can merge and advance fusion progression.

Fusion must preserve already-earned level/equipment state unless a later explicit design says otherwise. Fusion is an additive strengthening action, not a reset.

## 9. Fusion milestone presentation

A fusion milestone should be satisfying without pretending the character became a physically larger creature.

Possible milestone rewards:

- stat bump
- weapon accent improvement
- attack gains one additional hit
- projectile gains pierce/split
- impact trail becomes stronger
- passive/signature behavior unlocks

The first fusion tutorial should visually compare the same-size slime before and after the attack improvement.

## 10. Assignment states

An owned type can be:

- in the active battle formation
- dispatched on one contract
- reserve

The same type cannot occupy multiple battle slots and cannot battle while dispatched.

A duplicate waiting to be fused is not an independently assignable body.

## 11. Role interactions

The six branches create understandable differences without hard rock-paper-scissors requirements.

- Sword: reliable frontline damage
- Shield: survival / protection
- Bow: safe physical range
- Wand: area magic / control
- Dagger: mobility / execute
- Gun: sustained or explosive ranged damage

Behavior should be visible first and numerically optimized second.

## 12. Discovery presentation

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

## 13. Balance guardrails

- Fusion strengthens favorites without forcing duplicate bodies onto the field.
- Type level remains a frequent deterministic growth path so duplicate drought does not stop all progress.
- Normal branch discovery is not gated solely by low-probability acquisition.
- Tier 3 specialization is a role choice first, power increase second.
- Mutation does not obsolete the normal tree.
- A favorite type remains usable after new forms are discovered.
