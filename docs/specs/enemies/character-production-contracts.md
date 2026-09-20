# Enemy Character Production Contracts

Status: Current
Updated: 2026-09-21

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
| **ちびリーフ** `leafling` | 中央notchのある一枚heart leaf + tiny core | x/z 1.05–1.28、Leaf全幅95–102%、Core全幅38–50%、2枚目のleaf禁止、主葉tipはSecondaryRoot配下、9–11 meshes | one-leaf windback → tip lag → slap → return。projectileなし |
| **くるりリーフ** `whirl-leaf` | 左右へ開く2枚のpinwheel leaf | x/z 1.00–1.22、各bladeが全幅のおよそ60–78%、LeafVein禁止、9–11 meshes | 2葉counter-bend → full twist → gust 1発 |
| **つぼみん** `bud-bloom` | 槍型に細長い閉じたbud | z/x 1.65–1.90、BudCore + 4 tapered petals、細い下半身、14–16 meshes | petals close/compress → head poke → recover |
| **ぽふぽふ花** `puff-flower` | 外周が読める6lobeの丸いpuff head | x/z 0.80–0.92、Puff_1..6必須、各lobeは全幅28–38%程度、bud構造禁止、16–18 meshes | puff inflate → pollen 1発 → recoil |
| **まるハリ** `round-hedgehog` | 幅の主役が4山soft-quill shell + 小さいbean body/顔 | x/z 1.08–1.22、ShellRoot + QuillLobe_1..4、各主lobe全幅30–42%、tail禁止、16–18 meshes | curl → roll → uncurl。projectileなし |
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

## Area 7 — Moonlit Castle contracts

Area 7の新要素は **stop → burst と装備の慣性差**。装飾量で強く見せるのではなく、玩具のような大きい一個の装備massと「止まってから一気に動く」リズムを主役にする。現実的な甲冑人体・細い手足・多数の装飾は使わない。

| Character | First read | Geometry hard gate | Motion hard gate |
| --- | --- | --- | --- |
| **ころ兵** `round-sentry` | 全高の大半を占める丸helmet + tiny body + 一個の短槍 | z/x 1.05–1.35、Helmet高58–72%、Body高24–38%、SpearTip必須、13–16 meshes、shield/cape/wing禁止 | spear pullback → **0.10s以上still** → fast thrust → helmet delayed catch-up。Attack 0.92–1.08s |
| **たて兵** `shield-sentry` | 前面のほとんどを覆う一枚のround shield + 上から覗く小さいhelmet | x/z 1.10–1.42、RoundShield幅94–101%、Body幅32–50%、13–16 meshes、spear/cape禁止 | plant → shield brace → still hold → short bash → shield rebound。Attack 1.00–1.18s |
| **ベル魔導兵** `bell-mage` | 足のない縦長bell body + 一個のclapper | z/x 1.28–1.58、BellBody高58–70%、Clapper高12–22%、10–13 meshes、feet/held weapon禁止 | swing left → swing right → **center stop** → sound ring 1発 → clapper after-ring。Attack 1.18–1.38s |
| **ぜんまいコウモリ** `windup-bat` | 極端に横長のtoy bat + 片側へ飛び出す大きいwinding key | x/z 2.10–2.75、WingPair全幅88–101%、Key幅22–36%、13–16 meshes、realistic 6-joint wing禁止 | full stop → key reverse-wind → hold → release → burst / moon bolt 1発 → wing catch-up。Attack 0.98–1.14s |
| **月冠の騎士** `moon-crown-knight` | giant helmet + broad cape + 頭上の一個のcrescent crown。short bodyのBoss | x/z 1.08–1.38、全幅≥1.35 / 全高≥1.25、Cape幅80–96%、Helmet幅52–68%、16–20 meshes、Arm/Leg/Hand/Foot禁止 | low stance → cape nearly still → instant dash → stop → **0.10–0.16s delayed slash line** → cape catch-up。Attack ≥1.65s / Defeat ≥1.75s |

### Area 7 per-character detail

