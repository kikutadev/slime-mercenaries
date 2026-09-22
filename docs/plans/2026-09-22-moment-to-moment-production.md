# 2026-09-22 — Moment-to-moment production experience pass

Status: Active

## Goal

『スライム傭兵団』の主要操作を「機能が動くUI」から「触って気持ちいいゲーム体験」へ引き上げる。

品質基準は画面単位ではなく、各操作の一連の体験で判定する。

```
intent -> touch -> anticipation -> visible cause -> payoff -> next desire
```

最初の基準体験は Fusion。Sword -> Greatsword を production vertical slice として完成させ、
その基準を Nursery / Strengthen / Formation / Forge / Dispatch へ横展開する。

## Current diagnosis

Fusion は既に以下を持つ。

- production GLB を使った3D stage
- 2体の同職 slime
- 中央収束
- ingredient absorb
- central flash
- result form reveal
- first Sword Fusion の attack preview
- authoritative recipe / consumption / persistence

問題は機能不足より presentation hierarchy にある。

- 画面下部が card / panel / label の集合に見え、3D ceremonyよりUI chromeが強い
- ready ingredient まで button appearance で、何が操作対象か散る
- primary CTA が generic な「合成する」で payoff の名称を使っていない
- ceremony中も console が半透明で残り、主役を邪魔する
- result は説明 panel として出るため「獲得した」より「読まされる」が先に来る
- branching choice / missing material / ready state が同じ密度で並び、通常時の画面が重い

## Phase 1 — Fusion signature moment

### Ready state

- stageを画面の主役にする
- headerは current form / rank のみ
- next resultは「何になるか」「何が変わるか」の2点だけをstage直下で見せる
- recipeは compact strip。ready materialは非button visual、missing materialだけ取得先へ遷移可能
- CTAは結果名を含める: `大剣士スライムへ合成`
- CTA周辺以外の枠線/カード感を減らす

### Ceremony

- tap直後に lower console を退場
- ingredient -> center -> two slimes -> flash -> result の因果が画面上だけで読める
- ceremony中は close / navigation / secondary copy を消す
- major formは stageをほぼfull-screenで使う
- result attack previewを payoff として最後まで見せる

### Result

- result slimeを主役のまま保持
- compact result sheetだけを下から出す
- primary next desire = `戦闘で試す`
- secondary = `キャンプで見る`
- unlock copyは1行。説明paragraphを重ねない

### Acceptance

390x844で以下を満たす。

1. ready screenshotだけで「2体を合成して別形態になる」と理解できる
2. CTA以外の操作候補が視覚的に競合しない
3. ceremony中はUI chromeよりslime / flash / ingredientが強い
4. resultで新形態名と新攻撃が3秒以内に把握できる
5. console/page error 0
6. authoritative Fusion Rankが更新される

## Phase 2 — Nursery

Plain craft / purchase / job creationを別の体験として磨く。

- craft: 素材 -> vat -> slime誕生
- purchase: coin -> arrival
- job: tool -> handoff -> job slime reveal

数字の増加を主フィードバックにしない。

## Phase 3 — Strengthen

+1 / +10 / Max の強度差を明確化。

- Gold流入
- selected slime reaction
- level reveal
- routine操作は速く、Maxだけ少し強く

## Phase 4 — Formation

board操作を「slot management」より「仲間を動かす」体験へ。

- move / swap / replace / reserve のbody movementを優先
-説明は常設しない
- field directionとfront/backだけ常時読める

## Phase 5 — Forge / Dispatch

Forge:
- machine action -> strike -> result
- result card先行をやめる

Dispatch:
- destination choice -> departure -> travel -> return
- task card管理画面に見せない

## Verification policy

- source-only acceptance禁止
- portrait 390x844 の実renderを使う
- motionはready / mid / reveal / resultの複数時点で確認
- focused typecheck / relevant tests / buildを優先
- broad suiteはrelease時のみ

## Detailed experience contracts

### Nursery — three different fantasies, not three buttons with the same feedback

#### A. Material birth

Player desire: 「素材を使って新しい素体を1匹生み出す」。

Sequence target: about 1.2–1.3 sec.

1. 0–180ms: Gel / Water lift from the command surface.
2. 180–460ms: authored ingredient icons converge into the vat.
3. 360–560ms: liquid reacts before the Slime exists.
4. 500ms: compact central flash.
5. 520–980ms: real Plain Slime GLB rises from the vat with stretch -> squash -> settle.
6. 900–1250ms: result reads only `プレーンスライム +1`; persistent stock catches up.
7. controls return. No extra acknowledgement tap.

The lower command UI retreats during the ceremony so the birth is the largest visual event.

#### B. Gold purchase

Player desire: 「素材を待たず、Goldで1匹迎える」。

This must not reuse birth motion.

