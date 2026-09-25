# 2026-09-26 — System-wide refactor and test hardening

Status: Completed
Baseline: origin/main @ 1124954
Branch: refactor/system-hardening

## Goal

Campで行った責務分離を他の主要プレイヤー導線へ広げる。

対象は「行数が多い」だけではなく、

- React画面がDomain command / ceremony / presentation stateを同時に持つ
- pureに検証できる計算がUI内に埋まっている
- escaped regressionが起きたときに安価なテスト境界がない

箇所を優先する。

挙動変更・ゲームバランス変更・UI redesignは今回の目的ではない。

## Audit

| Surface | Current | Risk | Decision |
|---|---:|---|---|
| BattleRuntime | 1,045 lines | very high / runtime critical | Phase 2. First strengthen seams/tests, then extract |
| domain/simulator | 905 | high but pure + tested | defer mechanical split |
| domain/combat | 705 | high but domain-focused + tested | defer mechanical split |
| DispatchScreen | 365 | UI/state/ceremony/controller mixed | refactor now |
| BattleScreen | 336 | authoritative/presented/pending queue + result reporting + UI mixed | refactor now |
| ForgeScreen | 263 | draw parsing + sequence timers + result target + UI mixed | refactor now |
| motion definition files | 400–760 | mostly one authored motion responsibility | no mechanical split |

## Phase 1 — Screen boundaries

### Dispatch

Extract:

- pure dispatch presentation helpers:
  - duration formatting
  - rejection labels
  - travelers projection
  - send-button label
- `useDispatchInteraction`
  - candidate selection
  - departure lock/ceremony
  - return cue ceremony
  - startDispatch command sequencing

Screen remains layout/composition.

Tests:

- traveler progress clamp
- eligible/ineligible send labels
- duration formatting
- rejection mapping

Target: DispatchScreen <= 230 lines.

### Forge

Extract:

- `forge-result.ts` pure functions:
  - parse gacha events into result views
  - rarity ranking / strongest result
  - result notice text
- `useForgeSequence`
  - command lock
  - charging -> impact -> reveal
  - target slime / equip label

Tests:

- duplicate/new result parsing
- strongest rarity selection
- equip result label/notice
- malformed event safely ignored

Target: ForgeScreen <= 180 lines.

### Battle screen

Extract:

- `useBattlePresentation`
  - authoritative -> presented/pending/queued scene coordination
  - result reporting de-duplication
  - defeat same-encounter restart revision
  - stage-arrival tracking
- pure `battle-screen-view.ts`
  - status copy
  - visible reward cue
  - enemy HP ratio / party HP ratio helpers

Existing `application/battle-presentation.ts` remains the queue policy SSOT.

Tests:

- status for defeat/victory/retry/no-party/routine
- reward cue visibility only on matching victory
- ratio clamp

Target: BattleScreen <= 220 lines.

## Phase 2 — BattleRuntime seams

Do not blindly split a 1,045-line class.

First identify extraction boundaries with independent invariants:

1. enemy/ally resource lifecycle
2. encounter replacement lifecycle
3. defeat/result transition
4. camera/hit-stop
5. snapshot projection

Prefer existing `battle-runtime/*` modules. Do not introduce a generic ECS.

Initial target:

- move one cohesive responsibility out of BattleRuntime
- add focused unit tests for that responsibility
- reduce BattleRuntime below ~850 lines if extraction stays low-risk

## Phase 3 — Regression suite quality

Audit existing 74-file suite for:

- duplicated high-cost tests
- important contracts only covered by browser QA
- stale QA expectations
- screen logic now testable as pure functions

Add tests only where they materially catch likely regressions.

## Verification

Focused development loop:

- relevant Vitest files
- TypeScript
- git diff --check

After each screen family:

- relevant headless interaction QA when available

Final:

- full Vitest
- TypeScript
- validation production build
- representative 390x844 interaction smoke:
  - Battle
  - Dispatch
  - Forge
  - Camp regression

Report elapsed wall-clock time for every verification batch.

## Non-goals

- no balance changes
- no visual redesign
- no save schema changes
- no compatibility shims
- no generic framework abstraction
- no splitting motion files solely to satisfy a line-count rule

## Completion criteria

- three major screens have clear state/interaction boundaries
- new pure behavior seams have focused tests
- BattleRuntime has at least one additional cohesive subsystem extracted or a documented reason not to split further
- full suite/build pass
- actual product flows remain visually/interaction equivalent

## Completion checkpoint — 2026-09-26

### Implemented

