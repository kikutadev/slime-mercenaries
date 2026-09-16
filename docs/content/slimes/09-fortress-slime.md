# Fortress Slime

Status: Planned content brief  
Classification: Shield / Tier 3  
Combat role: pure tank

## 1. Design intent

This file defines the content-specific model and motion direction for **Fortress Slime**. Product-level rules in `docs/specs/art-direction.md`, `docs/specs/combat.md`, and `docs/specs/evolution-roster.md` remain authoritative.

## 2. Model / silhouette

Square pavise and squat stance; extremely stable silhouette while body stays normal gameplay scale.

Common constraints:

- retain the low rounded jelly body and large readable face
- equipment may exaggerate silhouette but must not turn the character humanoid
- ordinary level/fusion progression must not increase baseline slime body scale
- default inspection must work in the actual shallow 3/4 gameplay camera

## 3. Motion specification

### Idle

Almost no vertical bob; broad slow compression instead.

### Move / bounce

Heavy thump locomotion with tiny hops or sliding squash.

### Basic attack

Short shield shove with strong space-control read.

### Skill / signature behavior

Plant pavise, spread body laterally, lock in place for major damage reduction.

### Hit reaction

Directional squash away from impact, brief jelly ripple, then a clean return to the stable combat anchor. Defensive forms may translate less; deliberately mobile skills may override this only during the authored move.

### Defeat

Use the shared defeat language: body drops and spreads into a readable pancake, normal eyes switch to `×` eyes, and oversized equipment settles with delayed weight. The expression must remain visible long enough to read in a crowded contact moment.

### Celebrate / march

Use a short branch-appropriate happy bounce or equipment flourish. It must remain cheaper and shorter than a combat skill and must not accidentally spawn damage/VFX gameplay effects.

## 4. Runtime / VFX rules

- anticipation explains the action, but release/impact remains crisp
- attack source, target and hit geometry remain readable at mobile gameplay size
- VFX stays bounded and must not hide nearby units
- weapon/projectile orientation matches the damaging frame physically
- hit reaction returns to a stable combat anchor unless the behavior intentionally moves the unit
- asymmetric equipment is authored for the actual 3/4 view rather than blindly mirrored

## 5. Gallery acceptance

Before publication, verify at 0.5x, 1x and 2x:

- [ ] Idle
- [ ] Move
- [ ] Basic Attack
- [ ] Skill / signature, when applicable
- [ ] Hit
- [ ] Defeat (`flatten + × eyes`)
- [ ] Celebrate / march
- [ ] Gameplay 3/4 camera silhouette
- [ ] Front-ish inspection view
- [ ] No unacceptable equipment/body clipping on key frames
- [ ] Attack hit shape matches actual gameplay behavior
- [ ] No permanent body-scale growth through fusion rank
- [ ] No runtime console errors

## 6. Implementation note

Intentionally breaks the usual bouncy cadence to communicate immovability.