1. Gold leaves the purchase affordance.
2. arrival cue comes from outside the nursery rather than from inside the vat.
3. Plain Slime enters horizontally with two light hops.
4. settle beside / in front of the nursery.
5. result is `プレーンスライムが到着`.

Target: about 0.9–1.05 sec. Routine and faster than material birth.

#### C. Give a job

Player desire: 「このプレーンに道具を渡して、戦える仲間にする」。

This is more important than Plain creation and gets the strongest Nursery payoff.

1. Plain Slime remains visible first.
2. actual authored job-tool silhouette descends toward the Slime.
3. Slime anticipates / compresses before contact.
4. contact flash hides the Plain model.
5. **replace it with the real Tier-1 job GLB**, never a 2D result icon.
6. new job body performs one short identity reaction:
   - Sword: weapon-ready half turn
   - Shield: brace
   - Bow: light draw-ready pose
   - Wand: small magic lift
   - Dagger: quick lean / twin-weapon twitch
   - Gun: recoil-ready hop
7. show job name for one beat, then return to Camp with that new instance selected.

Target: about 1.3–1.45 sec.

Acceptance:
- screenshot after the flash contains the real 3D result, not a portrait/icon pretending to be the result.
- during ceremony, routine controls are not competing for attention.
- a player can tell material birth / purchase / job creation apart with text hidden.

### Strengthen — fast repetition with deliberate intensity

Player desire: 「この1匹をすぐ強くしたい」。

This is frequent; it must never feel like a modal reward ceremony.

Common sequence:
`tap -> Gold leaves button -> coins converge on selected 3D Slime -> body reacts -> level number catches up`

#### +1
- 250–300ms charge
- 1 small hop
- 1 narrow ring
- 4–5 coin particles
- total perceived event under ~0.75 sec

#### +10
- 330–380ms charge
- stronger squash/stretch
- 2 rings
- 7–8 coins
- level delta receives a stronger number pop
- total ~0.9 sec

#### Max
- 420–460ms charge
- broad ring + flash
- 10–12 coins
- one extra rotational / recoil beat
- total ~1.05 sec

UI:
- keep +1 / +10 / Max in one thumb-reachable row.
- each option shows only `target level` and `cost`; no extra explanatory card.
- while one is running, other actions visually recede rather than merely becoming grey disabled controls.
- the 3D Slime remains the feedback target.

Acceptance:
- five repeated +1 upgrades do not feel slow.
- +10 and Max are visibly stronger even with text hidden.
- displayed level changes at reveal, not at initial tap.

### Formation — clarity of movement over spectacle

Player desire: 「この子をこの位置へ置く」。

Target interaction: one selection + one destination tap.

Board:
- front/back rows match Battle orientation.
- enemy-facing direction remains visible.
- selected slime uses one strong highlight.
- recommended row uses a quiet field tint, not six individual badges.
- slot numbers become secondary; slime identity is primary.
- empty slot looks like a landing position, not an empty form field.

Motion:
- move: selected body arcs to destination in ~320ms.
- swap: two bodies cross simultaneously in ~380ms.
- reserve replacement: selected enters from reserve edge; displaced exits downward in ~400ms.
- return to reserve: selected exits toward the actual roster/reserve direction in ~320ms.
- destination state updates at the end of the readable movement beat.

Acceptance:
- with names hidden, it is still obvious which body moved where.
- swapping two occupied slots cannot be mistaken for deletion/recreation.
- recommended front/back is guidance, not visual alarm.
- no confirmation dialog for ordinary movement.

## Implementation order from here

1. Nursery job creation: replace fake 2D result with real Tier-1 GLB and focus the ceremony.
2. Nursery craft/purchase: authored input visuals and three clearly distinct timelines.
3. Strengthen: simplify controls and tune +1/+10/Max temporal hierarchy.
4. Formation: reduce board chrome and make movement bodies dominant.
5. Re-run the complete Camp loop at 390x844:
   `Recruit -> select -> Strengthen -> Formation -> Fusion -> Battle`.

## Progress — 2026-09-22

Completed in this branch:

- Fusion first production pass:
  - result-named CTA
  - ready ingredients no longer pretend to be actionable controls
  - lower console fully leaves during ceremony
  - compact result with Battle as primary continuation
- Nursery job creation:
  - removed 2D job-result substitution
  - loads and reveals the real Tier-1 GLB after tool contact
  - Plain body anticipates and disappears at the handoff
  - per-job short identity reaction added
- Nursery material birth:
  - flying input particles now use authored Gel / Water SVG icon language rather than anonymous CSS blobs
  - routine Nursery controls visually recede while a ceremony is running
- Strengthen:
  - fixed accidental global 1ms animation override
  - +1 timing reduced to ~0.68 sec lock
  - +10 timing reduced to ~0.84 sec lock
  - Max timing reduced to ~1.01 sec lock
  - animation duration scales with intensity
