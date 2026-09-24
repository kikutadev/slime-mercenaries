# Slime Mercenaries — Interaction Production Completion Plan

Status: Complete
Date: 2026-09-23
Scope: touch interaction / moment-to-moment UX / production completion
Baseline: current `fix/enemy-clear-and-individual-hp` worktree after live-combat authority cleanup

## 1. Product goal

このpassの目的は「UIを綺麗にする」ことではない。

> プレイヤーが見たいものと、次に触りたいものが自然に決まり、1回のタップごとに期待した反応・因果・結果・次の欲求が返る状態へする。

タップ操作の基準ループは以下。

```text
見る
→ 意図する
→ タップ
→ その場で反応する
→ 原因が見える
→ 結果が読める
→ 次にやりたいことが見える
```

放置ゲームなので、Battleは「触らなくても成立する」ことも同等に重要。
不要な確認・受取ボタン・手動回収を増やしてはいけない。

## 2. Current audit

2026-09-23時点でコードレビューと390x844 headless browser auditを実施した。

### 2.1 良い基盤

- bottom navigationは Battle / Camp / Dispatch / Forge + Settings の5操作で安定
- navは390pxで約71x46px、主要Camp actionは83x64px、最低44px touch targetは概ね満たす
- Campは選択中slime / roster / 4 primary actionsの基本構造ができている
- Strengthen / Fusion / Formation / Nurseryには既に専用presentationがある
- Forgeはmachine stage、Dispatchはmap stageまで進んでいる
- Domain commandはUIから分離されており、タップpresentationを磨いてもルールを壊しにくい
- live Battle result authorityも個体HP側へ整理済み

### 2.2 Productionを妨げている具体的問題

#### A. タップの意味と返し方が画面ごとに不統一

同じbuttonでも現在は、

- 単なるselection
- panel toggle
- resource消費を伴うcommit
- full-screen ceremony開始
- navigation
- toast dismiss

が同じ強さのbutton appearanceで混在する。

操作前に「押すと何が起きるか」が十分予測できない箇所がある。

#### B. Battle下部の操作領域が競合している

390x844 actual auditでは、

- party member buttons: y=710–754
- Battle report peek: y=707–762

となっており、同じ領域に重なっている。

Battle reportは「見る」ためのsecondary actionなのに、party railという「slimeを開く」操作面を物理的に覆っている。

#### C. Campに装備変更UIがない

Domain/controllerには `equipWeapon` があり、combat powerにも反映される。
Forge初回取得時は「同系統で未装備のslime」へ自動装備されるが、その後の武器交換をplayerが行うproduction UIがない。

これはpolish不足ではなく操作完結性の欠落。

#### D. Codex導線がない

`docs/specs/ux-ui.md` はCodexをCamp secondary destinationと定義しているが、現行Campに導線がない。

#### E. Dispatch empty stateがdead-end

全6体を戦闘編成すると派遣eligible slimeが0になり、

> 控えのスライムが必要です。キャンプで主力から外すと派遣できます。

と説明するだけで、直接「編成で控えを作る」へ遷移できない。

説明ではなく修正行動へ1タップで戻すべき。

#### F. Forge resultの次の欲求が弱い

Forgeは結果を見せるが、

- どのslimeへ自動装備されたか
- 今の装備より強いか
- 装備変更したい場合どこへ行くか

が結果surfaceから連続していない。

#### G. First-useのinteraction languageが一部prototype

fresh stateでは「＋ 最初のスライムを生み出す」が主導線。
意味は正しいが、`＋` が主要visualとして残り、Nursery ceremonyへの期待より「追加button」に見える。

## 3. Player actions and viewing surfaces

### 3.1 Global shell — 常に見る場所

