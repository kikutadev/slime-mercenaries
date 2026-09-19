# Enemy Character Production Contracts

Status: Current
Updated: 2026-09-20

## Purpose

敵はfamily単位で「だいたい可愛い」「一通り動く」では完成扱いにしない。

**1キャラ = 1仕様 = 1自動ゲート = 1実画面QA** を必須とする。

数値の正本は各 `tools/blender/enemies/definitions/<slug>.py` の `VALIDATION_PROFILE`。
モーション要件の正本は `src/game/enemy-motion/*.test.ts`。
この文書はプレイヤーから見た「何が読めればそのキャラなのか」を記録する。

## Completion gate

各キャラは次をすべて満たすまで未完了。

1. **First read** — 1秒以内に固有hookが読める
2. **Geometry** — 比率 / mesh数 / 必須node / 禁止node / parent構造 / hook寸法を固有contractで通す
3. **Face** — 通常目は全高12%以下、左右対称、3/4 gameplay cameraで読める
4. **Motion** — Idle / Move / Attack / Hit / Defeatを持ち、Attackは固有のanticipation → release/contact → secondary reactionを持つ
5. **Defeat** — ×目 + 固有のcomic collapse。顔・目だけが本体から分離しない
6. **1x framing** — 520px Galleryで通常敵の占有率を横48%以上 / 高30%以上、過大表示は82%以下
7. **Timed visual QA** — model load後に固有attack beat / defeat beatで撮影し、Idle / Attack / Defeatの3状態が実際に別frameになる
8. **Build gate** — GLB validator / character motion tests / typecheck / production buildを通す

Bossは通常敵の拡大版を禁止し、輪郭・attack rhythm・defeat durationを別設計する。

## Current character contracts

