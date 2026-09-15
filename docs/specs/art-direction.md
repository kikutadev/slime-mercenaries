# Art Direction

Status: Current
Date: 2026-09-15

## 1. Visual thesis

The visual identity is:

> **soft, glossy, toy-like slimes carrying equipment that is slightly too large for them.**

The game should feel cute first and combat-capable second. It must not drift into human chibi characters wearing slime hats.

## 2. Character language

All normal slimes share a recognizable body grammar:

- low rounded jelly body
- large face area
- simple eyes readable at small size
- small squash/stretch deformation instead of articulated legs
- translucent or glossy jelly highlight
- equipment sits on, floats beside, or is gripped by the body without requiring humanoid arms

A player should still identify the character as a slime even if equipment is hidden.

## 3. Camera and facing

Runtime characters use a fixed 3/4 view suited to movement from lower-left/lower-center toward upper-right/upper-center.

Production sprite direction:

- friendly default facing: up-right / away from viewer at shallow 3/4
- enemy default facing: down-left
- avoid strict side profile
- avoid full top-down circles
- preserve enough face visibility for charm

Mirroring may be used only when it does not invert asymmetric equipment or readable handedness in a visibly wrong way.

## 4. Base slime

Plain Slime baseline:

- aqua-to-sky-blue jelly body
- bright broad highlight
- dark navy eyes rather than pure black where possible
- tiny neutral mouth used sparingly
- no permanent hat or armor
- small tan satchel is allowed only when needed to imply "recruit"

The base must be visually neutral so every job reads as an additive transformation.

## 5. Branch accent language

Job identity must use silhouette first, accent color second.

| Branch | Primary silhouette cue | Accent tendency | Motion identity |
|---|---|---|---|
| Sword | blade / scarf / headband | warm red | forward squash + slash |
| Shield | oversized shield / helm | cream + gold | planted squash, recoil absorption |
| Bow | bow arc / hood | leaf green | backward tension then snap |
| Wand | hat / floating rune | violet / blue | levitation + pulse |
| Dagger | hood / twin blades / scarf | dark indigo | quick lateral squash / vanish |
| Gun | barrel / goggles / cannon | amber / steel | recoil wobble / smoke puff |

Tier 3 should be identifiable from silhouette at battle scale without relying on labels.

## 6. Rare mutation identity

Rare mutations intentionally break one normal rule each.

### King Slime

- slightly taller crown-shaped top
- small floating crown rather than humanoid king costume
- royal purple/gold particles
- commanding bounce with aura ring

### Golden Slime

- metallic honey-gold jelly
- coin-like sparkles
- avoid looking like a flat yellow recolor by changing specular/highlight treatment

### Dragon Slime

- tiny horns, winglets and tail integrated into jelly silhouette
- breath builds inside translucent body before release
- remains round and cute rather than becoming a baby dragon model

### Prism Slime

- transparent body with shifting internal color bands
- crystalline star facets around edge
- VFX cycles fire/frost/lightning while body silhouette remains simple

### Mimic Slime

- treasure-chest lid motif grows from upper body
- tongue/teeth are playful rather than horror-gore
- attack briefly imitates weapon motifs from recent loot

## 7. Enemy direction

Enemies should be cute enough to belong in the same world but less glossy and less toy-like than player slimes.

Readable hierarchy:

- fodder: simple rounded silhouettes
- elite: one exaggerated feature
- boss: much larger body, strong silhouette, 2–3 readable attack tells

Do not make every enemy visually noisy. The slime army must remain the star.

## 8. Environment direction

Environments are bright illustrated fantasy dioramas with shallow depth.

Each area should be built from:

- one main ground treatment
- one distant backdrop layer
- 4–8 reusable prop families
- small foreground shadow/contact treatment
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

## 9. VFX philosophy

VFX communicate job identity and reward escalation.

### Routine attacks

- compact hit sparks
- short trails
- small smoke/puff
- avoid full-screen bloom

### Tier 3 skills

- distinct shape language by branch
- strong but bounded area
- readable 0.2–0.5s anticipation before major impact

### Jelly Rush

- unified jelly ripple through all friendly units at activation
- short saturation/energy lift
- simultaneous signature skills staggered by tens/hundreds of milliseconds to remain readable

