# Art Direction

Status: Current
Date: 2026-09-16

## 1. Visual thesis

The visual identity is:

> **soft, glossy, toy-like slimes carrying equipment that is slightly too large for them.**

The game should feel cute first and combat-capable second. It must not drift into human chibi characters wearing slime hats.

## 2. Character language

All normal slimes share a recognizable body grammar:

- low rounded jelly body
- large face area
- simple eyes readable at small size
- squash/stretch deformation instead of articulated legs
- translucent or glossy jelly highlight
- equipment sits on, floats beside, or is gripped by the body without requiring humanoid arms

A player should still identify the character as a slime even if equipment is hidden.

## 3. Player body-size invariant

For the same slime form, ordinary level and fusion rank **do not change baseline body size**.

This is a product-level visual contract.

Do not communicate fusion strength by:

- increasing root scale
- making each fusion rank physically taller/wider
- adding duplicate bodies around the unit

Communicate strength through:

- weapon finish / weapon silhouette details
- small accessories that do not replace the slime body
- attack count and timing
- projectile/trail/impact language
- VFX intensity within readability limits
- signature behavior unlocks

Promotion to a genuinely different form may alter silhouette and equipment, but should remain in the same broad gameplay-size family unless the form's identity specifically requires otherwise. Boss scale is separate and may be much larger.

## 4. Camera and facing

Runtime characters use a fixed 3/4 view suited to movement from lower-left/lower-center toward upper-right/upper-center.

Production direction:

- friendly default facing: up-field shallow 3/4
- enemy default facing: down-field
- avoid strict side profile
- avoid full top-down circles
- preserve enough face visibility for charm and defeat expressions

Mirroring may be used only when it does not visibly invert asymmetric equipment incorrectly.

## 5. Base slime

Plain Slime baseline:

- aqua-to-sky-blue jelly body
- bright broad highlight
- dark navy eyes rather than pure black where possible
- tiny neutral mouth used sparingly
- no permanent hat or armor

The base must be visually neutral so every job reads as an additive transformation.

## 6. Branch accent language

Job identity uses silhouette first, accent color second.

| Branch | Primary silhouette cue | Accent tendency | Motion identity |
|---|---|---|---|
| Sword | blade / scarf / headband | warm red | forward squash + slash |
| Shield | oversized shield / helm | cream + gold | planted squash, recoil absorption |
| Bow | bow arc / hood | leaf green | backward tension then snap |
| Wand | hat / floating rune | violet / blue | levitation + pulse |
| Dagger | hood / twin blades / scarf | dark indigo | quick lateral squash / vanish |
| Gun | barrel / goggles / cannon | amber / steel | recoil wobble / smoke puff |

Tier/form differences must remain readable at gameplay scale without relying on labels.

## 7. Fusion visual language

Fusion strengthens one canonical slime branch. A milestone may replace the weapon/form presentation, but it does not create a larger slime body or a separate population body.

Suggested progression vocabulary:

- first Sword milestone: two Sword Slimes merge into a same-body-size Greatsword Slime with a much broader blade
- low rank: base weapon and restrained hit effect
- mid rank: weapon accent, slightly richer trail/impact, extra attack beat where unlocked
- high rank: signature attack behavior and recognizable VFX motif

The visual comparison should work even if screenshots are normalized to exactly the same character body dimensions.

Avoid stacking many tiny ornaments simply to show rank; one clear behavior change is better than decorative noise.

## 8. Rare mutation identity

Rare mutations can intentionally break one normal visual rule, but must remain recognizable as slimes.

### King Slime

- crown motif and royal particles
- commanding bounce / aura
- do not rely on simple global size increase as the primary distinction

### Golden Slime

- metallic honey-gold jelly
- coin-like sparkles
- distinct specular/highlight treatment

### Dragon Slime

- tiny horns, winglets and tail integrated into jelly silhouette
- breath builds inside translucent body
- remains round and cute rather than becoming a baby dragon model

### Prism Slime

- transparent body with shifting internal bands
- crystalline edge motifs
- elemental VFX cycle

### Mimic Slime

- treasure-chest motif integrated into upper body
- playful tongue/teeth
- briefly imitates weapon motifs

## 9. Enemy direction

Enemies should belong to the same bright world but be visually distinct from friendly glossy slimes.

Readable hierarchy:

- fodder: simple rounded silhouettes
- elite: one exaggerated feature
- boss: much larger body, strong silhouette, a few readable tells

Do not make every enemy visually noisy. Active slimes must remain the focus.

## 10. Environment direction

Environments are bright illustrated fantasy dioramas with shallow depth.

