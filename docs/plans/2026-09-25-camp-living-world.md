# 2026-09-25 — Camp Living World

Status: Active
Scope: Camp world / ambient residents / life animation / social motion
Baseline: `origin/main` at `9c9abc7`

## 1. Product goal

Campを「選択中の1匹を管理するメニュー背景」ではなく、

> 仲間にしたスライムたちが、戦闘の外ではここで暮らしていると感じられる場所

へ変える。

選択中の1匹を大きく見せる現在のHero stageは残す。
今回の主役はその1匹のidle animationではなく、**Heroの後ろで他の仲間が生活しているCamp worldそのもの**。

Battleで「戦っているところを眺めたい」と思わせるのと対になる価値として、
Campでは「この子たちが暮らしているところを眺めたい」を作る。

## 2. Current state / diagnosis

現在のCampは以下の構造。

```
Camp screen
├ selected slime hero stage
│  └ CampSlimeStage
│     └ 1匹のみ
├ environment stage
│  └ CampEnvironmentStage
│     ├ tent
│     ├ training dummy
│     ├ fusion altar
│     ├ nursery vat
│     ├ formation flag
│     ├ weapon rack
│     └ clearing / trees / bushes / rocks
└ management UI
```

2026-09-25にselected slimeへ、

- breathing
- look-around
- two-hop side movement
- return hops
- small happy bounce

を追加した。

これはHeroとしては有効だが、Campの問題の本質は解決していない。

現状は、

> 背景は無人のジオラマで、1匹だけが展示されている

ため、「傭兵団の生活拠点」には見えない。

## 3. Core experience contract

Campを開いた瞬間に次を感じられること。

1. 仲間が複数いる
2. それぞれ勝手に何かしている
3. 施設は飾りではなく使われている
4. 全員同じloopではない
5. しばらく見ていると別の行動へ移る
6. 仲間同士にも関係がある
7. player actionの結果がCampの生活へつながる

重要なのは「動いている数」ではなく、

```
移動する
→ 目的地に着く
→ そこで何かする
→ 他の子/物に反応する
→ また別の場所へ行く
```

という**目的のある生活**に見えること。

## 4. World composition

### 4.1 Selected Hero

現在の `CampSlimeStage` を維持。

用途:

- 選択中slimeの鑑賞
- 強化reaction
- 編成reaction
- 仲間加入reaction
- 装備/合成等の管理対象を明示

今回追加したrich idleもHero専用として残す。

HeroはCamp worldの住民表現とは別レイヤーでよい。
管理中の1匹をplayer側へ呼び出して見ている、というpresentationとして扱う。

### 4.2 Ambient residents

`CampEnvironmentStage` 内に実際のroster slimeを配置する。

原則:

- selected slimeはambientから除外
- `assignment === 'dispatch'` はCampから除外
- battle / reserve はCamp resident候補
- 同一type複数も別instanceとして存在
- mobileでは同時表示上限を設ける
- roster全員を常時描画するのではなく、4〜5匹程度を生活住民として見せる
- 長時間滞在するとresident poolを自然に入れ替える余地を持つ

同じCanvas内にenvironmentとambient slimeを置き、
施設との位置関係・depth・shadowを正しくする。

## 5. Life stations

既存Camp GLBをそのまま生活場所として使う。

### Training Dummy

主な利用者:

- Sword
- Dagger
- Shield
- Gun（距離を取る）
- Bow（距離を取る）

行動:

- hopで所定位置へ
- dummyを見る
- 小さな構え
- 1〜2回の軽い職別training motion
- dummyが少し揺れる
- satisfaction wobble
- 離れる

Battleのフル攻撃VFXは使わない。
「練習している」程度に抑える。

### Weapon Rack

主な利用者:

- Sword
- Shield
- Bow
- Dagger
- Gun

行動:

- rackへ寄る
- 武器を見る
- 自分の装備を見る
- 小さく首/体を傾ける
- ときどき嬉しそうに跳ねる

将来はForge/装備変更時の結果とつなげられる。

### Fusion Altar

主な利用者:

- Wand
- 高Fusion Rank slime
- curiosity枠として全職

行動:

- ring周辺へ寄る
- ringを覗く
- crystalへ順番に視線を振る
- Wandだけ小さなmagic response
- alarmされたように一歩下がる等の小ネタを入れられる

### Nursery Vat

主な利用者:

- Plain slime
- Wand
- Mimic
- 新加入直後のslime

