# Slime Mercenaries — UI Production Quality Plan

Status: Active
Date: 2026-09-19
Scope: Presentation/UI quality only. Existing Domain/Kit state and gameplay rules remain authoritative.

## 1. Goal

現在の「機能は動くがモックに見える」UIを、スマートフォン縦画面の放置RPGとしてプロダクション品質まで引き上げる。

この作業の目的は、カードやCSS図形を綺麗にすることではない。

> 画面を見た瞬間に「スライム達が暮らし、戦い、育ち、派遣され、鍛造されるゲーム世界」に見え、主要操作の結果が数値ではなく世界の変化として返る状態を作る。

既存の正本である `docs/specs/ux-ui.md` と `docs/specs/art-direction.md` の方向性は維持する。
今回のplanは、現在実装との差分を埋める実行計画である。

## 2. Code review summary

### 2.1 既に良い基盤

以下は作り直さない。

- Domain / controller / selector を authoritative state として使う構造
- React + React Three Fiber の画面構成
- BattleRuntime の実戦闘
- GLBベースのスライム表示
- CampSlimeStage のキャラクターリアクション
- Fusion の実消費・永続化・結果反映
- Dispatch / Forge のDomain接続
- bottom navigation の4 destination構造
- validation mode を通常ロジックから分離している方針

TypeScript `pnpm typecheck` は 2026-09-19 時点でpass。

### 2.2 モック感の主因

#### Battle

`BattleRuntime.createEnvironment()` は現在、

- PlaneGeometry のgrass / road
- BoxGeometry のfence
- SphereGeometry のflower
- Cylinder / Icosahedron のtree

を直接生成している。

戦闘キャラ自体はGLBまで進んでいる一方、世界側が「Three.jsプリミティブで作った検証scene」に見えやすい。

また、仕様で要求されている

- battlefield chest
- loot flight
- wave間のmarch / environment scroll
- boss intro framing
- areaごとの背景identity

がUI体験としてまだ弱い。

BattleScreen側も `battle-status-strip` やvalidation restartなど、文字overlayへ頼る場面が残っている。

#### Camp

Campの中心スライムはGLBで表示されており方向性は良い。

一方、周囲の世界は

- CSS gradientのsky / hills / ground
- `▲` のtent
- `＋` のtraining dummy
- `⚑` のformation flag
- `✦` や `●` のhotspot記号

で構成されている。

これは「ゲーム世界の中にUIがある」のではなく、「UIの背景にゲーム風の図形を置いた」状態。

また `SlimesScreen.tsx` が、

- roster
- world
- train
- promotion
- formation
- nursery
- fusion entry
- early-game cue
- validation tools

を一つのcomponentに持ち、presentation responsibilityが肥大化している。

#### Fusion

Fusionは現状の4画面では最もproductionに近い。

ただし、

- Campからaltarへ近づく空間的連続性がない
- `behaviorLabel()` がbehavior id文字列のincludes判定
- workbench JSX側でduplicate/core判定やrouting知識を持つ
- Fusion sceneがまだ `SlimePreview` に強く依存

している。

UIとしては成立しているが、今後Tier / branchが増えるほどpresentation logicが破綻しやすい。

#### Dispatch

`DispatchScreen.tsx` のmapは、

- CSS oval land
- CSS river / road
- `⌂` / `⚑` / `♧` / `◆`
- traveling slimeはicon画像の2D移動

で構成されている。

機能としては「派遣先を選ぶmap」になっているが、完成品ゲームのmapというよりinteractive mockに見える。

特に「スライムを送り出した」感が、実キャラの移動ではなくiconの移動に留まる。

#### Forge

Forgeもconceptは正しいが、

- machineがCSS rectangle / pseudo element主体
- hammer/anvil/coreが記号と矩形
- weapon revealが `⚔` / `➶`
- result rackも記号

である。

「鍛造機を操作している」ではなく、「鍛造機の概念図を操作している」状態。

#### App shell / navigation

bottom navは4 destinationで適切だが、iconが

- ⚔
- ⌂
- ↗
- ◆

の文字glyph。

ここは非常に目につくため、production iconへ置換する。