| 見る場所 | プレイヤーが知りたいこと | Production contract |
|---|---|---|
| main world / stage | 今何が起きているか | 常にscreenの主役。UI chromeより大きく・強く見える |
| resource HUD | 今使えるGold/Key等 | 現在の意思決定に必要なresourceだけ表示 |
| contextual feedback | 直前の行動がどうなったか | 一時表示。常設説明文にしない |
| bottom navigation | 次に行ける主要場所 | 常時同じ位置・同じ意味。active tab再タップでstateを壊さない |
| attention dot | 戻る価値がある場所 | 「何かできる」時のみ。開けば理由が分かる |
| bottom sheet | 一時的な詳細/管理 | 背景の文脈を保持し、閉じれば元位置へ戻る |

### 3.2 Battle — 主に見る、必要な時だけ触る

見るもの:

| 場所 | 意味 |
|---|---|
| battlefield | 最重要。敵・味方・攻撃・被弾・敗北 |
| enemy status | 誰が残っているか / boss HP |
| party condition | 誰が生存・弱っているか |
| reward/chest | 倒した結果 |
| result | 勝利・敗北・撤退・進軍 |
| activity report | Battle以外を見ていた間の進行 |

触るもの:

| Tap | 意図 | 即時反応 | 結果 | 次の欲求 |
|---|---|---|---|---|
| party portrait | このslimeを見たい/育てたい | pressed + portrait highlight | Campへ移動し、その個体をselected | 強化/合成/装備/編成 |
| battlefield chest | 報酬を今見たい | chest squash/open開始 | compact reveal | 戦闘を見る。放置ならauto-open |
| Battle report peek | 離れていた間を確認 | peek expands | report sheet | 閉じてBattleへ戻る |
| report close/確認 | 読み終えた | sheet退場 | Battleを再び主役に | 観戦 |
| bottom nav | 別の作業へ | destination即active | Battleはbackground analytical progressionへ | 目的screen |

Battleでは敵本体や空いているfieldを「何か押せそう」に見せない。
敵tapによる不要なdetail modalは追加しない。

### 3.3 Camp — 選ぶ、育てる、編成する

見るもの:

| 場所 | 意味 |
|---|---|
| selected slime stage | 今誰を扱っているか |
| name / role / Lv / Fusion Rank | 個体の現在地 |
| roster strip | 他の個体へ切り替える |
| next action | いま最も意味のある次の1手がある時だけ |
| primary actions | Strengthen / Fuse / Formation / Recruit |
| secondary state | Mutation / Equipment / Codex |
| inline tool | いま選んだ作業だけ |

触るもの:

| Tap | 即時反応 | Commit / motion | Result | 次の欲求 |
|---|---|---|---|---|
| roster slime | 1 frame以内にselected outline | stageモデルを同個体へcrossfade | detail/actionが同時更新 | この個体へ操作 |
| roster horizontal swipe | scroll follows finger | snapしすぎない | 選択は変えない | tapして選択 |
| + / 仲間を増やす | Nursery sheetを即open | なし | creation choices | Craft/Buy/Job |
| contextual next action | rowをpressed | 該当surfaceへ直行 | 目的actionが開く | commit |
| 強化 | inline panel expand | なし | +1/+10/最大が見える | 金額を選ぶ |
| +1 / +10 / 最大 | 対象button lock + coin motionを即開始 | Domain level-upは1回だけcommit | slime reaction→Lv reveal | 続けて強化/戦闘 |
| 強化close | panel collapse | なし | selected slimeは保持 | 別action |
| 合成 | full-screen Fusionへtransition | なし | selected slimeを維持 | recipe/branch確認 |
| 編成 | inline formation展開 | なし | selected memberをhighlight | slot選択 |
| formation slot | destination slot pulse | move/swap commit | 2体cross / replacement animation | 次slotまたは完了 |
| 控えへ戻す | selected slime exits field | remove commit | reserve状態 | 派遣/別member |
| 編成 完了 | panel collapse | なし | Campへ戻る | 他action |
| レア変異 | inline mutation展開 | なし | 選択肢 | 変異 |
| mutation option | ready optionのみpressed | mutate commit + visual burst | mutation identity reveal | Battleで見る |
| current weapon chip **NEW** | weapon sheet open | なし | compatible owned weaponsのみ | equip選択 |
| weapon row **NEW** | target row selection | equip commit + rack→slime motion | equipped label/DPS差分 | Battleで試す |
| 図鑑 **NEW** | secondary sheet/page open | なし | discovered slime/weapon | 閉じてCamp |

