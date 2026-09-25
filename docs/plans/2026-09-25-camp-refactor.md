# 2026-09-25 — Camp Refactoring

Status: Completed
Scope: Camp architecture / behavior-preserving structural refactor
Baseline: `origin/main` at `127ad5e`

## Goal

Living Campの機能追加で増えた責務を整理し、今後

- 生活行動
- 新しい施設
- player action reaction
- 管理UI
- Hero表示

を互いに壊さず追加できる構造へ戻す。

今回の原則は **挙動を変えない**。
Campの見た目・生活loop・sleep/yawn・管理UI初期非表示・no-auto-Heroをacceptanceとして固定したまま分割する。

## Current review

### SlimesScreen.tsx — 866 lines

現在同居している責務:

1. application selectors
2. selected slime resolution
3. management mode state
4. panel open/close state
5. feedback/reaction state
6. Nursery ceremony state
7. Strengthen ceremony state
8. Formation ceremony state
9. equipment commands
10. mutation commands
11. strengthen commands
12. roster creation/purchase/capture commands
13. Hero world rendering
14. ambient world rendering
15. roster UI
16. command launcher
17. train/fusion/formation/equipment/mutation UI
18. validation-only controls
19. Codex/Nursery/Fusion modal routing

Screen componentとして責務過多。

### camp-life-motion.ts — 503 lines

現在同居:

- common math primitives
- base idle
- hop travel
- training
- yawn/drowsy/sleep/wake
- social chat
- facility inspection
- 18s role scheduler
- player-action world reaction

モーション追加のたびに1ファイルへ集約される構造。

### CampEnvironmentStage.tsx

本来のenvironment renderingに加え、

- living-world clock origin
- Training Dummy reaction
- Fusion Altar reaction
- CampLifePopulation orchestration

を持つ。

### Type dependency

`CampLifePopulation` / `CampEnvironmentStage` が
`CampSlimeStage` の `CampSlimeReaction` 型へ依存。

Hero representationをworld contractの上位にしてしまっている。

## Target architecture

```
screens/
  SlimesScreen.tsx
    orchestration only

components/camp/
  CampWorld.tsx
  CampManagementPanel.tsx
  CampHeroStage.tsx (existing CampSlimeStage can remain implementation)
  CampLifePopulation.tsx
  CampEnvironmentStage.tsx

game/camp/
  camp-types.ts
  camp-life-layout.ts
  camp-life-residents.ts
  camp-life/
    types.ts
    math.ts
    base.ts
    locomotion.ts
    training.ts
    rest.ts
    social.ts
    inspect.ts
    schedule.ts
    reactions.ts
    index.ts
```

既存importを一度に壊さないため、
`src/game/camp-life-motion.ts` は最終的にcompatibility facadeとしてre-exportしてもよい。

## Phase 1 — Contracts first

新規 `src/game/camp-types.ts`

ここへ移す:

- `CampMode`
- `CampReaction`
- `CampFeedback`（必要ならscreen-only typeはcomponent側でも可）

Hero / Environment / Life Populationが同じreaction contractを参照する。

Acceptance:

- EnvironmentがCampSlimeStageからtype importしない
- CampSlimeStageもgame contractを参照
- behavior unchanged

## Phase 2 — Split camp-life-motion

503行を責務別へ分割。

- types/math
- locomotion/base
- training
- rest/yawn/sleep
- social
- facility inspection
- schedule
- world reaction

重要:

- `getCampLifePose()`
- `applyCampLifeWorldReaction()`
- existing exported duration contract

は外部APIを維持。

Acceptance:

- existing camp-life-motion tests unchanged or minimally import-adjusted
- 18s rotation unchanged
- sleep/yawn numerical poses unchanged
- travel continuity unchanged

Target:

- individual motion file <= 180 lines
- scheduler <= 120 lines

## Phase 3 — Extract CampWorld

`SlimesScreen` からworld renderingを分離。

CampWorld責務:

- CampEnvironmentStage
- optional Hero stage
- Hero name plate
- reaction feedback
- strengthen effect
- reward ring
- management launcher

Propsはscreen stateの最小subsetだけ渡す。

重要 contract:

- ordinary Camp entry = no Hero
- selected slime exists only when explicit
- ambient residents always world-owned
- no management panel inside CampWorld

Target:
`SlimesScreen` からworld JSX 100〜150行削減。

## Phase 4 — Extract CampManagementPanel

roster + action toolbar + inline toolsを分離。

Panel自体はDomain commandを実行しない。

受け取るもの:

- read-only view model
- callback set

これでUIとcommand sequencingを分離。

Subcomponents候補:

- CampRosterStrip
- CampPrimaryActions
- CampTrainPanel
- CampEquipmentPanel
- CampMutationPanel

ただし1回で過分割しない。
まずPanel境界を作り、その後100行超のinline toolだけ分離。

Target:
`SlimesScreen` <= 500 lines after Phase 4.

## Phase 5 — Extract interaction controller hook

Screenに残るcommand sequencingを
`useCampInteractions` へ移す。

対象:

- triggerFeedback
- formation ceremony sequencing
- strengthen ceremony sequencing
- recruit ceremony sequencing
- mutation/equipment command result mapping

Domain controller自体は既存を使用。
hookへDomain logicを再実装しない。

Screenに残す:

- selector-derived view data
- mode routing
- modal open/close
- rendering composition

Target:
`SlimesScreen` <= 300–350 lines.