### 2.3 Presentation architectureの問題

`src/style.css` にBattle/Camp/Fusion/Dispatch/Forgeの世界表現とUI表現が大量に集中している。

問題はファイルサイズそのものではなく、

- scene art
- controls
- motion
- state styling

が同じ層で混ざっていること。

今後のproduction polishでは画面単位でcomponentとstyle responsibilityを分ける。

大規模なdesign systemは作らない。
必要なshared token / button / HUD / navだけ共有する。

## 3. Production quality bar

以下を満たした状態を「モック脱却」とする。

1. テキストを読まなくても各destinationが何の場所か分かる。
2. Unicode記号・emojiを主要visual assetとして使用しない。
3. Battle / Camp / Dispatch / Forgeの背景がCSS図形だけで成立していない。
4. 主要actionは数値変更より先、または同時にsceneへ反応を返す。
5. screenごとにhero objectが明確。
6. 390x844で6px〜8pxの常用文字に依存しない。
7. gameplay中は世界がUIより強い。
8. 主要演出は静止画だけでなく実速度のsequenceでacceptする。
9. validation UIはproduct visual hierarchyを壊さない。
10. first 5 minutesが「画面を順番に開くtutorial」ではなく、育成→戦闘→報酬→強化の循環として見える。

## 4. Execution order

UI全体を同時に薄く磨かない。

以下の順で一画面ずつproduction qualityまで完成させる。

### Phase 0 — Visual baseline / QA harness

目的:
今の実画面を基準化し、以降の「良くなったつもり」を防ぐ。

実施:

- 390x844 headless capture
- Battle 30秒 sequence
- Camp idle / level up / formation
- Fusion ready / merge / result
- Dispatch idle / departure / running / return
- Forge idle / 1 draw / 10 draw / mythic
- console error / page error確認
- textを隠したcaptureも1枚作り、sceneだけで意味が読めるか確認

成果物は一時QA evidenceであり、恒久docsには残さない。

### Phase 1 — Shared production shell

対象:

- `src/app/AppShell.tsx`
- `src/style.css`
- navigation assets
- shared UI components

実施:

- bottom nav glyphを専用SVG iconへ置換
- safe area / dockサイズ整理
- resource HUDの共通visual language整理
- touch target 44px相当を基準化
- 6〜8px常用textを廃止
- generic uppercase kickerの乱用を削減
- primary / secondary / contextual actionの視覚優先度統一
- global event noticeをゲーム内reward presentationへ寄せる

Acceptance:

- navだけ見ても仮実装感がない
- 390px幅で文字が読める
- 画面ごとのworldをdockが邪魔しない

### Phase 2 — Battleを最優先で完成

理由:
放置ゲームで最も長く見る画面であり、ここがモックなら全体がモックに見える。

対象:

- `src/screens/BattleScreen.tsx`
- `src/components/BattleCanvas.tsx`
- `src/game/BattleRuntime.ts`
- area/environment presentation

実施:

#### Environment

- Clover Roadをproduction asset化
- Blender Pythonで再利用可能な
  - road edge
  - fence
  - flower cluster
  - tree/bush
  - stone
  - sign
  を作る
- distant backdrop layer追加
- groundを単色Planeからmaterial variation付きへ
- contact shadow / light / fogを調整

#### Camera / composition

- ally / enemy clusterを現在より大きく見せる
- 6体編成でも顔と武器が読めるcamera距離を固定
- wave移動時だけcamera/worldを少し送る
- boss introで一時的にframingを変える

#### Reward heartbeat

- enemy drop
- Gold/material flight
- battlefield chest
- chest auto open
- boss clear
- wave march

をworld内eventとして実装。

#### HUD

- status stripを常設説明欄として使わない
- retry / defeat / regroupはworld reactionと短いcueで示す
- enemy HPはboss / meaningful enemyだけ強調
- party railは戦闘を見る邪魔にならない位置へ整理

Acceptance:

- 30秒放置して見ていられる
- screenshotで「平面の道 + 小さいモデル」に見えない
- defeat→撤退→再挑戦が文字を読まなくても理解できる
- chest/rewardがworldに存在する