- Formation:
  - fixed accidental global 1ms movement override
  - movement shortened from 0.56 sec to 0.42 sec
  - recommended row is now a quiet field band rather than repeated warning-like slot borders
  - off-role warning border removed; recommendation remains guidance only

Verified on production build at 390x844:

- Nursery job flow: real Sword GLB requested, legacy result image count 0, new Sword selected after return
- Nursery craft: 3 authored ingredient SVGs present during input motion
- Strengthen motion duration: 0.46 sec for +1 visual pass
- Formation movement duration: 0.42 sec
- browser console/page errors: 0

Next implementation target:

1. Nursery information hierarchy: reduce the remaining list/card feeling while preserving direct access to six jobs.
2. Strengthen repeated-input feel: verify repeated +1 and +10 taps as a sequence, not only one event.
3. Formation swap/replace/reserve visual review across all four movement semantics.
4. Then move the same production contract to Forge and Dispatch.


### Progress — continuation

Implemented after the initial pass:

- Nursery information hierarchy:
  - normal six jobs changed from a long management list to a compact 2-column choice field
  - order changed to `birth -> six job choices -> Gold purchase -> special recruits` so the job handoff remains the primary Nursery payoff
  - craft surface compressed to one compact command band; the 3D vat remains the dominant object
  - purchase result copy is now explicitly an arrival (`プレーンスライムが到着`), not recycled birth copy
- Strengthen repeated-input feel:
  - next strengthen tap is accepted once the current charge reaches result phase
  - repeated +1 no longer waits for the full settle tail
  - formation remains independently locked so unrelated state-changing gestures cannot overlap
- Formation semantic timing:
  - move / reserve: 320ms
  - swap: 380ms
  - reserve replacement: 400ms
  - movement direction remains body-based rather than delete/recreate feedback
- Forge first presentation pass:
  - lower management console retreats during charge / impact
  - furnace action and strike own the screen until weapon reveal
- Dispatch first presentation pass:
  - departure temporarily clears the lower console and makes the selected Slime's map movement dominant
  - running Slimes remain visible on authored 3D routes
  - completed dispatches preserve the previous traveler briefly and animate it back to Camp
  - return cue reports the route and automatically granted reward
- Fusion robustness:
  - authoritative fusion remains the source of truth
  - added a presentation fail-safe deadline so a missed Three.js frame callback cannot leave the UI permanently in `合成中…`
  - the normal 3D completion callback remains the primary completion path

### 390x844 production verification

Real headless Chrome / production-build verification completed for the following flows:

- Nursery hierarchy:
  - craft command occupies y=370–456
  - purchase and craft are now separately verified:
    - purchase: `nursery-stage--purchase`, 5 coin particles, `プレーンスライムが到着 / キャンプへ仲間入り`
    - craft: `nursery-stage--craft`, 3 authored ingredient visuals, `プレーンスライム +1 / 生成槽から誕生`
  - all six job choices are visible without scrolling:
    - Sword / Shield: y=499–575
    - Bow / Wand: y=582–658
    - Dagger / Gun: y=665–741
  - Gold purchase follows at y=750–808
- Strengthen:
  - validation Sword set to Lv.40
  - two sequential +1 operations reached Lv.42 without waiting for the prior settle tail
- Formation:
  - swap rendered two moving bodies at 0.38s
  - reserve exit rendered at 0.32s
  - empty-slot move rendered at 0.32s
  - reserve replacement rendered two bodies at 0.40s
- Dispatch:
  - reserve Shield (power 12) could depart on Road Escort (required 8)
  - departure cue was visible while the lower console translated out
  - after the departure beat, the normal running state showed `任務遂行中`
- Forge:
  - 1x forge entered charge with the lower console retreating
  - reveal restored the console and showed the actual forged result (`希少 / 月茸の杖 / 新武器` in this QA run)
- Fusion:
  - result screen showed `合成完了 / 大剣士スライム / 新攻撃・横薙ぎ範囲攻撃`
  - `戦闘で試す` successfully navigated directly to Battle
  - returning to Camp showed the authoritative result as `大剣士スライム / 合成ランク 2`
- browser runtime / console errors during the validated Nursery and Formation -> Dispatch -> Forge sequences: 0

Focused verification:

- TypeScript: PASS (~3.1s)
- UI production contract: PASS
- Dispatch domain / presentation: 6 tests PASS
- production build: PASS (~2.0s)

### Remaining acceptance work

1. visually observe one naturally completed Dispatch return sequence end-to-end; state completion itself is already covered by domain tests
2. run one final Camp loop smoke after the latest Nursery copy adjustment:
   `Recruit -> select -> Strengthen -> Formation -> Fusion -> Battle`
3. run release-level checks only when integrating this branch; do not repeatedly run the broad suite during presentation iteration