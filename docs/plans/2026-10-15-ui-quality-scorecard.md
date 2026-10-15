# スライム傭兵団 — 現状採点、到達状態、改善優先順位

Date: 2026-10-15
Status: **Active baseline / provisionally scored. Not L2 accepted.**
Authoritative execution plan: [`2026-10-14-ui-above-production-quality.md`](2026-10-14-ui-above-production-quality.md)

## 0. 判定の意味と証拠の限界

**ゲーム全体: 暫定 60/100。L2（製品水準）未達。L3（製品水準を超える体験）未達。**

これは単独レビューによる**設計判断のための暫定採点**であり、ユーザーテスト、外部専門家の評点、購買意向などの実測値ではない。精度は各画面±5〜10点程度。小数点は採用せず、未実測の部分を推測で合格にしない。

- Repo review: `main` HEAD `001a1d4` (2026-10-15), clean at start. This changes stage-progress measurement relative to the October 14 document, but does not close the UI defects described here.
- Public 390×844 first-play browser QA on 2026-10-15: `BASE_URL=https://games.kikuta.dev/slime-mercenaries/ node tools/qa/verify-ui-layout.cjs`, 15 screenshots, 7 behavior assertions, **no page errors, 40.29s**. Manual screenshot review of Camp (world + management), Train, Formation, missing-material Fusion, Battle, Dispatch and Forge.
- Existing production evidence from 2026-10-14: first-play 430×932, and Fusion cold-open showing blank dark background around 0.8 seconds then populated by 4.6 seconds. This timing is prior evidence, **not** retimed on October 15.
- Representative screenshots live in local `.tmp/ui-overhaul-acceptance-390x844/`; not tracked in Git. They establish image defects, not whether actual first-time players enjoy or understand the flow.
- **No new October 15 execution of ready/merge/reveal/attack-preview/branching Fusion**, 30-member roster, 30-minute idle, or actual iOS Safari. The 2026-09-30 `.tmp/fusion-ready-*` screenshots are older and **must not be scored as current production evidence**. These gaps are mandatory next evidence, not secretly assumed passes.
- **Evaluation unit**: a player-visible full task, not individual React components or test counts. Different screens may share repeated problems, but no success is inferred from a source file existing.

## 1. Reproducible rubric: six axes totaling 100 points

| Axis | Max | 0% | 50% | 75% | 100% |
| --- | ---: | --- | --- | --- | --- |
| A. Visual composition/readability | 20 | primary subject cannot be seen | scene exists but subject, hierarchy or text broken | comfortable commercial UI | beautiful, unmistakable scene with highly polished detail |
| B. Decision and direct touch | 20 | cannot complete task | main action works but ambiguity, dead ends or extra steps | no guidance needed for realistic paths | decisions feel exceptionally effortless and meaningful |
| C. Motion/impact/character feel | 20 | no causal reaction | mechanically understandable, emotionally flat or visually wrong | clean, well-staged cause→effect→recovery | signature moments create a clear desire to repeat/experiment |
| D. Empty/locked/loading/recovery states | 15 | blocked/broken | some states incomplete, dead end or empty transition | consequential states all meaningful | transitions and recovery actively improve trust/delight |
| E. Journey/continuity/identity | 15 | player loses objective/context | disconnected screens or weak growth payoff | seamless task/identity continuity | cohesive signature core loop with tangible before/after |
| F. Technical integrity/performance | 10 | crash/irreversible state corruption | basic happy path functions but major risk | tests and public browser proof, durable state | proven resilient to stress, refresh, multi-state and target devices |

**Scoring anchors within each axis:** 0 = broken; around 25% = serious; 50% = usable prototype; 75% = L2-ish; 100% = exceptional product-specific execution. Intermediate values are a reviewer judgment requiring a cited observation. This is a prioritization aid, **not** a mathematically objective test of beauty or fun.

### Hard gates (scores cannot mask critical failures)