**ころ兵**
- `HeadRoot` = helmet mass。FaceRootもHeadRoot配下に置き、helmetの遅れと顔を一体化する
- `PrimaryRoot` = SpearRoot。槍は一本だけ、細い長槍ではなく短く太いtoy spear
- bodyはhelmetより明確に小さく、肩・腕・脚を追加してhuman proportionへ寄せない
- Moveは左右step cycleではなく短いtoy hop
- Hitはhelmetが先に傾き、bodyが一拍遅れて戻る
- Defeatはhelmetがbodyへ被さるようにtip over。×目はhelmet面に残る
- projectile禁止

**たて兵**
- `ShellRoot` = ShieldRoot。RoundShield一枚がfirst read
- shield rim / center bossは許可するが、小盾や二枚盾は禁止
- bodyは盾上から顔が見えるだけの小mass。手足を盾脇へ伸ばさない
- Attackはbrace中に0.10秒以上静止してから一歩だけbash
- Hitはbodyを飛ばさず、shieldが一度だけ受けて戻る
- Defeatはshieldが前へ倒れ、body/×目が上から少し見える
- projectile禁止

**ベル魔導兵**
- `PrimaryRoot` = BellRoot、`SecondaryRoot` = ClapperRoot。外殻とclapperの位相差を必須にする
- bellは一体の台形mass + rounded crown。robe / feet / wandを付けない
- Idleは非常に遅いpendulum。Moveは上下floatのみ
- Attackは左右一往復を読ませた後、中央で完全停止してから一個の`castle-sound-ring`
- Defeatは弱い一振りだけ残して接地。violent spin禁止

**ぜんまいコウモリ**
- `WingPairRoot`がwing silhouette、`TailRoot`がwinding key。keyは片側に寄せて左右対称にしない
- wingは左右一枚ずつの大きなtoy plate。finger boneや膜の細分化は禁止
- keyはstem + 横bar + 2丸knobまで。gear teethを増やさない
- Attack前半はbody/wingをほぼ止め、keyだけreverse-windする
- release後に一個の`castle-moon-bolt`を飛ばし、その後wingが遅れて開く
- Defeatはkey停止 → wing fold → body soft drop

**月冠の騎士**
- tall humanoid禁止。helmetとcapeが全体massの大半を占め、bodyは短い
- `HeadRoot` = giant helmet、`TailRoot` = cape root、`PrimaryRoot` = MoonBlade
- crescent crownは頭上に一個だけ。horn / feather / crown jewelの追加で豪華さを作らない
- Moveはslow entrance相当の短いglide + cape lag
- Signature Attackはdash contactとslash-line releaseを分離し、slash lineはstop後0.10–0.16秒遅らせる
- capeはdash中はほぼ静止し、slash後に追いつく。速度だけ上げたBossは禁止
- Defeatはweapon lower → cape tension loss → helmet/body sit。violent collapse / weapon separation禁止


## Area 8 — Dragon Crater contracts

Area 8の新要素は **anticipation FX + delayed impact**。最終Areaでもrealistic dragon anatomyへ寄せず、large head / compact body / bounded wing-or-star hookを維持する。VFX量ではなく、光が「集まる → 完全に止まる → release → 遅れてsecondaryが反応する」順序を強さの主役にする。