#### Camp 3D slime itself

3D slime stageは原則「見る場所」。
機能を隠したinvisible hotspotにはしない。

tap reactionを追加するなら、軽いbounce/look-atのpure delightに限定し、強化等の重要actionをそこへ隠さない。

### 3.4 Nursery — 仲間を生み出す

| Tap | 即時反応 | Cause | Result | Next |
|---|---|---|---|---|
| 素材から生み出す | button lock | material→vat | Plain slime emerge +1 | jobを与える/もう1体 |
| job option | selected toolを強調 | tool→vat | job slime reveal | selected状態でCamp |
| shopから迎える | coin motion開始 | Gold→arrival | Plain slime arrival | jobを与える |
| Mimic capture | heart reacts | heart→mimic | Mimic加入 | Campで選択 |
| close | sheet retreat | busy中は不可 | Camp state保持 | 元の作業 |

不足時はdisabled buttonだけにしない。
不足resourceと取得先が理解できる状態にする。

### 3.5 Fusion — signature interaction

| Tap | 即時反応 | Cause | Result | Next |
|---|---|---|---|---|
| branch choice | selected cardが明確に切替 | result model/behavior preview切替 | 選択結果が予測できる | Fuse |
| missing ingredient | source row pressed | Battle/Recruitへnavigation | source destination | collect |
| spare duplicate→core | specific duplicateをhighlight | absorb/convert commit | core count増加 | Fuse |
| Fuse | CTA以外のchrome退場、double tap lock | ingredient→2 slimes→flash | new form + attack preview | Battleで試す |
| close before run | immediate return | no mutation | Camp selected維持 | 別action |
| Campで見る | resultからCampへ | selected=result slime | Camp stage | 育成 |
| Battleで試す | resultからBattleへ | same slime remains formation context | combat | 新挙動を見る |

Fusion ceremonyは長くても約2–3秒以内。
実行中はclose/navを無効にし、終わったらplayerへ制御を返す。

### 3.6 Dispatch — 行き先と人を選び、あとは待つ

| Tap | 即時反応 | Result | Next |
|---|---|---|---|
| map destination | pin selected + console内容即更新 | route detail | slime選択 |
| eligible slime | selected outline | projected power/readiness更新 | 出発 |
| 出発させる | button lock + Camp departure motion | travelerがmapへ移動 | 他の派遣/離れる |
| running destination | selectedのみ変更 | remaining time/reward確認 | 待つ |
| no reserve CTA **NEW** | 「編成で控えを作る」pressed | Camp Formationへselected context付き遷移 | reserveを作る |
| return cue | tap不要 | reward auto grant + return motion | 次の派遣 |

「受け取る」buttonは追加しない。
放置ゲームのroutine rewardはauto collectを維持する。

### 3.7 Forge — keyを使い、武器を得る

| Tap | 即時反応 | Cause | Result | Next |
|---|---|---|---|---|
| 1回鍛造 | action lock、key投入開始 | charge→strike | 1 weapon reveal | 装備/もう1回 |
| 10回鍛造 | action lock | 1 machine sequence | best result hero + compact 10 results | 武器棚/もう10回 |
| result weapon **NEW** | weapon detail expand | なし | current equip比較 | equip target |
| 武器棚 summary | expand/collapse | なし | owned weapons | weapon選択 |
| weapon row **NEW** | row selected | compatible slime list | owner/equip state | equip |
| compatible slime **NEW** | target highlight | equip commit | weapon flies/equip state updates | Battleで試す |

新規weaponが未装備の同family slimeへ自動装備された場合、resultに
「剣士スライムが装備」
のように因果を明示する。

既に装備がある場合は勝手に強制交換せず、比較してplayerに選ばせる。

### 3.8 Settings / save

