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
6. **1x framing** — 520px Galleryの実camera projectionで面積3%以上、長辺19%以上、各軸78%以下。pixel色差ではなくThree.js投影boundsを使う
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

## Area 5 — Frost Ruins contracts

Area 5の新要素は **slide / inertia / bounded glow**。氷パーツを増やして豪華にするのではなく、少数の大きなhookと慣性差でArea 4より強い動きを作る。

| Character | First read | Geometry hard gate | Motion hard gate |
| --- | --- | --- | --- |
| **ゆきころ** `snow-roller` | 一個の雪玉 + 頭上ではなく斜め背面に一個だけ付く小さな氷nub | x/z 1.05–1.25、SnowBody幅85–98%、IceNub高18–30%、9–12 meshes、複数spike禁止 | settle → roll windup → fast bump → snow overshoot → nub lag。Attack 0.78–0.92s |
| **こおりムシ** `ice-bug` | 低いdumpling body + 背中の**太い氷棘ちょうど3本** | x/z 1.40–1.75、IceSpike_1..3必須、中央棘高=全高34–48%、11–14 meshes、IceSpike_4以降禁止 | 3 spikes lean back → still hold → forward snap → ice shard 1発 → spike recoil。Attack 0.90–1.05s |
| **マフラー雪だるま** `scarf-snowman` | 一個の丸い雪body + 横へ大きく張り出す短いscarf | x/z 1.55–1.80、SnowBody一体、SnowBody幅=全幅55–68%、ScarfTail幅=全幅42–60%、10–13 meshes、二段snowball / humanoid arm禁止 | scarf back-sweep → body dash → contact → scarf overshoot → soft settle。Attack 0.82–0.98s |
| **つららランタン** `icicle-lantern` | 足のない縦長lantern/drop + 下端の一個のicicle point + 内部light core | z/x 1.35–1.70、LanternBody高75–92%、LightCore高18–30%、9–12 meshes、feet禁止 | hover compress → core grows cyan → pale ice flash → thin ice ray → recoil/flicker。Attack 0.98–1.14s |
| **雪像の番人** `snow-statue-guardian` | 二段だが人型ではない大雪mass + 横広い一枚crest | x/z 0.90–1.15、全幅≥1.15 / 全高≥1.15、LowerMass幅92–101%、UpperMass幅52–70%、IceCrest幅68–88%、13–17 meshes、Arm/Leg/Hand/Foot禁止 | upper turn → lower delayed follow → full spin → snow pulse / bounded icicle release → crest delayed settle。Attack ≥1.45s / Defeat ≥1.55s |

### Area 5 per-character detail

**ゆきころ**
- one-hook: `IceNub`。雪玉そのものより大きくしない
- `PrimaryRoot` はIceNub専用。bodyと0.05–0.12秒ずれて戻る
- Moveは跳ねず、低いroll + 接地squash
- Hitは一度だけへこみ、すぐ球へ戻る
- Defeatは半rollして横倒し。×目はSnowBodyから離れない
- projectile禁止

**こおりムシ**
- exactly 3 spikes。4本目を装飾として足すことも禁止
- `PrimaryRoot` = SpikeRoot。3本を一群としてlean/recoilさせる
- bodyは低く、目を大きくして虫感を作らない
- projectileは一個のcompact `ice-shard`
- Defeatはbodyが座り、spike groupが外向きへdroop

**マフラー雪だるま**
- 雪だるま記号として二段球にしない。bodyは一個
- `TailRoot` = ScarfRootとしてruntimeのwag channelを使う
- scarfは細長い紐ではなく、幅広い短い布mass
- Attackはbodyよりscarfのanticipationを先に見せる
- Defeatはbodyが下へ沈み、scarfだけ最後に落ちる

**つららランタン**
- 足 / 手 / 杖は禁止。浮遊そのものがidentity
- `InflateRoot` = GlowRoot。内部coreだけが明滅・膨張する
- 外殻は過度に透明にせず、friendly slimeよりmatte
- projectileは細い `ice-ray` 1本。広いbeamは禁止
- Defeatは発光消失 → 回転を止める → 雪面へsoft landing

**雪像の番人**
- 二段massは許可するが腕脚を付けてhumanoid化しない。上下massの間は細いNeckCoreでくびれを作り、巨大な雪玉に見える輪郭は禁止
- `PrimaryRoot` = UpperMassRoot、`SecondaryRoot` = CrestRoot
- 上段が先に回り、下段/全身が遅れて追うことをmotion testで固定
- Boss attackは最低5beat。通常敵のroll/slideを単純拡大しない
- projectile/VFXは一回のsnow pulse + 一個のbounded icicle。連射禁止
- Defeatはupper massが「ぽすっ」と落ち、crestが最後に遅れて倒れる

