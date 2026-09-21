# Enemy Content Specification

Status: Current
Date: 2026-09-21

## Purpose

このディレクトリは、Area 1以降の敵キャラクター構成・シルエット・モーション・ステージ導入順を現在仕様として所有する。

敵の実装詳細（Blender Pythonの内部構造、Three.js実装、数値バランス）はコードを正本とし、ここでは「何を作るか」「何が見た目として識別できる必要があるか」を定義する。

## Implementation status

この仕様はproduction runtimeへ接続済み。Area 1はLeaf / Flower / Critter、Area 2はMushroomとして分離され、Areas 3〜8を含む40 Stageすべてが通常のworld progressionから到達できる。実装上のenemy ID・encounter composition・数値はコードを正本とする。

## Current area direction

| Area | Theme | Primary enemy family direction |
|---|---|---|
| 1. Clover Road | 街道・葉・花・小動物 | Leaf / Flower / Critter。MushroomはArea 2へ寄せる |
| 2. Mushroom Forest | キノコの森 | Mushroom |
| 3. Amber Mine | 琥珀鉱山 | Crystal / burrow / cave critter |
| 4. Sunken Marsh | 沈み沼 | Frog / sprout / water-drop |
| 5. Frost Ruins | 氷霜遺跡 | Snow / ice creature |
| 6. Ember Canyon | 熾火峡谷 | Ember / fire critter |
| 7. Moonlit Castle | 月夜城 | Toy-like castle sentry |
| 8. Dragon Crater | 竜星火口 | Hatchling dragon / star creature |

## Canonical documents

- design-language.md — 全Area共通の可愛さ・形状・顔・素材ルール
- motion-language.md — Idle / Move / Attack / Hit / Defeat とArea進行による演出密度
- area-01-clover-road.md
- area-02-mushroom-forest.md
- area-03-amber-mine.md
- area-04-sunken-marsh.md
- area-05-frost-ruins.md
- area-06-ember-canyon.md
- area-07-moonlit-castle.md
- area-08-dragon-crater.md

External visual references and saved local reference images are indexed from ../../content/enemy-references/README.md.

## Stage introduction template

Area 1以降は原則として5 Stage + Area Bossを1セットとする。

1. Stage 1 — familyの基本近接を単独で読ませる
2. Stage 2 — 機動/耐久など第二の輪郭を追加
3. Stage 3 — 遠距離/特殊攻撃を導入
4. Stage 4 — 4種混成で役割理解を確認
5. Stage 5 — 全種の総力戦 → Area Boss

新AreaのStage 1から4種類を一度に出さない。敵一体ごとの「見た目と動き」を学習させてから混成する。

## Production rule

各敵はモデルだけでは完成扱いにしない。最低限、以下を同じproduction asset / motion sourceで揃える。

- production GLB
- Idle
- Move
- Attack
- Hit
- Defeat
- projectile / signature VFX（該当時）
- Gallery
- actual BattleRuntime
- portrait-mobile battle-camera acceptance