Each area should be built from:

- one main ground treatment
- one distant backdrop layer
- reusable prop families
- contact/shadow treatment
- optional ambient particles

The environment scrolls between waves. It should not require a unique painted scene per stage.

Area palette identities:

1. Clover Road — spring green, cream dirt, blue sky
2. Mushroom Forest — teal green, coral/orange fungi, soft purple shadows
3. Amber Mine — ochre stone, amber crystals, dark blue recesses
4. Sunken Marsh — moss green, turquoise water, ruined gray stone
5. Frost Ruins — pale cyan, snow white, desaturated navy ruins
6. Ember Canyon — warm red/brown, orange lava, smoky violet distance
7. Moonlit Castle — midnight blue, silver stone, warm window lights
8. Dragon Crater — charcoal rock, magenta/blue night sky, controlled lava accents

## 11. VFX philosophy

VFX communicate job identity, fusion growth, and reward escalation.

### Routine attacks

- compact hit sparks
- short trails
- small smoke/puff
- avoid full-screen bloom

### Fusion milestones

- increase clarity/character, not just particle count
- extra slash/projectile is preferred over generic larger glow
- preserve target visibility

### Tier 3 / signature skills

- distinct shape language by branch
- strong but bounded area
- readable anticipation before major impact

### Legendary/Mythic

Weapon effects may override projectile/trail/impact language. Mythic signatures should be recognizable in screenshots and short clips.

## 12. Animation set

Minimum runtime vocabulary for a normal active slime:

- Idle
- Move/bounce
- Basic attack
- Hit
- Defeat: flatten + `×` eyes
- Skill where applicable
- Celebrate/march transition
- Evolution reveal
- Fusion pulse / upgraded-attack preview

Frame counts or implementation method are production choices. Procedural squash/stretch is acceptable and currently preferred where it keeps motion soft.

## 13. Asset construction strategy

Use a hybrid approach.

### Reusable base

- body shading/highlight framework
- eyes/mouth set
- squash/stretch timing
- contact shadow
- defeat expression

### Modular where safe

Tier 1 and some Tier 2 equipment can layer onto shared bodies to control asset volume.

### Bespoke where identity matters

Tier 3 and mutations may receive bespoke silhouette/animation accents, but should not be forced into humanoid anatomy.

## 14. Runtime size / source size

Characters are authored for small-mobile readability.

Recommended logical on-screen body height remains roughly 40–72 CSS px depending camera depth/device. Exact size is validated in the real portrait scene.

Do not reduce runtime character size solely to fit many friendly bodies; the current design intentionally caps the active party instead.

## 15. UI visual language

UI complements the soft toy aesthetic without becoming ornate fantasy parchment.

- rounded but restrained panels
- translucent/opaque cream or cool dark overlays depending contrast
- strong icons with minimal line detail
- rarity represented by frame/icon/glow, not color alone
- clean modern typography

Avoid dense medieval frames, leather textures, faux-metal borders, or tiny serif text.

## 16. Reward animation hierarchy

| Event | Target intensity |
|---|---|
| coin / small reward | tiny pop, no pause |
| common chest | quick bounce/open |
| slime duplicate | compact fusion-progress result |
| fusion milestone | short pulse + improved attack preview |
| new normal weapon | compact card + weapon spin |
| new job | 1.5–2.5s jelly evolution reveal |
| Tier 3 | stronger silhouette + signature demo |
| Legendary | short field dim + weapon reveal |
| Mythic | highest weapon reveal + signature VFX |
| mutation | unique transformation + codex stamp |

Repeated rewards collapse to faster variants after first viewing.

## 17. Initial asset target

For the first production-quality vertical slice, prioritize:

- Plain Slime
- Sword progression sample
- Bow progression sample
- one additional contrasting branch
- one fusion visual milestone for Sword
- one rare mutation
- Clover Road environment
- Great Mushroom boss + simple fodder enemies
- chest set
- two high-rarity weapon effects

This slice is sufficient to validate job silhouette, same-size fusion progression, combat readability, reward escalation, and environment fit before producing the full content horizon.

## 18. Art acceptance

Before bulk production, rendered tests must confirm:

- Plain / promoted forms can be told apart at gameplay scale
- up to six active friendly slimes remain individually readable
- low/high fusion ranks of the same form use the same baseline body size
- stronger fusion rank is still visually noticeable through attacks/equipment/VFX
- defeat flattening and `×` eyes remain readable in a crowded contact moment
- attack effects identify their source without VFX washout
- rare mutation feels special without violating slime identity
- background supports character contrast