## Area 6 — Ember Canyon contracts

Area 6の新要素は **elemental after-effect**。火炎particleを増やして強く見せるのではなく、charcoal / stone massに対して一個のcontrolled emissive cueを持たせ、Attack後の遅延反応をArea 5より一段強くする。

| Character | First read | Geometry hard gate | Motion hard gate |
| --- | --- | --- | --- |
| **ひのこヤモリ** `ember-gecko` | 低く横長の丸ヤモリ + 尻尾先端の一個のflame mass | x/z 1.65–2.05、TailRoot必須、FlameTip高20–34%、4 foot pads、12–15 meshes、背中spike禁止 | crouch → flame grow → fast dash → body stop → **tail whip after-stop**。Attack 0.84–1.00s |
| **すみころ** `charcoal-roller` | 一個の炭球 + 表面を横切る太い発光crack 3本 | x/z 0.95–1.12、CharcoalBody幅92–101%、GlowCrack_1..3必須、9–12 meshes、limb禁止 | almost still → crack red → orange → yellow hold → burst bump → glow decay。Attack 1.00–1.18s |
| **ぱちパチムシ** `crackle-bug` | 低い虫body + 背中をほぼ覆う一個の丸いcharge shell | x/z 1.28–1.60、ChargeShell幅72–90%、4 foot pads + 短いantenna 2本、14–15 meshes、6-leg cycle用joint禁止 | shell shake #1 → shake #2 → short still → spark 1発 → shell close/recoil。Attack 1.02–1.20s |
| **マグマガニ** `magma-crab` | 極端に横長のbody + 左右二個の丸いclaw | x/z 2.15–2.75、Claw_L/R必須、各claw幅18–28%、Body幅48–64%、11–14 meshes、細脚禁止 | one-claw weight → body snap opposite → shoulder/claw bump → **opposite claw delayed settle**。Attack 0.94–1.10s |
| **炉心ガメ** `furnace-turtle` | 縦厚の亀mass + 正面中央の一個のfurnace shell/core | z/x 1.05–1.30、全幅≥1.10 / 全高≥1.20、FurnaceShell幅62–80%、Core高18–30%、15–19 meshes | furnace open → red/orange/white 3-step charge → compress → heavy jump/impact → **0.15s delayed ring**。Attack ≥1.60s / Defeat ≥1.65s |

### Area 6 per-character detail

**ひのこヤモリ**
- bodyは細い爬虫類にしない。低いbean mass + 4 short pads
- `TailRoot` がidentity。TailBase + FlameTipを一群としてbodyより0.10–0.18秒遅らせる
- flameは一個のrounded emissive mass。particle plume / multiple flame tongues禁止
- Moveは短いscurry。realistic limb cycleは禁止
- Defeatはflame縮小 → bodyが横へsoft flop。×目はbody追従
- projectile禁止

**すみころ**
- limb / face accessory / crown禁止。炭球一個が主体。輪郭上に一箇所だけ小さな欠けmassを許可し、完全な真円にはしない
- `GlowRoot` にexactly 3 broad crack strips。細い多数線へ増殖しない
- Attackのchargeは色・glowだけでなくbody compressも同期させる
- crack 3段chargeの最後に0.10秒以上still hold
- Defeatは発光が先に冷え、その後ballが短くsettle
- projectile禁止

**ぱちパチムシ**
- `ShellRoot` = ChargeShell。低いbodyとの間は細いShellMountだけで繋ぎ、側面にくびれが読める一個の上側humpにする
- exactly 4 foot pads + short rounded antenna 2本。6本脚アニメーションへ寄せない
- Attack前半はbodyよりshellのdouble shakeを読ませる
- projectileは一個のcompact `ember-spark`。連射禁止
- Defeatはshell close → 一個だけ弱いspark → body collapse

**マグマガニ**
- `PrimaryRoot` = Claw_L、`SecondaryRoot` = Claw_R
- clawsは丸いmass。ハサミ歯 / 細い腕 / realistic crab legs禁止
- bodyを横長にして、claw込みの全幅で他Area 6と明確に分離
- Attackは片側anticipationと逆側snapで方向差を作る
- Defeatはbody low → both claws inward settle
- projectile禁止

**炉心ガメ**
- shellは琥珀ガメの横広甲羅を再利用しない。縦厚bodyに正面furnaceを埋め込む
- `ShellRoot` = FurnaceShell、`GlowRoot` = CoreRoot、`HeadRoot` を独立
- coreは一個。周囲に複数lava gemを足さない
- Attackは最低6beat。impact後のringは必ずbody contactより遅れる
- Secondaryはshell vent → short `furnace-flame` → recoil。広い持続beam禁止
- Defeatはfurnace close → core fade → turtle heavy sit。通常亀のroll defeat禁止

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