## Phase 6 — Environment reaction controller

`CampEnvironmentStage` から

- dummy impact
- fusion pulse

の「何を反応させるか」の計算をpure helperへ移す。

Three.js object mutationだけStageへ残す。

生活時計も共通 `CampLifeClock` / shared ref contractにする。

Acceptance:

- resident practice and dummy hit use same time origin
- no hidden duplicated clock math

## QA preservation gates

各phase後に最低:

1. focused Camp unit tests
2. TypeScript
3. `git diff --check`

Phase 3以降:

4. 390x844 `camp-living`
5. 390x844 `camp-reactions`

最終:

6. full Vitest
7. validation-mode production build
8. public smoke if deployed

## Behavioral contracts that must not regress

- ordinary Camp entry has no foreground Hero
- ordinary Camp entry has no management panel
- compact management launcher remains
- launcher selects management target only after explicit tap
- `キャンプを見る` clears selection and returns to world-only view
- selected / dispatched slime exclusion in ambient residents
- four-resident mobile cap
- yawn -> drowsy -> sleep -> wake remains
- sleep never uses defeat × eyes
- social pair timing remains reciprocal
- resident roles rotate
- strengthen / recruit / formation / fusion reactions remain
- Training Dummy stays synchronized with practice
- validation setup does not auto-select Sword

## Anti-goals

- no new gameplay features during refactor
- no save schema changes
- no redesign of Camp CSS
- no motion retuning unless a regression is found
- no Domain logic duplication in React components
- no generic ECS/navmesh abstraction

## Completion criteria

- `SlimesScreen.tsx` <= 350 lines
- no Camp world component > 300 lines without a clear single responsibility
- no monolithic camp-life motion file
- reaction types point from UI -> game contract, not environment -> Hero component
- all behavioral QA gates PASS
- production behavior visually unchanged

## Completion checkpoint — 2026-09-25

Status: Completed locally, production rollout pending.

### Phase results

- [x] Phase 1 — Camp contracts moved to `src/game/camp-types.ts`; world components no longer depend on Hero component types.
- [x] Phase 2 — 503-line `camp-life-motion.ts` replaced by a 7-line compatibility facade over focused `camp-life/*` modules.
- [x] Phase 3 — visual world extracted to `CampWorld`; empty-roster world extracted to `CampEmptyWorld`. The compact management launcher intentionally remains at screen orchestration level because it changes selection/panel state rather than world rendering.
- [x] Phase 4 — management surface extracted to `CampManagementPanel` plus focused roster / next-action / primary-action / equipment / mutation / training components.
- [x] Phase 5 — command/ceremony sequencing extracted to `useCampInteractions` and focused equipment+mutation / formation / strengthen / nursery hooks. Domain commands remain in the existing controller; no Domain rules were copied into React.
- [x] Phase 6 — Fusion Altar / Nursery bubble / Formation Flag / Training Dummy reaction math extracted to pure `camp-environment-reactions.ts` with unit tests. `CampEnvironmentStage` now applies calculated values to Three.js objects.

### Size change

Before:

- `SlimesScreen.tsx`: 866 lines
- `camp-life-motion.ts`: 503 lines

After:

- `SlimesScreen.tsx`: 277 lines
- `CampManagementPanel.tsx`: 66 lines
- `CampWorld.tsx`: 99 lines
- `useCampInteractions.ts`: 148 lines
- focused interaction hooks: 79–182 lines
- `camp-life-motion.ts`: 7-line compatibility facade
- individual `camp-life/*` implementation files: 18–128 lines
- `CampEnvironmentStage.tsx`: 130 lines
- largest retained single-purpose world components: `CampSlimeStage.tsx` / `CampLifePopulation.tsx`, 224 lines each

### Verification

- focused Camp motion/resident/environment tests: PASS
- full Vitest: **74 files / 454 tests PASS**
- TypeScript: PASS
- validation-mode production build: PASS
- `git diff --check`: PASS
- 390x844 `camp-living` actual-speed QA: PASS
- 390x844 `camp-reactions` actual-speed QA: PASS
- visual review confirms ordinary Camp entry still has no foreground Hero and no management panel
- visual review confirms management/strengthen presentation is unchanged

### Preserved behavioral contracts

- [x] no automatic Sword/Hero on ordinary Camp entry
- [x] management UI collapsed on ordinary Camp entry
- [x] explicit management opens/targets a slime
- [x] `キャンプを見る` returns to world-only view
- [x] selected/dispatched resident exclusions preserved
- [x] yawn -> drowsy -> sleep -> wake preserved
- [x] resident role rotation preserved
- [x] strengthen / recruit / formation / fusion reactions preserved
- [x] resident practice and Training Dummy remain clock-synchronized

The remaining work is release hygiene only: commit, merge/push, deploy accepted validation build, and public smoke.

## Production rollout

- [x] implementation commit: `d0a366f refactor: separate camp world responsibilities`
- [x] merged/pushed to `origin/main`
- [x] validation build deployed to `games.kikuta.dev`
- [x] Cloudflare Worker Version ID: `d2274971-8e80-4c86-be8b-8ea0464c7a93`
- [x] public 390x844 initial Camp: Hero=0 / management panel=0
- [x] public management open: Hero=1 / management panel=1
- [x] public `キャンプを見る`: Hero=0 / management panel=0
- [x] public smoke: zero game-origin page/network errors

Refactor is complete in source and production.