- L2 requires **each core screen ≥80/100**, every axis A–E at least **70% of its max**, F at least 8/10, and **zero serious blockers** in the representative journey. A critical blocked/unreadable state makes that screen **L2 FAIL even if its arithmetic sum exceeds 80**.
- L3 requires the full L2 gate **plus** core Battle, Camp, Fusion each ≥90/100, the **weighted core-loop score ≥90**, a blind independent experience review and evidence that the signature fusion/payoff is intrinsically compelling. *Do not infer emotional response from automated UI success.*
- Untested required states: label `未測定` and **deny L2/L3 acceptance**, even if a provisional score is assigned from other observable states. No automatic uplift just for implementing the planned feature.
- UI score is not the whole game review (difficulty curve, economy fun, retention, sound, device performance are separate disciplines); this scorecard focuses on the current UI/player loop.

## 2. Current screen-level score and why

| Surface | A/20 | B/20 | C/20 | D/15 | E/15 | F/10 | Current /100 | L2 target | L3 ambition |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Fusion | 7 | 8 | 9 | 5 | 7 | 9 | **45** | ≥82 | **≥92** |
| Camp living world | 15 | 11 | 13 | 8 | 9 | 9 | **65** | ≥82 | **≥90** |
| Camp management (subsurface) | 10 | 11 | 9 | 8 | 10 | 9 | **57** | ≥82 | ≥87 |
| Strengthen | 12 | 6 | 7 | 6 | 10 | 9 | **50** | ≥82 | ≥89 |
| Formation | 13 | 13 | 10 | 9 | 10 | 9 | **64** | ≥82 | ≥88 |
| Battle | 13 | 12 | 14 | 9 | 11 | 9 | **68** | ≥82 | **≥91** |
| Dispatch | 14 | 12 | 13 | 10 | 12 | 9 | **70** | ≥82 | ≥87 |
| Forge | 14 | 11 | 13 | 9 | 12 | 9 | **68** | ≥82 | ≥88 |

**Weighted core loop** (only to choose work order): Fusion 25%, Battle 25%, living Camp 15%, Strengthen 10%, Formation 10%, Dispatch 7.5%, Forge 7.5% = **59.75 → approximately 60/100**. Management is assessed as its own *hard-gated subflow*, not added again to the weighted average. This weighting values the actual game promise, not equal implementation cost.

### Concrete observed deductions, not generic recommendations

**Fusion 45 — greatest gap and P0**:

- A 7/20: at 390×844, both slime bodies and swords are visibly cropped by the viewport. Three recipe cards use `repeat(3, 1fr)`, while critical names use `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`; item/source copy is compressed in the bottom of the screen. Hero and future form compete with the control sheet.
- B 8/20, D 5/15: the missing-resource state shows a large disabled `素材が足りません` commit button, while only three tiny ingredient routes tell the player what to do. Character selection and branch outcome preview aren't tied together prominently.
- C 9/20, E 7/15: authored real 3D Fusion does exist and preserves result actions, but the current ready→merge→preview→battle sequence has **not** been reconfirmed in this scoring pass. We cannot award a high experience score based on an older video/test.
- F 9/10: the normal flow loads with zero errors, but the observed cold-open gradient and unverified refresh/busy scenarios block a full robustness score.

**Living Camp 65, management 57, Strengthen 50 — second priority**:

- Camp has a real living authored world and expressive selected slime; its gameplay surface is far better than a plain dashboard. However, the ordinary command launcher offers little context on what the player can do next beyond a cue. The life/selection loop is not independently assessed for 30+ instances.
- Management uses a tiny left-aligned roster, a duplicate selected-slime summary, separate repeated cards/actions, and large unused lower area. It becomes an admin panel rather than keeping the slime and its identity near the decision.
- Strengthen displays a large isolated slime and level, but no visible gain in battle behavior/stats. In the current first-play screenshot G22 is lower than the +1 price G30: all three action buttons are disabled, with no primary route to acquiring enough GOLD. Its main task cannot be completed or redirected in that state.