| Character | First read | Geometry hard gate | Motion hard gate |
| --- | --- | --- | --- |
| **ちびキノコ** `tiny-mushroom` | 一枚のbutton cap + 小さいbean body | x/z 1.00–1.18、Cap全幅95–102%、Stem 52–66%、14–16 meshes、puff/spore/boss装飾禁止 | quick cap dip → bump → cap rebound。attack ≤0.55s |
| **ぷくキノコ** `plump-mushroom` | 横広dumpling + 3mass cloud cap | x/z 1.18–1.35、side body lobes必須、18–20 meshes | ちびより深いcrouch、遅く重いcontact、cap rebound。attack ≥0.70s |
| **ほうしキノコ** `spore-mushroom` | 縦長lantern cap + 左右spore pouch | z/x 1.00–1.10、CapRim全幅92–102%、paired pouches必須、17–19 meshes | cap inflate → spore 1発 → recoil |
| **オオキノコ** `great-mushroom` | 巨大layered reishi cap + 小さな子キノコ | x/z 1.24–1.38、全幅≥2.0、PrimaryRoot + SecondaryRoot、22–25 meshes | hold → slam → **upper shelf delayed reaction** → recovery。attack ≥1.20s / defeat ≥1.35s |
| **ちびリーフ** `leafling` | 一枚の大きな葉 | x/z 1.05–1.28、Leaf全幅95–102%、secondary leaf禁止、9–11 meshes | one-leaf windback → slap → return。projectileなし |
| **くるりリーフ** `whirl-leaf` | 2枚のpinwheel leaf | x/z 1.00–1.22、2枚ともdominant、LeafVein禁止、9–11 meshes | 2葉counter-bend → full twist → gust 1発 |
| **つぼみん** `bud-bloom` | 閉じた縦長bud | z/x 1.08–1.20、BudCore + 4 petals、14–16 meshes | petals close/compress → head poke → recover |
| **ぽふぽふ花** `puff-flower` | 6lobeの丸いpuff head | x/z 0.80–0.92、Puff_1..6必須、bud構造禁止、16–18 meshes | puff inflate → pollen 1発 → recoil |
| **まるハリ** `round-hedgehog` | 4lobe soft-quill shell + 小さい顔 | x/z 1.08–1.22、ShellRoot + QuillLobe_1..4、tail禁止、16–18 meshes | curl → roll → uncurl。projectileなし |
| **どんぐりリス** `acorn-squirrel` | pear body + 巨大3lobe tail | x/z 0.92–1.08、全高≥1.05、TailLobe_1..3必須、15–17 meshes | tail windup → acorn 1発 → tail recoil |
| **ころクリ** `crystal-beetle` | 低い虫bodyより先に一個の背中結晶 | x/z 1.05–1.35、BackCrystal高50–72%、4 feet、13–16 meshes | crouch → crystal lean → tackle → delayed crystal rebound |
| **つるはしモグ** `drill-nose-mole` | 丸いモグラ + 短い鉱石鼻 | x/z 1.25–1.55、Muzzle 42–60%、held weapon禁止、13–16 meshes | visible dive → underground travel → fast pop |
| **きらコウモリ** `crystal-bat` | 横長のscallop bat-wing | x/z 1.65–2.15、専用one-piece wings、旧lower ellipse wing禁止、13–16 meshes | wing close → charge → crystal ring 1発 → recoil |
| **ゴロゴーレム** `pebble-golem` | 人型ではなく3つの丸石 | x/z 1.35–1.60、3rock mass、Arm/Leg/Hand/Foot禁止、9–10 meshes | gather → still hold → heavy burst → rock separation settle |
| **琥珀ガメ** `amber-turtle` | 頭より巨大な琥珀甲羅 | x/z 1.35–1.60、AmberShell幅82–98%、FaceRoot→HeadRoot、17–20 meshes | retract → hold → roll → impact → delayed wobble。attack ≥1.20s / defeat ≥1.35s |
| **ぷくガエル** `puff-frog` | 横広い低いfrog + throat sac | x/z 1.65–2.00、ThroatSac幅42–58%、13–16 meshes | throat tell → hold → hop → pancake impact |
| **ぬまメ** `marsh-sprout` | 一体成形water-drop seed + 大葉2枚 | z/x 0.85–1.08、DropBody一体、stacked spheres禁止、11–14 meshes | leaves close → body gather → water orb 1発 → reopen |
| **あわタニシ** `bubble-snail` | 小さい本体より巨大なbubble shell | x/z 1.00–1.20、BubbleShell幅90–102%、2 antenna、15–18 meshes | body compress → shell pulse → release → late shell settle |
| **すいすいハス** `skimming-lily` | 極薄の生きたnotched lily pad | x/z 4.4–5.6、LilyPad幅95–101%、FaceRoot→PrimaryRoot、6–7 meshes | left tilt → right tilt → flat skim → trailing wake。縦jump最小 |
| **おおぬまガエル** `great-marsh-frog` | 縦二段body + 垂れ下がる二段喉袋 | x/z 1.20–1.45、全幅≥1.20 / 高≥0.90、17–20 meshes | 3-stage throat inflation → still hold → release → delayed wobble。attack ≥1.35s / defeat ≥1.45s |

## Executable sources

- Geometry contract: `tools/blender/enemies/definitions/*.py`
- Geometry enforcement: `tools/blender/enemies/validation_profiles.py`, `tools/blender/enemies/validate.py`
- Motion contract: `src/game/enemy-motion/*.test.ts`
- Shared runtime rig: `src/game/enemy-motion/rig.ts`
- Timed visual capture: `tools/qa/capture-enemy-character-contracts.cjs`
- Timed frame verification: `tools/qa/verify_enemy_character_frames.py`

## Visual QA procedure

1. production buildを作る
2. `vite preview --host 127.0.0.1 --port 4183`
3. `node tools/qa/capture-enemy-character-contracts.cjs`
4. `python3 tools/qa/verify_enemy_character_frames.py`
5. 生成された60枚を、キャラ単位で Idle / Attack / Defeat の順にレビューする

Capture toolは単なる一定時間後スクショではない。GLBのload完了を待ち、Replayで時計をゼロへ戻し、そのキャラの固有contractで指定したattack/defeat beatまで待って撮影する。

## Rule for new characters

Area 5以降は、実装より先に次を定義する。

- first read
- silhouette ratio
- one dominant hook
- required / forbidden structure
- hook-to-body ratio
- mesh budget
- exact parent / secondary-motion roots
- Idle / Move / Attack / Hit / Defeat rhythm
- projectile rule
- boss-only escalation if applicable
- timed Gallery inspection frame

**contractなしでBlender実装へ入ることを禁止する。**