行動:

- vatを覗く
- bubbleの上下へ反応
- 近づきすぎてぷるっと下がる
- 新加入時はここからCampへ出てくる

### Formation Flag

主な利用者:

- Shield
- Sword
- battle-assigned slime

行動:

- flag前へ集合
- 2匹なら短いbriefing
- flagを見る
- 片方が頷く/小jump

### Tent / Rest zone

全職。

行動:

- テント前へ移動
- bodyを少し低くして休む
- slow breathe
- blink / sleepy sway
- 起きてstretch
- 戻る

### Central Clearing

social activity用。

行動:

- 2匹が向かい合う
- alternating bounce
- 同時にぷるん
- 片方が寄る / 片方が少し引く
- その後別方向へ解散

ここがCampに「仲間同士」の感覚を出す最重要箇所。

## 6. New motion vocabulary

既存Battle motionをそのまま再生しない。
Camp用の短いmotion primitiveを作る。

### Locomotion

`camp-hop-travel`

- 1 hop = 約0.45〜0.6秒
- squash -> jump/stretch -> landing squash -> wobble
- 2〜4 hopでstation間を移動
- pathの途中でteleportしない
- 到着時に対象へyawを合わせる

### Look / curiosity

`camp-look`

- body yaw
- slight lean
- 2段階のlook
- 顔を見せる時間を残す

### Nod

`camp-nod`

- small squash
- forward lean
- settle

### Chat

`camp-chat`

- 2 residentsをpair reservation
- face each other
- A bounce -> B bounce -> both wobble
- 完全同期loopにしない

### Yawn / drowsy / sleep

`camp-yawn` / `camp-drowsy` / `camp-sleep`

- 休憩場所へ移動してから眠気が来る
- yawnでは目を細め、既存Mouthを縦に開いて「あくび」が読める
- drowsyでは徐々にbodyが低くなり、目がとろーんと閉じていく
- sleepは敗北ほど潰さない。通常bodyを保ったまま少しだけ低く・柔らかくする
- ×目は絶対に使わない
- slow breatheと時々のdream twitchを残し、「倒れている」ではなく「寝ている」と読ませる
- 数秒後にstretchして起き、hopで生活へ戻る

### Rest

`camp-rest`

- bodyを少し低く
- slower breathe
- occasional tiny wobble
- 2〜5秒程度

### Stretch / wake

`camp-stretch`

- squash
- tall stretch
- side wobble
- settle

### Practice

職別のcompact practice motion。

- Sword: small draw / slash
- Shield: brace / push
- Bow: partial draw
- Wand: wand lift + tiny spark
- Dagger: quick left/right twitch
- Gun: aim + dry recoil
- Mimic: chest/body fake-open reaction

full Battle signatureは使わない。

## 7. Camp life scheduler

Domain stateへ生活状態を保存しない。

Camp lifeはpresentation-onlyとする。

理由:

- Gold/HP/戦闘結果へ影響しない
- save schemaを増やす価値がない
- Campを閉じている間の行動までsimulationする必要がない
- playerが見る瞬間に自然なら目的を達成する

### Resident state machine

各resident:

```
enter
→ idle
→ choose destination
→ travel
→ settle
→ activity
→ leave / choose next
```

pair activityだけ:

```
reserve pair station
→ both travel
→ wait until both arrive
→ social activity
→ release reservation
→ separate
```

### Determinism

`Math.random()` をframeごとに呼ばない。

```
seed = hash(slimeInstanceId + lifeCycleIndex)
```

から、

- next station
- activity duration
- left/right approach
- minor timing offset

を決める。

QAが再現可能で、residentがframeごとに迷走しないこと。

## 8. Station occupancy and paths

新規:

`src/game/camp-life-layout.ts`

にworld-spaceのauthored contractを置く。

例:

```ts
type CampLifeStationId =
  | 'dummy-melee'
  | 'dummy-ranged'
  | 'weapon-rack'
  | 'fusion-altar'
  | 'nursery'
  | 'formation'
  | 'tent'
  | 'clearing-left'
  | 'clearing-right';
```

各stationは、

- position
- facing
- capacity
- compatible activity
- approach point

を持つ。

最初から汎用navmeshは作らない。

Campは固定ジオラマなので、
**authorした短いwaypoint path**の方が単純で見栄えも管理しやすい。

## 9. Rendering architecture

### Current