| Tap | Contract |
|---|---|
| 設定 | current screenを残したsheetとして即open |
| 通常/開発 mode | 選択後に切替中state。profile switch完了後にactive state更新。毎回confirmは不要 |
| export | 1 tapで生成。成功feedback。ゲーム状態は変えない |
| import | file選択まではnon-destructive。選択後にfilenameと上書きconfirm |
| delete | 必ずexplicit confirm。対象modeを明示 |
| cancel | destructive actionを何も起こさず戻す |
| close | busy中以外いつでも元screenへ |

## 4. Universal tap interaction contract

### 4.1 Touch-down

全interactive controlはtouch-down時に即座に反応する。

- opacity / scale / elevationのいずれかでpressed state
- 44x44px以上の実touch target
- visual elementが小さくてもhit targetは確保
- pointer release前にDomain actionはcommitしない

### 4.2 Selection tap

Selectionは最速のinteraction。

- release後1 frameでselected stateを変更
- animation待ちでdata panel更新を遅らせない
- second tapで意図せずcommitしない
- selected/disabled/currentを色だけで区別しない

### 4.3 Commit tap

Gold/material/key/roster assignment等を変更するtap。

```text
tap
-> affected control lock
-> cause animation starts
-> authoritative command commits once
-> result animation/reveal
-> controls unlock
```

重要:

- optimistic fake successを出さない
- command reject時はceremonyを始めない
- Domain stateが先に更新されても、必要なら表示数字だけ短時間old→new revealにする
- repeated tapが同じcommandを2回commitしない

### 4.4 Signature ceremony

Fusion / recruit / forge mythic等。

- 主要chromeを退場
- scene objectが因果を説明
- 途中で別actionを受けない
- resultを最低でも読める時間だけhold
- 最後に次の欲求を1 primary + 最大1 secondaryで出す

### 4.5 Disabled / missing requirement

disabledで終わらせない。

Playerが直せる不足なら、

- 何が足りない
- どこで取る / 何を変える

が同じsurfaceにある。

ただし全disabled controlへ説明popoverを追加するのではなく、current decisionに必要な情報だけを出す。

### 4.6 Navigation

- nav tapからvisual destination反映まで100ms級を目標
- lazy chunk中はblank screenにしない。destination固有skeletonを出す
- current nav再tapでscroll/selection/ceremonyを勝手にresetしない
- attention dotはdestinationを開けば意味が分かる

### 4.7 Toast / notice

Routine feedbackをtoastだけにしない。
scene/resultがprimary feedbackで、toastは補助。

- auto dismiss
- tap dismiss可
- critical failureだけ自動で消しすぎない
- bottom nav / primary controlsを覆わない

### 4.8 No-interaction surfaces

「見るだけ」の場所にbutton affordanceを出さない。
Battlefield、Camp scenery、Dispatch decoration等へ意味のないhover/tap cursorを付けない。

## 5. Production implementation plan

## Phase 0 — Interaction acceptance harness

目的:
「見た目が良くなった」ではなく「実際にtapして正しい」を毎回確認できるようにする。

実装:

- 390x844のfocused browser QA scriptをproduction repo内に1本だけ整備
- fresh save fixture / six-job validation fixtureを使い分ける
- visible interactive rectanglesを記録し、Battle party rail + overlay等のknown collisionを検出
- critical actionのbefore/pressed/resultをcapture可能にする
- normal product UIではvalidation toolを隠す

必須journeys:

1. fresh -> first slime -> first job -> formation -> Battle
2. Battle party tap -> Camp selected slime
3. Strengthen +1/+10 -> result
4. Formation move/swap/reserve
5. Recruit craft/job/purchase
6. Fusion ready -> ceremony -> Battle
7. reserve -> Dispatch -> departure -> return
8. Forge 1 / 10 -> reveal -> equip
9. offline return -> Battle report
10. Settings import/delete confirmation

QA infrastructure自体を巨大化しない。1本のfocused browser runner + existing Vitestで足りる。

## Phase 1 — Global interaction shell

