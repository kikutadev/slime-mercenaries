# Area 4 — Sunken Marsh

Status: Approved content specification; implementation may be pending
Date: 2026-09-19

## Identity

カエル・芽・水滴・泡。Wet worldだが、敵をリアルな両生類や軟体動物へしない。丸いtoy massを優先。

## Roster

### ぷくガエル

Role: basic melee / jumper. Silhouette: wide round body + tiny feet.

- Idle: very small throat pulse
- Move: squat → hop → belly settle
- Attack: cheeks/body inflate → hold → large hop → pancake landing
- Hit: body dents sideways
- Defeat: one failed hop → belly flop + × eyes

### ぬまメ

Role: ranged sprout. Silhouette: water-drop lower body + two broad leaves.

- Idle: droplet stretch + leaf lag
- Move: elongate → contract sliding
- Attack: leaves close → water gathers → leaves open → water orb
- Hit: leaves fold briefly
- Defeat: droplet flattens, leaves droop

### あわタニシ

Role: sturdy / support. Silhouette: tiny body + oversized translucent bubble shell.

- Idle: shell floats 0.05–0.10s behind body
- Move: body advances, bubble shell catches up
- Attack: shell compresses → bubble pulse / body bump
- Hit: body recovers before shell stops oscillating
- Defeat: bubble softly deflates, body sits down

### すいすいハス

Role: fast harasser. Silhouette: extremely flat horizontal lily-pad body.

- Idle: slight ripple tilt
- Move: smooth water-slide
- Attack: tilt left/right → fast diagonal skim → wake trail
- Hit: leaf edge folds
- Defeat: slow spin, settles flat

## Boss — おおぬまガエル

Boss hook: enormous throat sac, not crown/armor.

Attack: body lowers → throat 1.0x → 1.5x → 2.0x → 0.15s still hold → shockwave release → throat oscillates after body settles。

Secondary attack: large hop + delayed water ring。

Defeat: throat loses tension → one soft backward sit → × eyes。

## Stage structure

1. ぷくガエル
2. ぬまメ追加
3. あわタニシ / ranged-support read
4. すいすいハス + mixed pressure
5. 全4種 → おおぬまガエル

## References

- ../../content/enemy-references/images/area04-round-frog.jpeg

Extract: round low body / tiny limbs / body mass first。Production eye sizeはexternal referenceより大幅に小さくする。
