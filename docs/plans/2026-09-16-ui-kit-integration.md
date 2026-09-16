# Slime Mercenaries — UI / Kit Integration Plan

Status: Implemented (core UI / Kit integration complete; battle/content expansion ongoing)
Date: 2026-09-16

Implementation update (2026-09-17): authoritative controller/store, four-tab UI, Slimes progression, Dispatch, Forge, offline return, presentation queue, and BattleSceneModel are connected. BattleRuntime now consumes a formation-driven ally list with per-ally behavior/HP/slot metadata instead of requiring hidden Sword/Bow units; current authored battle behaviors remain Sword melee and Bow ranged.

## 1. Purpose

`Slime Mercenaries` の React / Three.js presentation prototype を、`idle-game-kit` を使う authoritative product state へ接続し、その上で Battle / Slimes / Dispatch / Forge の4画面を production-oriented な mobile portrait UI として完成させる。

この計画では UI を独立した第二のゲームロジックにしない。

> Kit / product Domain が progression の正本を持ち、UI は state projection + command invocation + transient presentation のみを担当する。

特に現在の `App.tsx` にある `createInitialRoster()` / `game/fusion.ts` の UI-only state を増築しないことを最優先とする。

---

## 2. Code review findings

### 2.1 良い現在地

- `src/domain/state.ts` に `GameState<SlimeMercenariesData>` ベースの canonical state がある。
- Currency / Token / Type Level / Fusion / Promotion / Dispatch / Equipment / Forge の主要 command/definition が Domain 側へ寄っている。
- `src/application/profile.ts` と `src/platform/web.ts` に IndexedDB persistence 境界が既にある。
- same-core simulator / offline advance が成立しており、UI側で別ロジックを作る必要がない。
- Kit の `ApplicationStore<TState>` / `useApplicationStore()` をそのまま UI 接続に使える。
- Kit の `PresentationQueue` / `AttentionSummary` / React motion primitives は notification / badge / reveal の共通基盤として使える。
- 現行 Battle visual prototype は Sword / Bow の攻撃、被弾、敗北、Greatsword sweep まで表現できているため、描画品質検証用の資産として残す価値が高い。

### 2.2 最優先で解消すべき問題

#### A. UI state が authoritative state と二重化している

`App.tsx` は現在、以下を直接保持している。

- `createInitialRoster()`
- selected slime
- fusion inventory
- fusion rank
- assignment
- equipped weapon text

一方、同じ概念が `src/domain/state.ts` / `commands.ts` / `equipment.ts` に既に存在する。

この状態で Slimes / Dispatch / Forge を作り込むと、保存・offline・simulator と UI が食い違う。

**対応:** UI fixture state を廃止し、`ApplicationStore<SlimeMercenariesState>` を唯一の durable source of truth にする。

#### B. persistence が UI lifecycle に接続されていない

`loadOrCreateSlimeProfile()` / `saveSlimeProfile()` は存在するが `main.tsx` / `App.tsx` から呼ばれていない。

**対応:** App bootstrap で profile load → offline resolution → store hydrate → UI render を行う。

#### C. `App.tsx` が画面・状態・action・animationを一つに抱えている

Battle / Slimes の screen switch、fusion animation、roster selection、battle snapshot が単一コンポーネントに集中している。

**対応:** `app shell`, `screen`, `view-model selector`, `command action`, `presentation queue` を分離する。

#### D. BattleRuntime が Sword/Bow 2体と数値を hard-code している

`BattleCanvas` は `swordFusionRank` / `swordAsset` しか受けず、`BattleRuntime` 内に Sword/Bow HP・enemy HP・damage・spawn が固定されている。

これは visual PoC としては有効だが、formation / equipment / promotion / 6-slot UI へは拡張しにくい。

**対応:** BattleRuntime を progression の正本にはしない。Domainから作る `BattleSceneModel` を受け、visual simulation / animation のみを担当する。

#### E. navigation が仕様より未完成

現状は Battle / Slimes の2タブのみ。正本仕様は以下4タブ。

1. Battle
2. Slimes
3. Dispatch
4. Forge

**対応:** authoritative connection を作った直後に4タブshellへ移行する。

#### F. battle screen の card UI が battlefield の面積を侵食しやすい

現在の下部 unit cards は2体なら成立するが、最大6枠へ増やすと大きすぎる。Battle画面は「見るだけでゲームが理解できる」ことが最優先。

**対応:** Battle画面では 6人分の詳細カードを常設しない。world-space HP + compact formation strip / quick detail sheet に寄せる。

