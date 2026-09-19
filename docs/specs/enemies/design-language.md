# Enemy Design Language

Status: Current
Date: 2026-09-19

## 1. Visual goal

敵は「倒すための障害」である前に、戦場へ出てきた瞬間に見たくなる可愛いキャラクターであること。

可愛さを巨大な目へ依存させない。主役は以下。

- 低重心
- 丸い / 豆型 / 雫型 / 卵型の大きいmass
- 短い手足
- 一体につき一つの大きなシルエットhook
- 動作時のsecondary motion
- 柔らかいsettle

## 2. Face

Normal enemy:

- 目は小さい点目〜小さな楕円を基本とする
- eye visible size target: 全高の6–10%
- hard cap: 12%
- giant glossy anime eyeは禁止
- mouthは必要な敵だけ
- blush / cheekは補助であり主役にしない

Bossも「目を巨大化して格を出す」は禁止する。

## 3. Silhouette

128px grayscale thumbnailで同Area内の敵を1秒以内に識別できること。

色だけで差を作らない。

例:

- crystal bug = 丸いbody + 背中の一個の大きい結晶
- frog = 幅広い球体
- ice bug = 低い団子 + 3本の氷突起
- knight = 巨大兜 + 小さいbody
- baby dragon = 大きな頭 + 小さい翼

同一family内でも縦横比と最大形状を変える。

## 4. Body grammar

Avoid:

- realistic humanoid anatomy
- realistic quadruped gait
- 細長い手足
- 過剰な牙 / 爪 / 棘
- 小さい装飾を大量に追加
- enemy bodyをfriendly slimeと同じglossy jellyへ寄せる

Prefer:

- plush / toy mass
- 角を丸めたlow-poly
- matte / felt / soft-stone material
- large simple shapes
- 3/4 cameraで顔が残る構造

## 5. One-hook rule

通常敵一体につき「最大の視覚hook」を一つに絞る。

例:

- ころクリ = crystal
- つるはしモグ = drill-like nose
- ぷくガエル = throat/body inflation
- あわタニシ = bubble shell
- こおりムシ = back ice spikes
- ひのこヤモリ = flame tail
- たて兵 = oversized round shield
- こつばさ竜 = comically tiny wings

その他の装飾はhookを弱めない範囲に留める。

## 6. Materials

| Area | Material direction |
|---|---|
| Mushroom Forest | matte cap / soft stem |
| Amber Mine | soft rock + one faceted crystal mass |
| Sunken Marsh | matte wet-looking color, but no realistic slime gloss |
| Frost Ruins | soft snow + restrained translucent ice |
| Ember Canyon | charcoal / warm stone + emissive crack accent |
| Moonlit Castle | toy metal / wood / cloth, not realistic PBR armor |
| Dragon Crater | matte hatchling scales / soft stone / bounded star glow |

Friendly slime remains glossier than normal enemies。

## 7. Boss rule

Bossは通常敵を単純に2倍へ拡大しない。

Bossに必要なのは:

- separate silhouette
- stronger anticipation
- dedicated arrival
- at least one attack with delayed secondary impact
- longer readable defeat
- scale increaseは補助でありidentityの主因にしない

## 8. Battle readability

通常敵3–12体を想定する。

- 小さい顔でもrole silhouetteが読める
- ranged enemyは発射originが分かる
- melee telegraphはbody shape changeで読む
- routine enemy VFXはfriendly signature attackより弱い
- boss telegraphをnormal projectileが隠さない

## 9. Per-character production contract
Every production enemy MUST own a character contract before model work is accepted.

- Contract SSOT: `tools/blender/enemies/definitions/<slug>.py::VALIDATION_PROFILE`
- Family-level validation alone is insufficient.
- The contract must define at least silhouette ratio, dominant hook size, mesh budget, required structure, forbidden structure, and any exact parent/secondary-motion roots.
- A character that only passes generic eye/bounds/material checks is still **unfinished**.
- See `character-production-contracts.md` for the current roster.