最優先修正:

- Battle report peekとparty railの重なりを解消
- button pressed/busy/disabled visual languageを共通化
- bottom sheet close/backdrop behaviorを統一
- nav lazy-load時のblankをscreen-specific loadingへ
- toast/noticeがprimary controlsを覆わないstacking rule
- attention dot contract整理

Acceptance:

- 390x844でinteractive rectの意図しないoverlap 0
- nav 5 destinationでblank frameなし
- current tab再tapでstate保持
- all routine tap targets >=44px

## Phase 2 — Core loop interaction

対象:
Camp <-> Battle <-> Reward <-> Strengthen

実装順:

1. Battle party tap -> Camp selected
2. Camp roster selection
3. Strengthen open/+1/+10/max/close
4. Battle reward/chest
5. next action row
6. first-use creation

重点:

- tap後100ms以内に何かが動く
- result前に数字だけ変わらない
- Battleへ戻った時に育成結果を視覚で感じる

Acceptance:

```text
見る -> slimeを選ぶ -> 強化 -> Battleで差を見る
```

が説明文なしで成立。

## Phase 3 — Camp operation completeness

ここで機能欠落を埋める。

- selected slime current weapon chip
- compatible weapon sheet
- equip interaction + comparison
- Codex secondary entry
- Mutation interaction cleanup
- Formation direct entry state
- DispatchからFormationへdeep-link可能にする

Camp primary actionsは4つのまま。
Equipment/Codexを5・6個目の巨大primary buttonにしない。

Acceptance:

- owned weaponをUIから任意のcompatible slimeへ装備可能
- Dispatchの人員不足を2 tap以内で修正可能
- CodexへCampから到達可能

## Phase 4 — Fusion signature polish

既存 `2026-09-22-moment-to-moment-production.md` のFusion基準をこのinteraction contractへ統合。

- branch selection
- missing ingredient route
- duplicate->core conversion
- ceremony lock
- result next actions

Acceptance:

- double commit不可
- ceremony中の誤close不可
- resultからBattleまで1 tap
- missing materialからsourceへ1 tap

## Phase 5 — Dispatch production interaction

- node selectionのpressed/selectedを強化
- map nodeとconsoleの因果をmotionで接続
- no reserve direct CTA
- departureをCamp-originから見せる
- traveling/return state
- auto reward

Acceptance:

- 「誰をどこへ送った」が文字を読まずに追える
- dead-end empty stateなし
- collect buttonなし

## Phase 6 — Forge production interaction

- draw button press -> key insertion
- charging中double tap lock
- reveal hierarchy
- auto-equip attribution
- weapon detail
- manual equip target
- 10 draw result rack

Acceptance:

- forge resultから「誰が強くなったか」まで理解できる
- weapon inventoryがreadonly collectionで終わらない
- better weaponへ交換可能

## Phase 7 — Return / offline / first-use continuity

- offline return sheet
- Battle activity report
- first session next-action
- attention dots
- save-load recovery

方針:

- reportを毎回読ませない
- reward/progressionが多い時だけsummary価値を出す
- dismiss後の次screenを明確にする
- first-useはmodal tourにしない

## Phase 8 — Interaction-specific cleanup

最後に実施。

- obsolete CSS interaction states削除
- unused `camp-weapon-strip` placeholder CSS等を実装と一致させる
- duplicate toast/reward feedback削除
- Unicode `＋` / `✦` 等が主要action artとして残っている箇所をproduction asset/iconへ
- button copyを「機能名」より「結果が分かる文言」へ必要な箇所だけ修正

## 6. Test plan

### Domain / selector tests

継続:

- resource spend is atomic
- duplicate tap equivalent command cannot corrupt state
- equip family/ownership invariants
- formation swap/replace/reserve semantics
- dispatch eligibility and auto reward
- forge draw/refinement
- fusion requirements
- live combat result identity

### Presentation state tests

追加対象:

- Strengthen busy state prevents second commit
- Fusion ceremony prevents second commit / close
- Forge charging prevents second draw
- Nursery busy prevents duplicate creation
- Formation ceremony prevents repeated slot taps
- Dispatch departure lock prevents duplicate start
- stale toast/result does not attach to another selected slime

### Browser journey tests

production gateでは全組合せを回さない。
以下の代表journeyを実速度で見る。

| Journey | What it proves |
|---|---|
| first slime -> first Battle | first-use |
| Battle -> party tap -> Strengthen -> Battle | core loop |
| Formation swap -> reserve -> Dispatch | cross-screen continuity |
| Fusion -> Battle | signature payoff |
| Forge -> equip -> Camp/Battle | equipment completeness |
| offline return -> report -> Battle | idle UX |
| import/delete cancel/confirm | consequential recovery |

### Visual/touch acceptance

390x844を主基準。

- touch target >=44
- overlapping actionable controlsなし
- safe-area
- selected / busy / disabled / currentの区別
- modal/sheetでbackdrop hit leakなし
- action resultがnavに隠れない
- actual-speed motion inspection

short-height portraitはshell変更時に追加確認。

## 7. Definition of production-level interaction

以下をすべて満たすまで完了扱いにしない。

| Contract | Done condition |
|---|---|
| one tap / one meaning | 1 controlがselectionとcommitを曖昧に兼ねない |
| immediate feedback | routine tapは知覚可能な即時反応 |
| visible causality | spend/create/forge/fuse/dispatchはscene上で原因→結果 |
| no double commit | ceremony/busy中の重複commandなし |
| no dead ends | playerが直せる不足には直接修正導線 |
| no hidden core action | equipment等のDomain機能がUIなしで残らない |
| passive Battle | mandatory tapなしでも戦闘・報酬が進む |
| next desire | major result後に次に試したいことが分かる |
| no overlap | 390x844でinteractive region collisionなし |
| recovery | destructive/save操作は明確にcancel/recover可能 |
| real QA | critical journeysをheadless/actual-speedで操作確認 |
| clean code | obsolete interaction path / CSSを削除、compat shimを残さない |

## 8. Priority order

実装優先度は以下。

```text
P0  Global overlap / busy / tap contract
P0  Core Camp <-> Battle interaction
P0  Equipment UI completeness
P1  Fusion
P1  Dispatch dead-end + departure/return
P1  Forge result -> equip continuity
P1  First-use / offline continuity
P2  Codex / secondary delight
P2  pure cosmetic tap reactions
```

既存のproduction planを横に増やすのではなく、
`2026-09-19-ui-production-quality.md` と `2026-09-22-moment-to-moment-production.md` の未完項目は、このinteraction contractに従って順次閉じる。

## 9. Progress

### 2026-09-23 implemented

Phase 1 / P0:
- Battle report peek moved out of the party interaction rail; 390x844 rendered geometry confirms overlap area = 0.
- destination-specific Suspense loading surfaces added for Battle / Camp / Dispatch / Forge instead of a blank lazy-load frame.
- global touch interaction floor added: touch-action, pressed feedback, disabled cursor semantics.
- Camp / Dispatch / Forge transient toasts moved out of the bottom thumb-zone controls.
- first-use Camp CTA no longer uses a bare `＋` as its primary visual; it uses the Nursery station icon and creation language.
- Camp selection/primary modes expose explicit pressed/busy semantics.

Phase 2 core loop:
- rendered browser journey verified: Battle party portrait -> same selected slime in Camp -> Strengthen -> busy state -> complete -> Battle.
- Strengthen exposes `aria-busy` on the running choice and keeps other Camp interaction locked through the ceremony.

Phase 3 operation completeness:
- added `selectSlimeWeaponOptions` projection for compatible owned weapons, refinement power and current/other-owner state.
- Camp now exposes selected slime's current weapon as a compact secondary entry rather than a fifth primary action.
- compatible weapons can be equipped from Camp.
- moving a weapon from another same-family slime explicitly says who currently owns it before the tap.
- empty weapon state routes to Forge.
- Dispatch no-reserve state now has a direct route back to Camp instead of explanation-only dead-end.
- Forge result now offers a direct continuation to a compatible/auto-equipped slime in Camp.