---

## 3. Architecture decision

### 3.1 State ownership

```text
idle-game-kit GameState<SlimeMercenariesData>
        │
        ▼
SlimeGameController / ApplicationStore
        │
        ├─ execute product command
        ├─ replace authoritative state
        ├─ collect DomainEvents
        ├─ save checkpoint
        └─ expose snapshot
        │
        ▼
React useApplicationStore()
        │
        ├─ selectors / view models
        ├─ screen components
        └─ transient presentation state
```

Durable progression stateは React `useState` にコピーしない。

React-local stateに残してよいもの:

- current screen/tab
- selected slime ID
- sheet / dialog open state
- animation phase
- pointer / camera state
- currently visible transient reward notice
- presentation queue
- local optimistic press feedback

React-local stateに置かないもの:

- Gold
- Tokens
- type level
- fusion rank/form
- promotion tier
- owned weapon/refinement
- loadout
- assignment
- dispatch completion
- stage progress
- offline reward result

### 3.2 Application layer

追加予定:

```text
src/application/game-controller.ts
src/application/game-actions.ts
src/application/presentation-events.ts
src/application/selectors/
```

`SlimeGameController` の責務:

- `ApplicationStore<SlimeMercenariesState>` を保持
- accepted command の state を atomically replace
- domain events を presentation event へ変換
- save policy を一箇所で適用
- profile load / resume / offline summary を処理
- command rejection を UI-friendly result として返す

UI component から `saveSlimeProfile()` を直接呼ばない。

### 3.3 Save policy

最初は安全優先で以下を checkpoint 対象にする。

- Plain Slime craft / purchase
- job creation
- level up
- fusion
- promotion
- formation change
- equip
- forge result
- dispatch start / resolved reward
- stage / boss reward resolution
- offline resolution

連打される level-up は controller 内で短時間 coalesce してよいが、Domain command 自体は毎回純粋に処理する。

### 3.4 UI selectors

JSX内で state path と balance definition を直接大量に読むのではなく、screen単位の view model を作る。

例:

```text
selectGlobalHud(state)
selectBattleScreen(state)
selectSlimesScreen(state, selectedId)
selectFusionPanel(state, slimeId)
selectPromotionPanel(state, slimeId)
selectDispatchScreen(state)
selectForgeScreen(state)
selectNavigationAttention(state)
selectOfflineReturnPresentation(...)
```

目的:

- rendering と game rule の分離
- empty / locked / ready states の一元化
- future content追加時に JSX を壊しにくくする
- simulator / UI が別計算式を持たない

---

## 4. Global mobile shell

### 4.1 Baseline

- portrait 9:19.5
- max content width は現行 `460px` 程度で維持
- iPhone safe area 対応
- bottom navigation 常設
- modal乱用禁止
- sheet / inline panelを中心にする

### 4.2 Bottom navigation

```text
Battle | Slimes | Dispatch | Forge
```

Badgeは Kit `AttentionSummary` を使い、actionable stateのみ。

- Slimes: fusion / promotion / job discovery action ready
- Dispatch: completed return
- Forge: free/earned draw available or new important result
- Battle: 原則 badgeなし。boss blockなどは battlefield内で示す

level-up可能だけでは badge を出さない。

### 4.3 Global resource HUD

常時表示する resource は最小限。

推奨:

- Gold
- Forge Key（Forge以外では compact）

素材全種類を global header に並べない。

---

## 5. Battle screen

### 5.1 Primary hierarchy

画面の 70% 前後を battlefield に残す。

```text
[Area / Stage]                  [Gold]
[boss / stage progress]

        ENEMIES

    battlefield + VFX

      active slimes

[chest / compact reward flow]

[context action / small result strip]
[Bottom navigation]
```

### 5.2 Battlefield HUD

表示:

- Area + stage
- boss progression / boss blocked state
- compact battle status
- world-space ally HP
- boss HP only when relevant
- chest / meaningful drop

削減:

- 6体分の大きな unit card 常設
- enemy全体の常設大型card
- redundant AUTO label

### 5.3 Formation quick access

画面下端に最大6個の小さな portrait/icon dot を置く。

- HP状態
- defeated state
- fusion/promotion ready の小さな accentは必要時のみ
- tap -> slime quick sheet
- long detail cardを battlefield 上に常設しない

### 5.4 BattleRuntime integration

Phase 1では rendering qualityを壊さないため、現行 runtime を段階移行する。

#### Step A

`BattleCanvas` の入力を個別propsから `BattleSceneModel` へ変更。