```
CampEnvironmentStage Canvas
└ environment.glb

CampSlimeStage Canvas
└ selected hero
```

### Target

```
CampEnvironmentStage Canvas
├ environment.glb
├ CampLifeDirector
│  ├ AmbientResident A
│  ├ AmbientResident B
│  ├ AmbientResident C
│  ├ AmbientResident D
│  └ optional AmbientResident E
└ station reactions

CampSlimeStage Canvas
└ selected hero
```

新規候補:

- `src/game/camp-life-layout.ts`
- `src/game/camp-life-director.ts`
- `src/game/camp-life-motion.ts`
- `src/components/CampResident.tsx`
- `src/components/CampLifePopulation.tsx`

`CampEnvironmentStage` 自体へ巨大なstate machineを直書きしない。

## 10. Environment additions

既存施設を使うことを第一優先とする。

それでも「生活」が弱い場合に限り、Blender側へ以下を追加する。

### Priority A — Campfire

中央広場のsocial focus。

- logs
- small flame
- kettle程度

用途:

- 2〜3匹が集まる
- warm / chat / rest

### Priority B — Rest mat / cushion

テント前。

用途:

- sleep/rest
- stretch/wake

### Priority C — small food bowl

必要なら追加。

ただし「食事system」は作らない。
あくまでanimation prop。

施設追加を先行せず、まず既存6 stationでliving-worldが成立するか確認する。

## 11. Roster / assignment rules

### Displayed in Camp

- reserve: yes
- battle: yes
- selected: Hero stageのみ
- dispatch: no

Battle-assigned slimeもCampに表示する。

このCampは戦闘空間と同一時刻を物理simulationする場所ではなく、
「傭兵団のホームを眺めるpresentation surface」として扱う。

一方Dispatchはplayerが明示的に「その個体を遠征へ出した」行動なので、
Campから不在になることに価値がある。

帰還時:

- Dispatch completion後、対象residentがCamp poolへ復帰可能
- 将来は入口から戻ってくる短いarrival演出へ接続可能

## 12. Social behavior

全員が別々のfacilityを触るだけだと「施設のデモ」に見える。

最低1つはpair behaviorを入れる。

Phase 1 social:

### slime chat

- 2匹がcentral clearingへ寄る
- 向かい合う
- Aが1回bounce
- Bが少し遅れて2回bounce
- 両方wobble
- 1.5〜3秒滞在
- 別方向へ離れる

Phase 2候補:

- 追いかける
- 眠っている子を覗く
- trainingを見学
- Mimicに驚く
- recruitされた新入りへ集まる

## 13. Event-linked life

Campの生活とplayer actionを切断しない。

### Recruit

新しいslimeをNurseryから出現させる。
既存residentの1〜2匹が一瞬見る/寄る。

### Level-up

selected Heroが強化reaction。
近くのambient residentが小さくlook / cheerしてもよい。

### Fusion

Fusion altarが反応。
近くにresidentがいればaltar方向を見る。

### Formation

formation flag側のresidentが反応。

### Dispatch departure / return

将来Campからdeparture/returnを直接見せる場合の接続点を持つ。
ただし今回のfirst passでDispatch map演出を重複実装しない。

## 14. Interaction

first passではambient residentを必須操作対象にしない。

理由:

- Camp UI上に既にroster stripという明確なselection surfaceがある
- background residentをtap target化すると、worldと管理UIの責務が競合する
- まず「生活している」価値を成立させる

ただし将来、

> 背景で動いているスライムをtap → その個体をselected Heroへ

はdelightとして有力。

Phase 2 acceptance後に検討する。

## 15. Performance budget

390x844 mobileを基準。

初期目標:

- selected Hero: 1
- ambient residents: 4
- 最大: 5
- environment: 既存1 scene

Resident assetは既存GLBを再利用。

- 同じassetを再fetchしない
- cloneしたsceneをresident単位で使用
- mutation visualsもresidentへ反映
- unnecessary VFXなし
- shadow qualityはHero/Battleより一段軽くしてよい

4 ambientで60fps相当のframe pacingが維持できない場合、
resident数を減らすのではなく、まずshadow / material / update costを確認する。

## 16. Phase plan

### Phase 0 — Acceptance harness

先にLiving Campを見る基盤を作る。

- 390x844
- fresh 6-job validation roster
- selected Sword Hero
- ambient 4 residents
- 12〜15秒actual-speed capture
- 2秒前後ごとのinspection frame
- console/page/network error capture