| Character | First read | Geometry hard gate | Motion hard gate |
| --- | --- | --- | --- |
| **たまごドラゴン** `egg-dragon` | giant round head + lower bodyを囲む一個のeggshell ring | x/z 1.38–1.58、Head幅42–50%、EggShellRing幅94–101%、14–17 meshes、large wing / back crystal禁止 | inhale → cheek/body inflate → **0.10s以上hold** → small fireball 1発 → recoil / sit → shell delayed shake。Attack 1.10–1.30s |
| **こつばさ竜** `tiny-wing-dragon` | giant headに対して明らかに小さすぎる左右wing | z/x 1.20–1.48、Head幅72–82%、各wing幅14–20%、13–16 meshes、shell / back crystal禁止 | failed flap x3 → brief hover → wing fold → short flight → dive bump → delayed tiny-wing flutter。Attack 1.10–1.30s |
| **星くいトカゲ** `star-eater-lizard` | low compact lizard + 背中の一個のoversized star crystal | x/z 1.65–2.10、BackStar高42–60%、Body幅62–80%、12–15 meshes、wing / shell禁止 | star glow drains → body charge light → still hold → charged dash → impact → **star delayed relight/rebound**。Attack 1.18–1.38s |
| **りゅうせいヒナ** `meteor-hatchling` | round hatchling + **exactly 2** small orbiting star motes | x/z 1.25–1.50、Head幅44–52%、StarMote_L/R必須、各mote高14–22%、13–16 meshes、third mote禁止 | complete still → motes rise/orbit inward → merge hold → small meteor 1発 → orbit reforms。Attack 1.30–1.50s |
| **星喰らい竜** `star-eater-dragon` | enormous head + broad readable wings + short body + bounded horns/tail | x/z 1.28–1.62、全幅≥1.70 / 全高≥1.38、Head幅48–64%、WingPair幅88–101%、18–22 meshes、realistic long neck / 4 long legs禁止 | crouch → wings fully close → star light pulls inward → **0.15s hold** → wings burst open → charge/contact → **0.12–0.18s delayed tail/wind ring** → recovery。Attack ≥1.90s / Defeat ≥2.00s |

### Area 8 per-character detail

**たまごドラゴン**
- `HeadRoot`が最大mass。bodyはheadより短く低い
- `ShellRoot` = eggshell ring。shellはbodyを囲む一個のbroken-crown ringとして読み、複数殻片を飛散させない
- `InflateRoot` = cheek/throat cue。吸い込み中だけbounded inflate
- projectileは一個のcompact `dragon-fireball`。continuous flame禁止
- Hitはbody recoil後にshellだけ0.05–0.12秒遅れてshake
- Defeatはbodyがshellへ沈み、×目だけ殻上から覗く

**こつばさ竜**
- `HeadRoot`がfirst mass、`WingPairRoot`は意図的にtiny
- wingは左右一枚ずつのrounded plate。finger bones / membrane segmentation禁止
- Idleで「飛べそうで飛べない」短いfailed flapを低頻度で入れる
- Moveは3 quick flaps → brief hover → landing。realistic gait禁止
- Attackはwing charge後だけ一度成功して短距離flight → dive bump
- projectile禁止
- Defeatはwingが一度だけ空振りしてsoft sit

**星くいトカゲ**
- low bean/lizard body + 4 short pads。long neck / thin tail / realistic quadruped gait禁止
- `PrimaryRoot` = StarRoot、内部に`GlowRoot` = BackStar
- exactly one oversized star crystal。small star decorationを追加しない
- Attack前半でstar glowを明確に落とし、bodyがcompressしてからdash
- contact後0.08–0.16秒遅れてstarがrelight/rebound
- projectile禁止
- Defeatはglow drain → bodyがstarを抱くようにcurl。crystal break禁止

**りゅうせいヒナ**
- `PrimaryRoot` / `SecondaryRoot` はbody中心に置き、各child star moteを左右offsetしてorbit可能にする
- moteはexactly 2。3個目・星trailの常時表示は禁止
- Idleは低速counter-orbit。Moveは短いfloat/hop
- Attackはbody完全静止 → 2mote rise / inward orbit → merge位置で0.10秒以上hold → `dragon-meteor` 1発
- release後に2moteが左右へ戻り、通常orbitへreformする
- Defeatはmoteがbody脇へ降りてdim。mote disappearanceだけで終わらない

**星喰らい竜**
- realistic adult dragon禁止。enormous head / short torso / broad toy wingsが主mass
- `HeadRoot`、`WingPairRoot`、`TailRoot`、`GlowRoot`を独立
- hornは左右一対のみ、tailは一本。牙 / claw / spineを増殖させない
- Signature Attackは最低7beat。wings close中にglowを内側へ集め、0.15秒hold後にburst open
- contactと`dragon-star-ring` releaseを0.12–0.18秒分離し、tail/wind after-effectもcontact後に出す
- Boss Moveはslow heavy glide + delayed wing settle
- Defeatはfinal breath → glow off → wing droop → sit → oversized head soft drop → × eyes。violent collapse禁止
- Meteor Dropはbattle-system integrationで第二Boss attackとして利用できるが、Gallery production signatureはStar Chargeを正本とする


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