```text
BattleSceneModel
- encounter / stage presentation ID
- ally presentation list
  - slimeId
  - asset/form
  - level/fusion visual tier
  - weapon presentation
  - current visual HP ratio
- enemy presentation list
- current authored behavior IDs
```

#### Step B

Sword/Bow特例を adapter 側へ追い出し、runtime内部の unit collection を generic 化。

#### Step C

reward / stage clear / progression は Domain のみが決める。

BattleRuntime は「攻撃が当たったのでGoldを増やす」などの durable mutationをしない。

#### Step D

Domain event / encounter stateを visual cueへ変換する。

例:

- `waveCleared` -> enemies defeat -> short march
- `stageBossReached` -> boss intro
- `weaponEquipped` -> next attack visual refresh
- `slimeFused` -> behavior/VFX update

完全同期が難しい初期段階は、visual runtimeの1ヒット単位のHPと authoritative analytical model を無理に同一tickにしない。progressionの正本をDomainに固定したまま、wave boundary / result boundaryで整合させる。

### 5.5 Reward flow

routine rewardは modalにしない。

- Gold -> battlefieldから小さく流れる
- material -> compact pickup chip
- chest -> physical objectとしてfieldへ
- NEW job / Mythic -> stronger reveal
- fusion ready -> Slimes badge + short result strip

Kit `PresentationQueue` を使い、普通のdropが大演出を詰まらせないよう priority / coalescing を設定する。

---

## 6. Slimes screen

この画面は単なる「一覧」ではなく、**生成・職業化・育成・合成・進化・装備変更の中心**にする。

### 6.1 Top: formation strip

- 6 slots
- battle assignmentを直接編集
- dispatched slimeは unavailable state
- duplicate typeは禁止
- reserveとのswapは1〜2操作で完了

### 6.2 Roster selector

6枠だけでは未編成slimeへ辿れないため、formationの下に horizontal roster selector / compact gridを置く。

表示優先:

- owned types
- NEW
- ready action
- assignment icon

30 formsすべてを毎回フルカードで並べない。

### 6.3 Selected slime hero

現行 `SlimePreview` を活かす。

表示:

- 3D preview
- name / role / Tier
- level
- fusion rank/form
- equipped weapon
- Battle / Dispatch / Reserve

3D previewは装飾ではなく、weapon/fusion/promotion差の確認面として使う。

### 6.4 Primary growth actions

常時4つの大ボタンを並べない。

推奨 hierarchy:

1. `Level Up` — 最頻action
2. contextual primary — `Fuse` / `Promote` / `Create` のうち今もっとも意味のあるもの
3. `Weapon` — secondary sheet
4. `Details` — Codex / stats / behavior

Level controls:

- +1
- +10
- Max affordable

すべて `previewSlimeLevelUp()` の結果を表示する。

### 6.5 Plain Slime / Job creation

Slimes画面上部に `Create Slime` affordance を置き、bottom sheet で完結させる。

#### Plain Slime section

- current stock
- material craft
- Gold purchase
- exact cost / shortage

#### Job section

- available Job Gear family
- Plain cost + gear cost
- 未発見: `NEW Sword Slime`
- 発見済み: `Sword Core に変換`

同じ操作なのに「新職発見」と「fusion material化」で結果意味が違うことを事前に見せる。

### 6.6 Fusion

現在の fusion preview / animation は方向性を維持する。

改善:

- recipeは authoritative `previewSlimeFusion()` から生成
- item icon / categoryを presentation metadata に分離
- missing item tap -> source hint
- result behavior previewを強調
- body scaleは変えない

Fusion animation stateは presentation-only。
Domain `fuseSlime()` commitとアニメーションを二重実行しない。

推奨順:

```text
press Fuse
-> command validation
-> accepted state確定
-> fusion presentation queue開始
-> animation midpointでnew form reveal
-> final state preview
```

### 6.7 Promotion

Fusionと同じcard内に混ぜず、別section / sheetにする。

明確に分離:

- Fusion = 同じtypeを強くする
- Promotion = Tier / branchを進める

Tier 3 branch選択時のみ大きな選択UIを使う。

### 6.8 Equipment

`Change Weapon` sheet:

- compatible familyのみ
- rarity
- refinement rank
- current equipped
- visible behavior effect

「ATK +x%」より、projectile / attack behavior difference を先に表示する。

### 6.9 Codex

Slimes画面の secondary route。

- evolution tree
- discovered / silhouette
- fusion rankは別カード化しない
- weapon codexはsub-tab