静止画1枚では判定しない。

### Phase 1 — Ambient population

- rosterからresident候補をselect
- selected / dispatchを除外
- 4 residentsをenvironment Canvasへ配置
- basic idle / facing
- station occupancy
- resident identityが職/変異を維持

Acceptance:

- 画面を開いて1秒以内にHero以外の仲間が最低3匹見える
- 全員同じ場所・同じposeにならない
- selected Heroと同一instanceが背景に複製されない

### Phase 2 — Purposeful movement

- waypoint hop locomotion
- station selection
- travel -> activity -> leave
- Training / Rack / Nursery / Altar / Tentを最低実装

Acceptance:

12秒観察で、

- 2体以上が場所を変える
- 2種類以上の施設利用が起きる
- teleportに見える位置変更がない
- 施設前で向きが対象へ合う

### Phase 3 — Job identity

6職へcompact daily actionを入れる。

- Sword training slash
- Shield brace
- Bow partial draw
- Wand tiny spell
- Dagger twitch
- Gun dry recoil

Mimicも専用reaction。

Acceptance:

text / iconを隠しても、少なくともSword / Bow / Wand / Gunの活動差が読める。

### Phase 4 — Social life

- pair reservation
- clearing chat
- alternating reactions
- separation

Acceptance:

15秒観察のどこかで「2匹が互いに反応している」と読める。

### Phase 5 — Player-event reactions

- recruit arrival
- strengthen observer reaction
- fusion look-at
- formation flag response

Campが単独loopではなくplayer actionに反応する。

### Phase 6 — Art augmentation if needed

既存Campだけで「生活」の印象が不足した場合のみ、

1. Campfire
2. Rest mat
3. optional food bowl

をBlenderへ追加。

環境追加は生活motionの不足を隠すために使わない。

## 17. QA matrix

### Required scenes

1. 6職roster / Sword selected
2. different selected Hero
3. duplicate same-type slimeあり
4. one slime dispatched
5. reserve + battle mixed
6. recruit直後
7. strengthen reaction中

### Required checks

- selected duplicateなし
- dispatched slime不在
- resident collision / exact overlapなし
- facilityへめり込まない
- Hero/name plate/UIをambient residentが横切らない
- movement pathがscreen edgeでclipしない
- social pairが互いを向く
- no GLB/material leak after selection change
- no console/page/network error

## 18. Definition of done

Campを15秒見るだけで、

> 1匹を展示している画面

ではなく、

> 傭兵団のホームで、仲間たちが各々過ごしている

と感じられる。

具体的には:

- Hero以外に常時3〜5匹の生活residentが見える
- residentはstation間を目的を持って移動する
- 最低5種類の生活activity
- 6職のうち主要職は生活motionにも個性がある
- 最低1種類のpair/social interaction
- player actionへresident/worldが反応する
- dispatch中の個体はCampに現れない
- 390x844 actual-speed 15秒 acceptance PASS
- focused tests / typecheck / production build PASS
- production deployment後も同じ生活loopを確認

## 19. First implementation slice

最初の実装単位は欲張らない。

```
Ambient 4 residents
+ deterministic scheduler
+ waypoint travel
+ Training Dummy
+ Tent/rest
+ Central chat
```

この3 activityでまずactual-speedのCampを作る。

ここで「生活している」に見えなければ、
施設数を増やす前にmovement / pause / interaction timingを直す。

見えることを確認してから、

```
Weapon Rack
→ Nursery
→ Fusion Altar
→ job-specific activity
→ player-event reaction
```

を追加する。

## 20. User-requested sleep contract — 2026-09-25

追加要件として「あくび」「寝る」「とろーんとした可愛さ」を明示的なacceptanceへ加える。

- [ ] yawnがMouth/eyes/bodyの3要素で読める
- [ ] drowsyは通常idleから徐々に眠くなる
- [ ] sleepはdefeat silhouetteほどflattenしない
- [ ] sleep中もslow breathingがあり、生存感がある
- [ ] wake/stretch後に自力で生活loopへ戻る
- [ ] 390x844 actual-speed captureで、説明文なしに「寝ている」と判断できる

## 21. Progress — first living-world slice

Implemented:

- [x] real roster instances rendered as ambient Camp residents
- [x] selected Hero excluded from ambient population
- [x] dispatched slime excluded from Camp population
- [x] stable serial ordering with a four-resident mobile cap
- [x] authored Camp life stations / safe portrait positions
- [x] hop locomotion between home and activity points
- [x] Training Dummy routine with compact job-sensitive practice motion
- [x] Training Dummy physically reacts to ambient practice impacts
- [x] two-resident social conversation with alternating bounce turns
- [x] rest routine: travel -> yawn -> drowsy -> sleep -> wake/stretch -> return
- [x] shared Camp-life clock origin so pair/social timing is deterministic
- [x] resident assets load behind a local Suspense boundary so changing Hero does not blank the whole Camp environment
- [x] dedicated 15-second `camp-living` actual-speed browser acceptance

Sleep / yawn acceptance:

- [x] yawn narrows the eyes and opens a dedicated oval mouth; actual 390x844 render is readable
- [x] drowsy transition progressively lowers the body and closes the eyes
- [x] sleep keeps the normal slime silhouette with only a soft squash/roll; it is visibly less flattened than defeat
- [x] sleep keeps slow breathing / dream twitch rather than becoming static
- [x] wake stretch restores full eyes/body before the slime hops back into the living loop
- [x] no defeat × eyes are used in Camp sleep

Verification:

- camp-life motion tests: PASS
- camp resident selection / dispatch exclusion tests: PASS
- TypeScript: PASS
- `git diff --check`: PASS
- 390x844 15-second Camp living-world browser QA: PASS, no console/page/network errors

Next slice:

1. connect ambient residents to player actions (strengthen / recruit / formation / fusion look-at)
2. add more facility routines after verifying the first three do not become repetitive
3. add environment props such as a rest mat or campfire only if they materially improve the lived-in read

## 22. Progress — reactive / rotating life slice

Implemented:

- [x] player strengthen reaction: ambient residents look toward the Hero and cheer/hop with staggered timing
- [x] recruit reaction: ambient residents look toward the Nursery side and briefly react to the newcomer
- [x] formation reaction: ambient residents acknowledge the Formation Flag direction
- [x] fusion return reaction: `キャンプで見る` returns with Hero + ambient residents reacting toward the Fusion Altar
- [x] Fusion Altar ring/crystals pulse during the Camp fusion-return reaction
- [x] shared living-world clock drives resident practice and Training Dummy impact timing
- [x] living roles rotate every 18 seconds; residents are not permanently assigned to training/sleep/chat
- [x] role transitions occur after each routine has returned home, avoiding visible teleportation at phase boundaries
- [x] Weapon Rack inspection routine
- [x] Nursery inspection / small surprise routine
- [x] Fusion Altar curiosity routine with extra Wand affinity
- [x] six-phase living schedule distributes training/rest/chat/facility inspection across residents

Verification:

- camp-life focused tests now cover sleep, travel continuity, social turns, action reactions, role rotation, and facility phases
- 390x844 strengthen-reaction burst capture: PASS
- 390x844 15-second living-world capture after reaction integration: PASS
- no console/page/network errors observed in either browser acceptance

Remaining production work:

1. long-window visual sampling of later facility phases (tests already cover deterministic phase routing)
2. consider Campfire / rest mat only after evaluating the deployed living Camp; existing facilities now have actual use
3. optional background-resident tap-to-select after living-world readability is stable

### Verification checkpoint — reactive / rotating slice

- full Vitest: 73 files / 450 tests PASS
- TypeScript: PASS
- validation-mode production build: PASS
- `git diff --check`: PASS
- 390x844 `camp-reactions` actual-speed QA: PASS
- 390x844 `camp-living` 15-second actual-speed QA: PASS

## 23. Production deployment — 2026-09-25

- [x] living Camp source merged to `origin/main` through `9038c9f`
- [x] validation-mode production bundle deployed through `games.kikuta.dev`
- [x] Cloudflare Worker Version ID: `bf10bbe7-ed7b-4cc9-a889-122133fa0d3b`
- [x] deployed Camp bundle: `CampEnvironmentStage-lkeTpOcp.js`
- [x] 390x844 public Camp smoke shows multiple real roster residents around the selected Hero
- [x] public sleep frame shows narrowed sleepy eyes + softly lowered body, not defeat flattening / × eyes
- [x] public strengthen flow shows Hero result plus ambient residents reacting in the same Camp world
- [x] public browser QA observed zero game-origin console/page/network errors

The first two living-world slices are production-complete. Future work should deepen long-session variety rather than returning to single-Hero idle polish.
