# Area 1 — Clover Road

Status: Current content direction; boss candidate not yet hard-locked
Date: 2026-09-19

## Identity

Clover Road is the introductory field area.

The enemy identity is:

- Leaf
- Flower
- Forest Critter
- one separate grassland boss family

Mushroom enemies are reserved for Area 2 Mushroom Forest.

The area should read as bright, soft, low-threat fantasy countryside. Enemy designs teach the game's silhouette and attack-tell language before later areas add denser mechanics.

## Roster

### ちびリーフ `leafling`

Role: basic melee.

Silhouette:
- one broad heart / teardrop leaf
- tiny lower body core
- leaf owns roughly 65–75% of height

Motion hook:
- leaf-tip lag
- light hop
- broad leaf slap

### くるりリーフ `whirl-leaf`

Role: mobile ranged / harasser.

Silhouette:
- two broad leaves arranged as a pinwheel
- wider than leafling
- small center body

Motion hook:
- short wind-up
- one readable partial whirl
- gust release
- never continuous propeller spinning

### つぼみん `bud-bloom`

Role: melee flower.

Silhouette:
- closed vertical bud
- two broad lower leaves
- compact pear / tulip-bud shape

Motion hook:
- bud compression
- spring-like poke
- petal/body settle

### ぽふぽふ花 `puff-flower`

Role: ranged flower.

Silhouette:
- one large round puff / pom-pom head
- very small lower body
- clearly wider and rounder than bud-bloom

Motion hook:
- puff inflation
- short still beat
- compact pollen release
- soft recoil

### まるハリ `round-hedgehog`

Role: sturdy melee.

Silhouette:
- low bean body
- one soft-quill shell mass
- tiny snout and feet

Motion hook:
- soft curl
- short roll
- shell recoil after body impact

### どんぐりリス `acorn-squirrel`

Role: mobile ranged.

Silhouette:
- compact pear body
- oversized crescent / cloud tail
- tiny ears

Motion hook:
- tail counterbalance
- acorn throw
- tail follow-through after release

## Boss candidate — クローバーラム

Proposed content ID: `clover-ram`.

The Area 1 boss belongs to a separate boss-only family. It must not look like a scaled-up Leaf, Flower, Hedgehog, or Squirrel.

### Silhouette

Primary read:

- one very large rounded wool body
- two large curled horns
- very short legs
- small low face
- one restrained four-leaf-clover accent at most

The horns are the strongest silhouette hook. Clover decoration must not become surface noise.

Avoid:

- realistic sheep anatomy
- long thin legs
- detailed fur strands
- huge glossy eyes
- crown / armor used only to communicate boss rank

### Material

- wool: matte plush / soft clumped mass
- horns: smooth toy-like keratin, rounded edges
- hooves: simple soft-dark masses
- friendly slime remains visually glossier

### Arrival

1. appears small at the far end of the road
2. turns toward the party
3. scrapes the ground twice
4. lowers horns
5. fast approach
6. hard stop near boss position
7. wool settles after the body with delayed secondary motion
8. boss HP presentation completes

### Attack A — Wool Charge

Primary first-boss signature.

Rhythm:

1. head lifts
2. horns lower
3. two short ground scrapes
4. readable still hold
5. very fast charge
6. primary impact
7. body stops first
8. horns / wool overshoot and settle

Anticipation must be clearly longer than the charge itself.

Impact VFX stays bounded:
- small dirt burst
- a few leaf / clover motes
- light camera impulse
- no full-screen bloom

### Attack B — Soft Stomp

Secondary attack.

1. body compresses
2. short vertical hop
3. body lands
4. 0.10–0.14s delay
5. low grass / clover shock ring
6. wool settles last

The delayed ground ring establishes the boss motion grammar used by later areas without making the first boss mechanically dense.

### Hit

Hit reaction should propagate through parts instead of moving the whole boss as one rigid object:

impact -> horn/head recoil -> wool wave -> soft body settle.

### Defeat

Defeat should be comic and memorable:

1. final hit
2. stagger
3. tries to brace
4. one horn touches / catches in the ground
5. short attempt to pull free
6. gives up
7. body settles down
8. small × eyes / defeated expression

No body breakage or violent collapse.

## Stage introduction

Area 1 has six normal enemies rather than forcing all families into the first wave.

| Stage | Introduction |
|---|---|
| 1 | ちびリーフ中心。basic melee tellを学習 |
| 2 | くるりリーフ追加。single leaf vs pinwheelを理解 |
| 3 | つぼみん / ぽふぽふ花を段階導入。melee flower vs ranged flower |
| 4 | まるハリ / どんぐりリス導入。Critter silhouetteとroll / throw |
| 5 | Leaf / Flower / Critter mixed gauntlet |
| Boss | クローバーラム |

Exact wave counts are balance data. The authored encounter must avoid showing all six new silhouettes at once before each family has had a readable introduction.

## Acceptance

At portrait gameplay scale:

- all six normal enemies are distinguishable in 128px grayscale
- no normal enemy relies on eye size for cuteness
- Leaf / Flower / Critter body grammars stay visibly separate
- ranged attack source is readable
- boss silhouette is immediately distinct from all six normal enemies
- boss charge has a readable still beat before release
- boss wool / horn secondary motion remains visible at 1x mobile speed
- boss defeat remains cute and readable without becoming a long cutscene

## References

Detailed external-reference notes and local images:
- ../../content/enemy-references/area01-clover-road.md
- ../../content/enemy-next-families-reference-v1.md