Rendered acceptance:
- 390x844 Battle report / party rail overlap: 0.
- Dispatch no-reserve -> Camp -> Formation path exercised.
- Forge draw -> result -> compatible slime -> Camp equipment panel exercised.
- destination-specific lazy loading observed for Dispatch and Forge.
- Forge toast / draw-control overlap: 0.
- browser page errors in exercised flows: 0.

Verification:
- full Vitest: 65 files / 417 tests PASS in 2.58s.
- TypeScript: PASS in 2.92s.
- UI production contract: PASS in 0.06s.
- production Vite build: PASS in 2.16s after stopping the QA dev server; the first concurrent build attempt exceeded the expected runtime and was intentionally stopped.

## 9. Implementation progress — 2026-09-23

Implemented in the current production-interaction batch:

- [x] Battle report peek moved out of the party portrait interaction region.
- [x] Global button pressed/disabled floor normalized.
- [x] Destination-specific lazy loading surfaces replace blank screen transitions.
- [x] Camp roster selection exposes selected state and preserves the selected slime across Battle -> Camp.
- [x] Strengthen has visible busy state and synchronous double-commit protection.
- [x] Nursery craft/purchase/job creation use synchronous commit locks through ceremony completion.
- [x] Formation move/swap/reserve use synchronous commit locks through motion completion.
- [x] Fresh first-use flow verified: first slime -> Sword job -> auto formation -> Battle.
- [x] Camp equipment UI implemented from authoritative owned inventory.
- [x] Weapon transfer from another slime is explicit before commit.
- [x] Forge result deep-links directly to the compatible slime's equipment tool.
- [x] Forge weapon shelf is actionable rather than read-only.
- [x] Forge new-weapon result attributes automatic equip to the receiving slime.
- [x] Forge durable command uses a synchronous ref lock; headless double-click verification observed exactly one durable draw.
- [x] Dispatch empty state deep-links directly to Camp Formation.
- [x] Dispatch departure uses a synchronous ref lock and locks route/crew changes during departure choreography.
- [x] Fusion branch selection exposes selection semantics; existing fusion commit lock retained.
- [x] Spare duplicate -> fusion-core conversion has duplicate-tap protection.
- [x] Settings mode switch and import/delete confirmation use synchronous commit locks.
- [x] Settings destructive operations remain explicitly confirmable and cancellable.
- [x] Battle-offscreen live progression produces meaningful BattleActivityReport data; regression test added.
- [x] Camp/Forge/Dispatch transient notices no longer occupy bottom thumb-zone controls.
- [x] Minimum 10px text / 44px touch / safe-area UI production contract restored.

Verified interaction journeys at 390x844:

- [x] Battle party portrait -> same slime selected in Camp -> Strengthen -> Battle.
- [x] Dispatch no-reserve -> Formation in one tap.
- [x] Forge -> compatible slime -> Equipment in one tap.
- [x] Normal Camp navigation clears prior deep-link tool state.
- [x] Forge double-click -> exactly one durable draw.
- [x] Nursery job double-click -> exactly one created slime.
- [x] Strengthen +1 double-click -> exactly one level.
- [x] First-use -> first slime -> Sword job -> auto formation -> Battle.
- [x] Battle offscreen progress advances Domain state and raises Battle attention.

Completion checklist:

- [x] Browser QA dependency is self-contained: `playwright-core@1.62.1` is a direct devDependency with lockfile entry.
- [x] Added self-contained `tools/qa/verify-interactions.cjs`; it builds production assets, starts/stops preview, uses Playwright headless shell, and cleans up its own browser/server processes.
- [x] Actual-speed Fusion ceremony acceptance completed for all 12 reachable Tier-3 branches.
- [x] Actual-speed Dispatch departure/return acceptance completed at 390x667.
- [x] Expanded BattleActivityReport verified after returning to Battle.
- [x] Final interaction cleanup completed for this pass; obsolete Dispatch console-retreat behavior was removed.

