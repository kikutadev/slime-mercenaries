# Plain Slime — Rive Spike

Status: prototype  
Date: 2026-09-17

## Goal

Validate whether Slime Mercenaries can use a Rive-authored 2D slime baseline without replacing the existing Blender / Three.js production path yet.

This spike intentionally focuses on **cute body language first**:

- low rounded jelly silhouette
- large navy eyes
- small mouth
- soft blush
- broad asymmetric highlight
- squash / stretch instead of limbs
- face and highlight secondary motion
- shared defeat language: flatten + `×` eyes

## Files

- `public/rive/plain-slime.svg` — grouped vector source intended for Rive SVG import
- `public/rive/plain-slime-preview.html` — dependency-free timing/motion reference

Run the existing Vite dev server and open:

```text
/rive/plain-slime-preview.html
```

The preview is **not** the final Rive runtime. It exists so the shape and motion can be accepted before spending time wiring the same timing into a `.riv` State Machine.

## Stable layer IDs

Keep these IDs stable when importing/rebuilding in Rive:

```text
SlimeRoot
├─ Shadow
└─ BodyRoot
   ├─ Body
   ├─ BodyLowerTone
   ├─ BodyRim
   ├─ HighlightRoot
   │  ├─ HighlightLarge
   │  └─ HighlightSmall
   └─ FaceRoot
      ├─ NormalEyes
      │  ├─ EyeLeftRoot
      │  └─ EyeRightRoot
      ├─ DefeatEyes
      ├─ BlushLeft
      ├─ BlushRight
      └─ Mouth
```

## Proposed Rive controls

### Inputs

- `motion`: number/enum-like value
  - `0` idle
  - `1` move
  - `2` attack
  - `3` hit
  - `4` celebrate
  - `5` defeat
- `moveSpeed`: number `0...1`
- `facing`: number `-1...1`
- `isDead`: boolean

For the first spike, a simple State Machine with named states is preferable to over-engineering a data model.

## Motion timing reference

### Idle

Loop: about `2.6s`.

- body breathes only ~1–2%; no obvious pulsating balloon effect
- body sways slightly
- face follows with a little more lateral travel
- highlight counter-drifts slightly so it feels attached to a soft volume rather than the screen
- shadow changes only subtly

### Move / Bounce

Loop: about `0.82s`.

1. anticipation squash
2. fast stretch and lift
3. airborne compression release
4. landing squash
5. short elastic recovery

The face follows less than the body so the motion reads as jelly mass rather than one rigid SVG group.

### Body Bump

Active motion: about `0.8s`, then idle hold inside a `1.4s` preview loop.

1. backward anticipation
2. crisp forward release
3. front-side compression at contact
4. recoil
5. settle

A future gameplay Rive clip should emit the damage event at the contact beat, not from a fixed timeout in the game layer.

### Hit

Active motion: about `0.45s`.

- short directional compression away from impact
- one overshoot in the opposite direction
- immediate return to combat anchor

### Celebrate

Loop: about `1.3s`.

- deeper anticipation than Move
- one high happy hop
- small alternating tilt
- clean landing, no combat VFX

### Defeat

One shot: about `1.25s`.

1. tiny startled lift
2. body drops and spreads
3. eyes cross-fade to `×`
4. mouth/blush disappear
5. pancake body settles with one restrained overshoot

Do not instantly hide the defeated slime; the final pose needs enough hold time to remain readable in a crowded battle.

## Intended Rive hierarchy

The SVG is deliberately simple enough to import as vector shapes, but the final Rive file should use transform groups/handles approximately as follows:

```text
SlimeRoot
├─ Shadow
└─ BodyRoot             # primary squash/stretch and translation
   ├─ body shapes
   ├─ HighlightRoot     # secondary counter-drift
   └─ FaceRoot          # delayed secondary motion
      ├─ eyes
      ├─ defeat eyes
      ├─ blush
      └─ mouth
```

A full bone mesh is unnecessary for the first Plain Slime. If Rive deformation is added later, use it only where transform squash/stretch cannot keep the lower body planted cleanly.

## Acceptance before creating the final `.riv`

- silhouette reads as cute at ~48–72 CSS px body height
- eyes remain readable at small size
- Idle is alive but not distracting
- Bounce feels soft, not like a rigid ball
- Body Bump has a noticeably crisp impact beat
- Defeat clearly reads `flatten + × eyes`
- no human-like arms/legs are introduced
- the character still reads as neutral Plain Slime before adding job equipment

## Current tooling limitation

No Rive desktop application or Rive authoring CLI is installed in the current Mac environment. Rive runtime libraries are also not yet dependencies of this project. Therefore this spike stops at a Rive-ready SVG + exact motion reference rather than pretending to generate a valid `.riv` file headlessly.

The next step is either:

1. import `plain-slime.svg` into the Rive web/desktop editor and reproduce these six motions in a State Machine, then export the `.riv`, or
2. connect an available Rive authoring workflow first, then automate runtime integration after the `.riv` exists.
