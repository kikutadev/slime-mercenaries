# Area 2 — Mushroom Forest

Status: Approved content specification; implementation may be pending

## Identity

クローバー街道ではなく、Mushroom familyの本格登場Areaとする。

既存production Mushroom rosterをここへ寄せる。

- ちびキノコ / tiny-mushroom
- ぷくキノコ / plump-mushroom
- ほうしキノコ / spore-mushroom
- オオキノコ / great-mushroom

Area 1の将来的な敵構成はLeaf / Flower / Critter中心とし、MushroomをArea 2のidentityとして明確化する。

Visual baselineは既存の docs/content/enemy-mushroom-reference-v2.md を継承する。

## Stage structure

| Stage | Introduction |
|---|---|
| 1 | ちびキノコのみ。bounce / bumpを学習 |
| 2 | ぷくキノコ追加。重いanticipationとの差を見せる |
| 3 | ほうしキノコ追加。spore ranged pressure |
| 4 | Tiny / Plump / Spore混成 |
| 5 | Mushroom総力戦 → オオキノコ |

## Motion roster

### ちびキノコ

- Silhouette: low button cap + bean body
- Idle: cap breathing + tiny side sway
- Move: two-step bounce
- Attack: squash back → fast bump → cap after-wobble
- Hit: cap tilts then returns
- Defeat: stem/body collapses, cap droops, small × eyes

### ぷくキノコ

- Silhouette: very wide dumpling + low thick cap
- Idle: slow heavy breathing
- Move: short low bounce
- Attack: long compression → whole-body shove → slow elastic settle
- Hit: body barely moves, cap wobbles
- Defeat: air-leak style soft flatten

### ほうしキノコ

- Silhouette: tall bell/lantern + paired spore bulbs
- Idle: cap/pouch alternate breathing
- Move: light vertical hop
- Attack: pouch/cap inflate → 0.10s hold → spore release → recoil
- Hit: narrow body bends
- Defeat: harmless tiny spore puff + topple

## Boss — オオキノコ

Boss identityはTinyの単純拡大ではなく、layered shelf / reishi crownを主役にする。

Arrival: distant heavy bounce → ground squash → delayed cap settle → boss HP reveal。

Attack: large compression → readable hold → heavy body release → primary impact → delayed cap/body aftershock。

Defeat: large wobble → cap falls forward → body settles → small spores。face remains readable。

## References

- ../../content/enemy-references/images/area02-mushroom-plush.jpg
- ../../content/enemy-mushroom-reference-v2.md