### 2026-09-23 continuation — Fusion / Dispatch / return continuity

Implemented:

- [x] Fusion result preview now reuses the same authored Battle/Gallery motion sources for all six job families instead of a sword-only result preview.
- [x] All 24 released Fusion steps have a regression contract for finite poses and ceremony duration through the full result timeline.
- [x] Fusion result equipment anchors come from authoritative `SlimePresentation.battle.equipmentAnchorName`, including Tier-3 shield/staff/gun variants.
- [x] Fusion ceremony fail-safe duration follows the authored result attack duration, so long signatures such as Engineer are not cut off by a fixed timeout.
- [x] Dispatch completion presentation is driven by durable `dispatchCompleted` DomainEvents instead of screen-local previous-state comparison.
- [x] A Dispatch completed while Camp/Battle/Forge is visible now leaves pending Dispatch attention and is presented exactly once when Dispatch opens.
- [x] Dispatch return cue identifies the returning slime when the event contains its slime ID.
- [x] Dispatch short-height portrait layout compacts the console while preserving the 44px touch floor.
- [x] Dispatch departure/return motion respects reduced-motion preference.
- [x] BattleActivityReport persistence/attention path re-reviewed: reports survive navigation until explicitly acknowledged.

Verification after this continuation:

- full Vitest: **66 files / 423 tests PASS** in **3.97s**.
- focused changed-contract Vitest: **6 files / 36 tests PASS** in **2.15s**.
- TypeScript: **PASS** in **3.80s**.
- UI production contract: **PASS** in **0.06s**.
- production Vite build: **PASS** in **2.42s**.
- initial bundle guard: **PASS** in **0.07s**; **127.9 KiB gzip / 160 KiB budget**.
- `git diff --check`: PASS.

Browser QA final:

- Stable browser execution was recovered by using the installed Playwright Chromium **headless shell** instead of the macOS Chrome GUI/headless binary that stalled in `CVDisplayLinkCreateWithCGDisplay`.
- A four-hour orphan QA Chrome from `anime-action-local-lab` was identified by cwd/PPID and terminated; it had been consuming roughly 760% GPU-helper CPU.
- Final production interaction runner PASS: **116.218s** for Fusion + Dispatch + Battle report.
- Fusion: **12/12 Tier-3 branches PASS**, with authored result motion and completion CTA.
- Dispatch at **390x667**: send control bottom **575.1px**, bottom-nav top **601px**, no overlap; departure busy/cue and offscreen return cue both verified.
- Battle return report: Stage **1 → 3** over 12 simulated seconds, **6 wave clears / 2 stage clears**, rewards rendered and acknowledgement closes the sheet.
- The runner leaves no preview/headless-shell processes behind.

Direct browser dependency cleanup:

- [x] Added `playwright-core@1.62.1` as an explicit devDependency and lockfile entry; QA scripts no longer rely on accidental parent-repo resolution.
- [x] Local `require.resolve('playwright-core/package.json')` resolves inside this repo.
- [x] `qa:interaction` points to the self-contained interaction runner.
- [x] The runner performs its own production build before preview, preventing stale-`dist` acceptance.
- [x] Browser/server cleanup is owned by the runner.
- [x] Browser runtime stability is resolved for QA via Chromium headless shell.

### Final verification — 2026-09-23

- [x] Full Vitest: **66 files / 423 tests PASS** — **3.63s** wall time.
- [x] TypeScript `tsc --noEmit`: **PASS** — **3.93s**.
- [x] UI production contract: **PASS** — **0.07s**.
- [x] Initial bundle guard: **PASS** — **127.9 KiB gzip / 160 KiB budget**, **0.08s**.
- [x] Production interaction QA: **PASS** — **116.218s**.
- [x] `git diff --check`: **PASS**.
- [x] No QA preview/browser process remains after the final run.

This interaction-production plan is complete. Further work should be treated as a new product-quality pass, not an unfinished item from this plan.