**Formation 64**: six front/back slots are legible and the explicit reserve button is present; avoid throwing away this improvement. But there is excessive separation between selected member and the slots, the interaction result is not visually strong enough, and long/duplicate roster usability is unverified.

**Battle 68**: actual 3D stage/enemies/party HUD and auto-progression are visible. Yet the small report peek overlaps the visually important bottom-right region, rewards/retreat reasons are not obvious in the examined first stage, and the middle/late-game defeat→upgrade→retry experience is unmeasured. Score reflects a credible baseline, **not** proof that the entire battle loop is boring.

**Dispatch 70 / Forge 68**: scenes have identity and the first-use empty states offer relevant onward actions. Weaknesses are less structural than Fusion/Train: actual departure/reward celebration/return/equipment comparison aren't part of this initial screenshot audit. Keep successful 3D compositions rather than redesigning by aesthetic habit.

## 3. Precise target states, measurable checks, and estimated improvement

**Numbers below are targets, not a promise of automatically earned points.** Estimate score gain from eliminating observed deficits, then re-score from matched before/after evidence. If after remains weak, keep the phase open.

| Order / task | Current -> L2 -> L3 (ambition) | Concrete transformation to build | Non-negotiable exit observation |
| --- | --- | --- | --- |
| **F0 / Baseline fixture** | Fusion **45 → verified baseline**, no points merely for QA | Reproduce first missing all, one missing, level-gated, ready, branch, run, reveal, preview, completed, refresh/duplicate tap with disposable state | Every material state in a labeled 375×667/390×844/430×932 screenshot + actual-speed clip; record load timeline; **none silently untested** |
| **F1 / Layout + recipe** | Fusion **45 → ~65** | Stage dynamically fits *two full characters + weapons*; recipe changes from 3 cramped columns to readable item rows; resource shortages and source routes become a coherent task | At 375/390/430 widths, actual full silhouette incl. sword has ≥12 CSS px inside viewport edge at all resting/approach/strike phases; essential recipe name, owned/required, origin never ellipsized; primary controls min 44×44 CSS px; all missing routes work |
| **F2 / Dead-end + cold load** | Fusion **~65 → ≥82 L2** | Remove dominant disabled-only CTA; present one available next action (collect resource, create a duplicate, train) together with transparent requirements; show immediately useful text/icon/controls during first GLB loading | Cold open shows recognizable destination and actionable content promptly (goal initial feedback <150ms, meaningful content <500ms on local QA device, report measured values, **never blank at any sampled frame**); empty/level-locked/one missing paths require ≤2 deliberate taps to actionable destination; never a deceptive disabled button; back preserves target |
| **F3 / Distinct evolution** | Fusion **≥82 → ≥92 L3** | Maintain two real slime bodies until contact; show new look settling, THEN user-held new-form reveal, THEN player-triggered actual new move; clear change vs former attack; intensity scales by Tier without giant bodies or obscured eyes | Frame-by-frame capture shows distinct anticipation/contact/after; major form vs normal rank-up visible *without reading text*; branch options visibly differ; no forced auto-advance, replay works, attack recognizable in next actual battle, no extra repetitive confirmations. Independent blind reviewer rates payoff against baseline |
| **C1 / Roster & management** | Management **57 → ≥82**, Camp **65 → ≥82** | Keep living camp on ordinary entry; show clearly which *persistent* slime is selected; remove duplicate status blocks; group/search large roster while keeping all duplicates accessible | In fixture of **30 separately owned slimes**, locate a specified named/serial instance, change its gear/formation, revisit and identify same instance without confusing same-type copies; visible selection reaction; no dead lower space or unrelated stacked card layout |
| **C2 / Strengthen** | Train **50 → ≥82 → ≥89** | Bring selected character, spend, and before/after gain together; replace all-disabled no-gold condition with one earned-GOLD next step; scale authored animation to +1/+10/MAX | In current **G22 vs G30** scenario, player reaches a way to earn gold within ≤2 taps and knows why; with enough G, result shows changed level *and an authoritative combat-relevant improvement*, consistent character reaction before number settles; repeated 10 presses don't double-spend |
| **B1 / Fight, loss and motivation** | Battle **68 → ≥82 → ≥91** | Observe high-density boss/return, remove the report peek's conflict with party tap targets; connect retreat, materials, upgrade opportunity and retry visibly | 6-member boss: no important portraits/HP/attacks obscured in >95% sampled normal-combat frames (named exceptions for authored cinematic); on defeat, recover to the previous stage, maintain progression/reward rules, show exact resource gain and a real reachable upgrade/collection next step; no forced manual claim; continuous background combat verified |
| **R1 / Formation** | Formation **64 → ≥82 → ≥88** | Compact selected member + slot proximity, real move/swap/return animations | 30-instance selection and full six-slot test: swap, replacement, return-to-reserve and dispatch eligibility all correct; no duplicate is collapsed into the same character; visible source/destination reaction |
| **D1 / Dispatch** | **70 → ≥82** | Polish departure/return only where observed weak; preserve authored map | Empty -> reserve -> send -> timer -> return -> reward is playable, status persists through screen switch, one obvious next step in each state; no accidental send twice |
| **G1 / Forge** | **68 → ≥82** | Improve 0-key/ready/10-draw/compare/equip loop only where evidence says it is weak | 0 keys leads to battle, key spend triggers physical forging, 10 results individually readable, auto-equip and compare are understandable; double tap/reload does not duplicate spending |
| **X / Integrated L3** | Weighted **~60 → ≥82 L2 → ≥90 L3** | Real new + midgame journeys without coaching; eliminate cross-screen surprises and preserve the game's unique character charm | All L2 hard gates passed independently. ≥5 unbiased players or independent reviewers attempted the task without instructions; report actual task failures and repeat-interest qualitatively. No L3 signoff from own screenshots/tests alone |

