# Area 7 — Moonlit Castle

Status: Approved content specification; implementation may be pending
Date: 2026-09-19

## Identity

Biological creatureからtoy-like castle sentryへ切り替える。Armorはrealistic medieval armorではなく、木製玩具 / tin toy / miniature兵士の塊感。

## Roster

### ころ兵

Role: basic melee. Silhouette: helmet occupies ~70% of body height, tiny body below.

- Idle: helmet weight sway
- Move: toy hop
- Attack: short spear pulls back → 0.10s still → fast thrust
- Hit: helmet rotates before body catches it
- Defeat: helmet tips over body, × eyes remain visible

### たて兵

Role: defender. Silhouette: oversized round shield covers most front view.

- Idle: planted shield breathe
- Move: short shield-first hop
- Attack: brace → hold beat → shield bash
- Hit: shield absorbs recoil
- Defeat: shield falls flat, body peeks from behind with × eyes

### ベル魔導兵

Role: caster. Silhouette: bell-shaped floating body.

- Idle: very slow pendulum
- Move: float
- Attack: swing left → swing right → center stop → sound ring
- Hit: bell rings asymmetrically
- Defeat: one weak final swing, settles

### ぜんまいコウモリ

Role: fast ranged/harasser. Silhouette: bat body + one oversized winding key.

- Idle: key rotates slowly
- Move: short flutter
- Attack: complete stop → key reverse-winds → release → burst movement / projectile
- Hit: key spins too far
- Defeat: key stops, wings fold

## Boss — 月冠の騎士

Silhouette: giant helmet + short body + broad cape。Tall humanoid proportionは禁止。

Arrival: slow entrance → cape trails → stop → cape settles → weapon reveal。

Signature motion: low stance → cape almost still → instant dash / near-vanish → stop behind target line → 0.10–0.16s delayed slash line → cape catches up。

Defeat: weapon lowers → cape loses tension → helmet/body sits rather than violent collapse。

## Stage structure

1. ころ兵
2. たて兵
3. ベル魔導兵
4. ぜんまいコウモリ + castle squad
5. 全4種 → 月冠の騎士

## References

- ../../content/enemy-references/images/area07-baby-knight.png

Extract: oversized rounded helmet / toy-like chunky weapon and shield / compact body。Production versionは顔の主張とhumanoid detail densityを抑える。