- [x] Dispatch state / command sequencing extracted to `useDispatchInteraction`.
- [x] Dispatch pure view helpers extracted and tested.
- [x] Dispatch presentation-only reward/running components extracted.
- [x] Forge result parsing / rarity selection / notice generation extracted as pure helpers and tested.
- [x] Forge charging -> impact -> reveal orchestration extracted to `useForgeSequence`.
- [x] Forge headless interaction QA added to the existing production QA harness.
- [x] Battle authoritative -> queued -> pending -> presented coordination extracted to `useBattlePresentation`.
- [x] Battle status / HP ratio / reward-cue / arrival helpers extracted and tested.
- [x] BattleRuntime ally/enemy defeat + ally encounter-reset lifecycle extracted to `battle-runtime/defeat-system.ts` and tested.
- [x] AppShell report presentation extracted to `AppReportSheets`.
- [x] AppShell Domain-event subscription / battle activity aggregation / dispatch return cues / battle reward cue timers extracted to `useAppPresentationEvents`.
- [x] AppShell report-summary formatting extracted and tested.
- [x] FusionWorkbench command locks / fail-safe / completion / duplicate conversion extracted to `useFusionWorkbenchInteraction`.
- [x] Fusion workbench rank/rejection helpers extracted and tested.
- [x] Stale Dispatch browser-QA expectations updated to current product copy (`このスライムを派遣`, return reward count).

### Before / after

- `DispatchScreen.tsx`: **365 -> 198 lines**
- `ForgeScreen.tsx`: **263 -> 182 lines**
- `BattleScreen.tsx`: **336 -> 188 lines**
- `AppShell.tsx`: **481 -> 280 lines**
- `FusionWorkbench.tsx`: **343 -> 281 lines**
- `BattleRuntime.ts`: **1,045 -> 940 lines**

BattleRuntime remains large, but the remaining code owns encounter loading, combat-phase orchestration and Three.js runtime state. Further splitting purely to hit a line-count target is explicitly deferred.

### Test coverage added

New focused tests cover:

- Dispatch duration / eligibility copy / rejection copy / progress clamp
- Forge event parsing / malformed events / rarity ordering / result notices
- Battle status priority / wave-vs-stage victory / HP clamp / reward cue matching / stage arrival
- BattleRuntime ally defeat idempotence / ×-eye state / dead transition / encounter reset / enemy defeat attack freeze
- App battle-report reward summary
- Fusion display-rank contract / rejection copy

Full suite moved from **74 files / 454 tests** after the Camp refactor to **80 files / 477 tests**.

### Verification timings

Development / focused verification:

- Dispatch TypeScript: 3.48s PASS; focused 4 tests: 0.63s PASS
- Forge+Dispatch TypeScript: 4.91s PASS; focused 8 tests: 1.10s PASS
- Battle TypeScript: 4.24s PASS; battle view/queue 10 tests: 0.76s PASS
- BattleRuntime final TypeScript: 3.06s PASS; focused 18 tests: 0.95s PASS
- App report extraction TypeScript: 3.43s PASS; presentation/report 23 tests: 0.84s PASS
- Fusion extraction TypeScript: 3.19s PASS; fusion 9 tests: 0.82s PASS
- Final TypeScript: **3.03s PASS**
- Final focused: **11 files / 55 tests, 1.11s PASS**
- Final full Vitest: **80 files / 477 tests, 4.11s PASS**
- validation production build: **2.51s PASS**
- UI production contract: **0.38s PASS**
- `git diff --check`: PASS

Browser / product verification:

- Forge reveal QA: 14.44s PASS
- Dispatch departure + return QA after AppShell extraction: 17.84s PASS
- Battle watch QA after AppShell extraction: 17.65s PASS
- Battle activity report QA after AppShell extraction: 18.11s PASS
- Camp living regression after AppShell extraction: 28.75s PASS
- Fusion sword/blademaster isolated comparison:
  - pre-refactor baseline: 19.11s QA PASS, ceremony completedMs 2,277ms / interactionMs 2,059ms
  - refactor: 17.53s QA PASS, ceremony completedMs 2,233ms / interactionMs 2,045ms
  - conclusion: no measurable Fusion ceremony regression; an earlier 5.2s observation occurred during a conflicting/stressed preview run and was not reproducible on isolated ports.

### Deliberate non-refactors after review

- `domain/simulator.ts` and `domain/combat.ts`: large but cohesive Domain modules with direct tests.
- authored slime/enemy motion files: large by content volume, not responsibility mixing, and directly tested.
- `FusionStage.tsx`: one 3D choreography responsibility; leave intact.
- `environments/catalog.ts`: data-heavy catalog already covered through stage-environment contract tests.
- `ally-combat-*`: behavior-family implementations covered by motion/runtime/browser layers; additional file fragmentation would increase navigation cost.
- `SettingsSheet.tsx`: cohesive settings/save-management surface, backed by runtime-settings/save-transfer tests.

All planned system-hardening work is complete. Release hygiene remains: commit, push to main, deploy validation build, and public smoke.