`<500ms`, `<150ms`, `≥12px` and `>95%` are **chosen engineering targets**, not already-measured performance claims, universal platform guarantees or substitutions for aesthetic judgment. Report network/device/environment and exceptions rather than gaming numbers by hiding content. The gameplay experience, not CSS pixel counts, is the final judge.

## 4. Before/after rejection rules

A candidate **fails** if any of these is true, regardless of reported score:

1. The new Fusion screenshot looks calmer by making important controls harder to reach; a user needs more taps/reading for the same ingredient or branch decision.
2. Characters fit only because models were made tiny and stopped showing faces/weapon movements, or the artwork is replaced by static approximations.
3. The animation can be tested only with a fixed `frame` and does not actually play in a normal share/user session; eyes/hat/weapon look detached in motion.
4. Loading content arrives only after a blank full-screen surface, while browser errors still happen to be zero.
5. One missing recipe/state passes but level-gated, branch, refresh or completed result is broken or unverified.
6. Fusion rank-up changes a number but the resulting attack does not visibly differ in battle.
7. A visual score is increased without **matched real screenshots, running interaction, and an updated causal explanation**.

## 5. Decision and order of work

**Do F0 first, then F1→F2 until Fusion ≥82 AND all hard gates pass; then F3 for a separately reviewed ≥92 ambition.** Only then move to C1/C2, B1, R1, D1/G1. F0 is a prerequisite to reliable scores for untested Fusion stages, not itself a UI improvement. If a real product risk changes priority (data loss, critical blocked path), override order explicitly with evidence.

Each implementation checkpoint updates three columns in this file: **measured before → measured after / remaining defect / next corrective action**. Do not silently replace the baseline or claim this document's targets are achievements. Each phase must reach both local and public-site QA after code change, with actual wall-clock timing. Planning/documentation-only changes need no deployment.