---

## 7. Dispatch screen

### 7.1 Screen hierarchy

Top:

- active runs
- remaining time
- completed state

Below:

- Road Escort
- Forest Exploration
- Material Gathering

### 7.2 Interaction

```text
contract tap
-> reward emphasis / duration
-> eligible reserve slimes
-> one slime select
-> Start
```

hidden success rateは入れない。

### 7.3 Kit integration

- timing: Kit Timed Activity
- assignment eligibility: product selector
- completion reward: authoritative Domain
- UI timer: `completesAt - now` のprojection

UI timerがreward resolutionの正本にならない。

### 7.4 Return presentation

auto-claim policyを守る。

帰還済みなのに「受け取る」ボタンで progression を止めない。

- completed -> stateには既に reward反映
- UIでは短い return card / slime entrance animation
- reward summaryのみ見せる

---

## 8. Forge screen

### 8.1 Core

- Forge Key count
- 1 draw / 10 draw
- pity progress
- rarity preview
- recent meaningful result

### 8.2 Draw result

Domain `forgeEquipment()` で resultを確定してから animation。

Presentation hierarchy:

- common duplicate -> fast inline
- rare new/refinement milestone -> card rise
- mythic -> short strong reveal

10 drawは10枚を順番に長く見せない。

- summary grid
- highest rarity first emphasis
- NEW / refinement milestoneのみ強調

### 8.3 Equipment collection

Forge内では draw と collection を分ける。

- top = forge action
- lower / secondary route = owned weapons
- equip actionは Slimes detailへ戻す導線も可

---

## 9. Offline return

Profile load後、offline events / resulting stateから一つの summary sheet を生成する。

表示 priority:

1. NEW discovery
2. fusion / promotion ready
3. dispatch completed
4. boss block / furthest stage
5. Gold / materials aggregate

複数claim modalは禁止。

Primary CTA:

`戦闘へ戻る`

---

## 10. First-use flow

modal tourではなく `cue -> actual action -> visible result`。

UI実装順で first 10 minutes の導線を確認する。

```text
1. material -> Plain creation
2. battle / chest -> Sword Job Gear
3. Plain + gear -> Sword discovery
4. Sword battle difference
5. another Plain + Sword gear -> Sword Core
6. Lv10 + recipe -> Greatsword fusion
7. Bow discovery
8. reserve type -> first dispatch
9. Forge Key -> first forge
```

各cueは現在のactionable targetだけを1つ強調する。

---

## 11. Component structure target

```text
src/
├─ app/
│  ├─ AppShell.tsx
│  ├─ GameProvider.tsx
│  └─ navigation.ts
├─ application/
│  ├─ game-controller.ts
│  ├─ game-actions.ts
│  ├─ profile.ts
│  ├─ presentation-events.ts
│  └─ selectors/
├─ screens/
│  ├─ BattleScreen.tsx
│  ├─ SlimesScreen.tsx
│  ├─ DispatchScreen.tsx
│  └─ ForgeScreen.tsx
├─ components/
│  ├─ battle/
│  ├─ slime/
│  ├─ dispatch/
│  ├─ forge/
│  ├─ rewards/
│  └─ common/
├─ game/
│  └─ BattleRuntime.ts
└─ domain/
```

`App.tsx` は最終的に bootstrap / shell assembly 程度へ縮小する。

---

## 12. Implementation phases

### Phase 1 — Authoritative UI foundation

Goal: UI fixtureを捨ててもアプリが起動・保存できる。

Tasks:

- `ApplicationStore` based controller
- profile async bootstrap
- IndexedDB hydrate
- `useApplicationStore` binding
- accepted command -> store update -> checkpoint
- DomainEvents -> presentation queue adapter
- loading / save error state
- current local roster/fusion fixtureを production pathから外す

Acceptance:

- reload後に level / fusion / owned equipment が保持される
- offline resumeをUI stateへ反映できる
- React durable stateの二重管理がない

### Phase 2 — Four-tab shell + selectors

Goal: 全screenの骨格を authoritative state で表示。

Tasks:

- Battle / Slimes / Dispatch / Forge bottom nav
- global resource HUD
- attention/badge selectors
- screen view models
- empty / locked states

Acceptance:

- 4 tabs が動作
- badgeが stateから deterministic に導出
- JSXに直接balance calculationを埋め込まない

### Phase 3 — Slimes core loop UI

Goal: battle以外の最重要progression loopをUIで完結。

Tasks:

- Plain craft / shop
- job creation / duplicate->core
- roster selector
- formation edit
- level +1/+10/max
- fusion authoritative migration
- promotion panel
- weapon change sheet

Acceptance:

- Plain -> Sword -> repeated Sword -> Fusion がUIだけで完走
- reload後も完全保持
- missing material / level / assignment rejectionが明確

### Phase 4 — Battle state projection

Goal: visual prototypeを authoritative progression のpresentationへ変える。

Tasks:

- `BattleSceneModel`
- generic party projection
- formation / fusion / weapon presentation反映
- stage / area HUD
- reward strip / chest presentation
- battle runtime durable mutation禁止

Acceptance:

- roster変更が戦闘表示へ反映
- Greatsword behaviorがfusion stateに追従
- weapon差が戦闘visualへ反映できる構造
- stage/rewardの正本はDomainのみ

### Phase 5 — Dispatch

Goal: reserve slimeの価値をUIで成立させる。

Tasks:

- active dispatch cards
- contract list
- eligible slime picker
- start action
- live remaining time
- auto-claimed return animation

Acceptance:

- battle slimeはdispatch不可
- dispatch中slimeはformation不可
- reload/offlineでtimer/reward整合

### Phase 6 — Forge

Goal: equipment collection loopをUIで成立させる。

Tasks:

- key count
- 1 / 10 draw
- pity
- result presentation
- owned equipment collection
- refinement status

Acceptance:

- draw result reload rerollなし
- duplicate refinement反映
- equipped weapon / battle multiplierへ反映

### Phase 7 — Offline / onboarding / reward orchestration

Goal: 放置ゲームとして session return と最初の10分を完成。

Tasks:

- offline summary
- presentation priority queue
- first-use cues
- NEW reveal
- chest/open reward rhythm

Acceptance:

- 1回のoffline sheetで復帰可能
- routine rewardが操作を止めない
- first Fusionまで説明modal連打なし

### Phase 8 — UI polish / acceptance

Tasks:

- actual iPhone portrait dimensions
- safe area
- small-height devices
- reduced motion
- touch target
- 60fps animation target
- Three canvas + overlay overdraw確認
- visual regression screenshot
- headless journey test

Representative journeys:

1. new profile -> Plain craft -> Sword discovery
2. repeated Sword -> Fusion
3. formation edit -> battle
4. reserve -> dispatch -> offline return
5. Forge 10 draw -> duplicate refinement -> equip
6. boss block -> level/fusion -> pass boss

---

## 13. Testing strategy

過剰なcomponent unit testは増やさない。

### Domain

既存 Vitest を継続。UI追加で game rule を React側へ移さない。

### Selector tests

価値の高いものだけ pure test。

- badge visibility
- eligible formation / dispatch
- fusion / promotion ready state
- offline summary priority

### Browser acceptance

Playwright/headless を主に使用し、実render screenshotも確認する。

最低限:

- 9:19.5 mobile viewport
- tab navigation
- save/reload
- fusion visual transition
- dispatch timer / reload
- forge result persistence

Three.js motionは static screenshotだけでacceptしない。短い連続frame / video相当で確認する。

---

## 14. Performance / robustness rules

- global GameState updateごとに Three scene 全再生成をしない
- battle visual propsは stable projection + granular updateにする
- expensive selectorsは必要箇所だけ memoize
- IndexedDB saveをrender effectに置かない
- UI timerを毎frame global stateへ書かない
- animation stateを save dataに入れない
- long list virtualizationは30 slime / 数十武器規模では初期導入しない
- CSS / native browser primitivesで足りる箇所に重いUI frameworkを追加しない

---

## 15. Explicit non-goals for this UI pass

- 30 slime forms全部のproduction asset完成
- shop / premium monetization UI
- PvP/social
- complex inventory grid management
- individual slime instances
- manual combat controls
- generic crafting engineのKit追加
- Battle engineのKit移植

---

## 16. Recommended execution order

実装順は以下で固定する。

```text
1. authoritative store/controller
2. selectors + 4-tab shell
3. Slimes core loop
4. Battle projection
5. Dispatch
6. Forge
7. offline/onboarding/presentation orchestration
8. polish + acceptance
```

Battle画面の見た目を先に全面作り直すのは避ける。現在のBattle visual prototypeは保持し、まず progression state を一本化した後に generic battle projection へ移行する。

この順序なら、UI作業の途中でも balance simulator / persistence / offline と同じデータへ繋がり続け、後から「見た目は完成したが全部fixtureだった」という作り直しを避けられる。