### Phase 3 — Campを「UI背景」から「場所」へ

対象:

- `src/screens/SlimesScreen.tsx`
- `src/components/CampSlimeStage.tsx`
- Camp assets

実施:

#### Real camp assets

CSS/glyphで描いている

- tent
- training dummy
- formation flag
- fusion altar
- nursery/vat
- weapon rack

をproduction assetへ置換。

基本はBlender Pythonでsimple low-poly/toy-like assetを生成し、必要ならSVG/2D spriteを補助的に使う。

#### Spatial composition

- selected slimeをheroとして中央へ
- interaction stationを実objectとして周囲へ配置
- hotspot buttonは透明hit area + short labelへ
- stationのready stateはobject側が光る/動く
- rosterは常時多数のbuttonを並べず、resident / compact selectorとして整理

#### Character interaction

- level up: dummy reaction + Gold flight + slime bounce
- promotion: gate/banner reaction + form reveal
- formation: flag / lineup reaction
- recruit: nurseryから実際にslimeが出る
- equip: weapon rackから装備が飛ぶ

#### Component split

`SlimesScreen.tsx` を少なくとも以下へ分割:

- CampWorld
- CampResidentStage
- CampStations
- CampTrainingPanel
- CampFormationTray
- NurserySheet

Domain actionはcontrollerをそのまま使う。

Acceptance:

- textを隠してもCampに見える
- `▲ + ⚑ + ✦` のようなprototype glyphがない
- 強化actionの結果がsceneで先に見える
- selected slimeがUI cardより強い焦点

### Phase 4 — FusionをCampのsignature eventへ

対象:

- `src/components/fusion/*`
- `src/game/fusion-presentation.ts`

実施:

- Camp altar tapからcamera/scene transition
- current / core / ingredientをworld objectとして配置
- fusion stageを専用scene componentへ分離
- `behaviorLabel(id.includes(...))` を廃止しpresentation metadataへ移動
- source route / copy / behavior / animation presetをrender-ready selectorへ集約
- completed stateで即Campへ戻さずresultを見せる
- attack previewはBattleのmotion identityと同じものを使う
- later fusionはmajor / enhancementで演出差を明確化

Acceptance:

- first Sword Fusionはゲームのsignature momentに見える
- two slimes -> merge -> Greatsword -> sweepがUIを隠しても理解できる
- behavior idの文字列推測がJSXに残らない

### Phase 5 — Dispatchを「地図UI」から「旅」へ

対象:

- `src/screens/DispatchScreen.tsx`
- map / route assets
- slime travel presentation

実施:

- CSS oval mapをproduction illustrated mapへ置換
- Camp / forest / road / quarryを実landmark assetで表示
- route pathを視覚的に接続
- selected destinationだけ説明panelを出す
- dispatch開始時にCamp側からslimeが出発
- traveling表示をportrait icon移動からanimated slimeへ変更
- completionで帰還 + bag/chest + reward pop
- reward受取は自動のまま維持

Acceptance:

- 「task cardをmapに並べただけ」に見えない
- slimeがどこへ行ったか分かる
- running / completeがworld stateとして読める

### Phase 6 — Forgeを実際のmachineへ

対象:

- `src/screens/ForgeScreen.tsx`
- forge machine / weapon presentation assets

実施:

- CSS hammer/anvilをproduction assetへ置換
- key insertionをvisualize
- charge -> strike -> sparks -> revealを一続きのmotionにする
- weapon revealでunicode `⚔ / ➶` を使わない
- actual weapon model / authored silhouetteを使用
- 10 drawは10回演出せず、1回のmachine sequence + result burst
- highest rarity / NEWだけfull reveal
- collectionはsecondary drawer/sheet

Acceptance:

- screenshotだけで鍛造所に見える
- 1 drawが「buttonを押して結果cardが出た」ではなく「鍛造した」に見える
- weapon identityが文字記号に依存しない

### Phase 7 — First-use / transitions / audio hooks

実施:

- first session flowをCamp→Battle→reward→Campへ自然に接続
- modal tourは作らない
- destination transitionを最低限scene-awareにする
- major actionsへsound hookを追加
- mobile haptic hookは対応環境だけ利用
- reduced motionを維持

Acceptance:

- 5分以内にjob作成・Battle・強化・Fusionへの期待が自然に形成される
- explanation paragraphを読ませない

### Phase 8 — Presentation refactor / cleanup

最後に行う。先に抽象化しない。

実施:

- `style.css` をscreen単位に分割
- shared tokenは本当に共通なものだけ抽出
- obsolete card-based CSSを削除
- unused legacy presentation component削除
- duplicate motion constant整理
- Unicode placeholder assetをrepositoryから排除
- validation UIをproduction visualから分離

互換性は要求されていないため、旧presentation pathを残すshimは作らない。

## 5. Asset strategy

### Blender Pythonを優先するもの

- Camp props
- Battle environment reusable props
- Forge machine
- chest
- dispatch landmark props
- reward containers

理由:

- 既存キャラクターGLB pipelineと整合
- camera / light / shadowの統一が容易
- proceduralにvariationを作れる
- repository内で再生成可能

### SVG / 2Dを使うもの

- bottom nav icons
- resource icons
- small recipe/item icons
- map labels
- non-world HUD icon

### 禁止

- emojiをproduction iconとして使う
- Unicode記号をweapon/landmark/forge objectの完成形として使う
- CSSだけで主役となるgame objectを描く

## 6. QA / acceptance matrix

### Viewports

必須:

- 390x844
- short-height portrait
- safe-areaあり

必要に応じてiPhone実機。

### Static checks

各screenで:

- hierarchy
- clipping
- unreadably small text
- touch targets
- safe areas
- icon consistency
- placeholder glyph残存

### Motion checks

Battle:
30秒sequence

Camp:
level / formation / recruit / promotion

Fusion:
ready / converge / impact / reveal / attack / complete

Dispatch:
departure / travel / return

Forge:
charge / strike / reveal / ten-result

### Production gate

以下のどれかが残っていればUI完成扱いしない。

- hero objectがCSS primitive主体
- major visualがUnicode glyph
- important actionが数値だけ更新
- 6〜8px textへ常用依存
- screenshotがdashboard / prototypeに見える
- static screenshotだけでmotionをaccept
- product UIへvalidation/debug explanationが混在

## 7. Recommended implementation batches

並列化する場合も、同じscreenを複数chatで触らない。

### Batch A — Battle production

- environment assets
- camera/composition
- loot/chest/reward
- Battle HUD

### Batch B — Camp production

- camp props
- station interaction
- screen split
- character feedback

A/Bは触るファイル範囲を分けて並列可能。

### Batch C — Fusion

Campのaltar/station contractが固まってから着手。

### Batch D — Dispatch

独立して進行可能。

### Batch E — Forge

独立して進行可能。

最後にAppShell/navigation/shared styleを統合する。

## 8. First implementation target

最初の完成基準は「全画面を少し綺麗にする」ではなく、以下のvertical slice。

```text
CampでSword Slimeを見る
→ training dummyでLevel Up
→ Battleへ出る
→ 30秒見て気持ちいい戦闘
→ reward / chest
→ Campへ戻る
→ Fusion altarが反応
→ GreatswordへFusion
→ Battleで横薙ぎを見る
```

この一連がproduction品質になれば、残りのDispatch / Forgeへ同じ品質基準を展開する。

## 9. Definition of done

- [ ] Battleがゲームのhomeとして30秒眺められる
- [ ] CampがCSS mockではなく実在する場所に見える
- [ ] Fusionがsignature reward eventとして成立
- [ ] Dispatchが旅として見える
- [ ] Forgeが鍛造として見える
- [ ] major visualからUnicode/emoji placeholderを排除
- [ ] bottom navがproduction icon
- [ ] 主要actionのvisual consequenceがある
- [ ] 390x844 / short portrait / safe areaでQA pass
- [ ] console/page error 0
- [ ] typecheck / build pass
- [ ] relevant tests pass
- [ ] obsolete prototype CSS/componentsを削除
- [ ] old presentation compatibility pathを残さない