### Legendary/Mythic

Weapon effects may override projectile/trail/impact language. Mythic signatures should be recognizable in screenshots and short clips.

## 10. Animation set

Minimum runtime animation vocabulary for a normal type:

- Idle: 4–6 key poses / loop
- Move/bounce: 6–8
- Basic attack: 6–10
- Hit: 2–4
- Defeat/thin-out: 4–6
- Skill: 8–14 where applicable
- Celebrate/march transition: 4–6 reusable
- Evolution: handled as a shared effect plus type-specific reveal pose

Frame counts are production guidance, not a requirement for literal frame-by-frame pixel art. Bone/deform or procedural squash may implement the same timing.

## 11. Asset construction strategy

Use a hybrid approach.

### Reusable base

- body shading/highlight framework
- eyes/mouth set
- common squash/stretch timing
- contact shadow

### Modular where safe

Tier 1 and some Tier 2 equipment can layer onto shared bodies to control asset volume.

### Bespoke where identity matters

Tier 3 and all five mutations should receive bespoke silhouettes/animation accents. Do not force them into modular paper-doll constraints if that makes final forms visually weak.

## 12. Runtime size / source size

Characters should be authored with small-mobile readability as the target, not illustration detail.

Recommended production baseline:

- logical on-screen body height: roughly 40–72 CSS px depending camera depth/device
- source art: at least 4x intended logical size for clean raster downscaling where raster sprites are used
- transparent padding must be standardized per animation family to avoid visual jitter

Exact atlas sizing is an implementation decision after rendering tests.

## 13. UI visual language

UI should complement the soft toy aesthetic without becoming a fantasy parchment RPG.

- rounded but not excessively pill-shaped panels
- translucent/opaque cream or cool dark overlays depending battlefield contrast
- strong icons with minimal line detail
- rarity represented by frame/icon/glow, not color alone
- typography clean and modern; character art supplies most of the personality

Avoid ornate medieval frames, dense leather textures, faux-metal HUD borders, or tiny serif text.

## 14. Reward animation hierarchy

| Event | Target intensity |
|---|---|
| coin / small Gel | tiny pop, no pause |
| common chest | quick bounce/open |
| new normal weapon | compact card + weapon spin |
| new job | 1.5–2.5s jelly evolution reveal |
| Tier 3 | stronger silhouette cut + signature attack demo |
| Legendary | short field dim + weapon reveal |
| Mythic | highest weapon reveal, signature VFX, immediate equip affordance |
| mutation | 3–4s unique transformation and codex stamp |

Repeated rewards should collapse to faster variants after the first viewing.

## 15. Initial asset target

For first production-quality vertical slice, prioritize:

- Plain Slime
- Sword -> Fighter -> Blademaster/Berserker
- Bow -> Ranger -> Sniper/Storm Archer
- one rare mutation, preferably Golden or Dragon
- Clover Road environment
- Great Mushroom boss + 2 fodder enemies
- Wood/Silver/Gold/Rainbow chest set
- 2 Mythic weapon effects from different families
- Jelly Rush shared effect

This slice is sufficient to validate silhouette progression, army density, projectile readability, reward escalation, and environment fit before producing all 30 types.

## 16. Image-generation reference brief

When generating concept/reference sheets for a slime type, use the following structure rather than asking for an in-game screenshot first:

```text
Japanese mobile fantasy game character design reference sheet.
Blank warm off-white background.
One dominant full-body 3/4 game-facing view, plus two smaller expression/action studies.
Cute glossy jelly slime; remains a true slime, not humanoid.
Oversized readable job equipment; strong silhouette at small mobile size.
Soft candy-like rendering, clean edges, restrained detail, no environment, no UI, no text.
Show how the body squashes/stretches around the weapon and how the signature attack reads.
```

Add each type’s silhouette cue and branch accent from this specification. Generated art is reference until explicitly approved as production asset.

## 17. Art acceptance

Before bulk production, rendered tests must confirm:

- Plain, Tier 1, Tier 2, Tier 3 silhouettes can be told apart at gameplay scale
- six branches remain readable when mixed in one army
- 20–30 units do not merge into an indistinct color mass
- attack effects identify source branch
- rare mutation feels special without violating slime identity
- background supports character contrast and does not compete with reward VFX
