# Slime Mercenaries — product-level-plus UI/UX execution plan

Date: 2026-10-14
Status: **Active — new governing UI improvement plan; implementation not yet started**
Scope: Mobile portrait gameplay interaction, UI composition, GLB presentation, character/reward feedback, and actual-speed acceptance. Domain combat/progression authority remains unchanged unless a UI goal demonstrably requires a narrow change.

## Current quantified baseline and binding acceptance (2026-10-15)

**Measured/reviewer-scored current UI is approximately 60/100, not L2 production quality.** Fusion is ~45/100, Strengthen ~50/100, Battle ~68/100. See the [current scorecard, scoring anchors, observed deficits, exact acceptance states and per-phase target gains](2026-10-15-ui-quality-scorecard.md). This linked scorecard is authoritative for baseline evidence and the next release gates; L2 and L3 are not declarations that a clean build alone can earn. Unverified Fusion ready/merge/branch/result paths are explicitly unaccepted until live evidence exists.

## 1. Goal and why prior signoffs were insufficient

> The game should make a player **enjoy watching slimes, want to fuse them, experience a real difference after progressing, and want to retry after losing**. UI is the delivery mechanism, not the goal.

Prior documents (`2026-09-19-ui-production-quality.md`, `2026-09-23-interaction-production-completion.md`, `2026-10-13-mobile-ui-layout-production.md`) made real improvements, but repeatedly treated 'feature works / pass tests / no clipped text / page renders' as production acceptance. Actual subsequent defects (X eyes detached on defeat; shared gallery URL frozen by QA parameter) prove this was inadequate. The earlier plans remain history of completed passes; **their follow-on UI quality work is governed by this plan**. Do not falsely revise their recorded test results as if unrun tests had passed.

Product-specific non-negotiables: portrait low 3/4 battle, auto-progress then lose/retreat one stage/earn/fuse/retry, continued idle rewards after defeat, same-size slime body across tiers, both reserve and battle same-type instances, no separate promotion mechanic, GLB model/physical animation rather than text-only feedback, cute faces and body-attached X eyes on defeat. Battle should remain worth watching, Camp a lived-in place, Fusion the signature climax.

## 2. Two separate quality bars

### A. L2 — shippable commercial-product baseline (minimum, not the goal)

**Every representative journey must satisfy all of the following**:

1. **Comprehension**: From the actual rendered state and normal game cues, a new player can tell what is happening, what is actionable, what it costs, and why unavailable without external instruction. One obvious primary intent, without hiding genuinely frequent actions.
2. **Visual hierarchy**: Hero character/object and consequential choices dominate. No clipped character face/weapon, offscreen text, empty intermediary screen, tiny unreadable item/source labels, stray overlay, truncated critical numbers, or unrelated chrome competing with the action on supported phone sizes.
3. **Touch and navigation**: Primary touch controls normally meet the 44 CSS-px target, meaningful press acknowledgment starts promptly (target <150 ms, not a claim about all devices), back/next paths keep current target and context. No double-submit, dead ends, deceptive disabled buttons, unexpected extra sheets, or mandatory repetitive confirmation.
4. **Causality and motion**: User action visibly causes an in-world reaction before the result is presented, and the object actually moves. Anticipation/impact/recovery, face/gear attachment, and result hold are credible at real speed. Loading uses meaningful immediately available content; never a bare gradient. Reduced-motion users receive legible static result, not missing information.
5. **State and reliability**: New/empty/locked/missing/ready/in progress/success/return states are designed. Durable commands execute once; refresh/leave/revisit does not corrupt or misleadingly undo game state; auto battle/idle continue as specified. Page/asset/console errors from game remain zero in acceptance journeys.
6. **Consistency**: The same concepts (primary vs secondary action, ready vs locked, resource ownership, back navigation, selected slime) behave predictably across Camp, Fusion, Forge and Dispatch; no developer/test details leak into normal UI.

A functioning build, unit-test PASS, a screenshot, or a polished mock is **not** sufficient evidence for any of the above. A serious L2 failure blocks release acceptance even if tests pass.

### B. L3 — clearly better than the commercial baseline (actual target)

All L2 gates must pass, **plus** there must be a visible *game-specific* gain at each core loop:

- **Attachment**: Slime faces and temperament are readable while idle, moving, losing, recovering, and working. Camp feels alive without opening menus. The player recognizes an individual, not just an interchangeable stat icon.
- **Anticipation**: The next fusion result has a compelling, legible *visual and behavioral* promise, including the choice when evolutions branch. Missing materials become a desirable next trip, not a list of chores.
- **Payoff**: The before/after silhouette and attack rhythm differ materially, without scaling the slime larger. The merge is authored: two bodies approach, contact/flash, new form settles, new move is previewed on request. Result is held until the player decides to move on.
- **Motivation**: A loss and the offline/return report point naturally to *why the player might want to strengthen/fuse/retry*. No mandatory loot collection or progress freeze. Normal non-upgrade taps remain calm while milestones feel special.
- **Delight without friction**: Small character reactions, sound/VFX/camera and timing make repeated interaction satisfying rather than slowing repeat users down. Users should want to watch **one more** fusion/attack/retry, not simply complete a prescribed checklist.

Operational L3 evaluation: perform a realistic no-coaching play attempt from a clean save and a middle-game save. A reviewer who is **not told the design intent** should be able to explain the loop (why it lost, what to do next, how the next form differs). For the signature Fusion, a second independent human review (or an explicitly labeled independent review with available evidence) must see an obvious improvement in excitement/identity over the baseline, not merely better spacing. Record counter-evidence and disagreements; if no real external players are available, do not claim validated player delight.

Optional shorthand: L1 ≈ working prototype; L2 ≈ 80–85/100 mature product; L3 ≈ 90+ *experiential ambition*, **not** a formula, testing score, or auto-acceptance threshold.

## 3. Benchmarks and appropriate transfer

References for **pattern-level comparison**, not visual copying:

- [*Legend of Slime*](https://apps.apple.com/us/app/legend-of-slime-idle-rpg/id1618701110) (official App Store): idle combat / upgrade / repeat excitement. Compare **readability of continuing progress and anticipation of the next upgrade**. Do not borrow monetization, reward pressure, overloaded indicators, or unrelated endgame systems.
- [*Cats & Soup*](https://apps.apple.com/us/app/cats-soup-relaxing-cozy-games/id1581431235) (official App Store): **pleasant character activity in a living environment** while the player is not tapping. Do not borrow kitchen UI, currencies, or a passive-only main loop.
- The game's own existing 3D slime, world and fusion choreography: **identity, size invariance, cute readable faces, authored job signature attacks** are more authoritative than either reference's art style.

**Benchmark gate before design approval**: save a small set of actual *rendered, legally accessed* comparison screenshots/video or directly observed interactions, record which concrete behaviors were observed versus inferred from store descriptions, and note task/interaction differences. Do not claim direct UX evidence from promotional store copy alone. A proposed layout must be better for *Slime Mercenaries' exact task*, not simply look more similar to a popular game.

## 4. 2026-10-14 review baseline (live production evidence)

Source HEAD: `61fc5db`, clean `main`; live host `https://games.kikuta.dev/slime-mercenaries/`.

Observed on 2026-10-14 using actual headless Chrome for Testing:

- First-play 390×844: 15 screenshots / 7 assertions, no game JS/HTTP errors, 39.31s. First-play 430×932: same, 37.31s. **This proves scripted flow only, not L2/L3.**
- 390×844 Fusion: both large slime models/weapon extend past the left and right viewport edges; three fixed-width recipe columns contain visually crowded/wrapped labels and tiny source affordances. The main `素材不足` button is disabled rather than offering a strong next action.
- 430×932 Fusion: at ~0.8s after opening the screen is a **blank dark gradient**; ~4.6s after opening the full stage is visible (separate late-capture QA 40.73s). This is temporary first-load emptiness, not a confirmed infinite hang. Suspense fallback in `SlimesScreen.module.css` is a gradient with no useful controls or status.
- Camp management 390×844/430×932: a tiny roster at top, duplicate selected-individual summary, actions in disconnected blocks, substantial dead lower space; the character/game world is absent while the management surface is open. The visual design is legible but dashboard-like.
- Training: the selected slime sits isolated in oversized vertical space; three upgrade buttons are disabled when G is insufficient, yet there is no direct next step or clear *what became stronger* comparison.
- Formation: the six slots are clearer than before but the selected-member strip above and slot area leave a large gap; must test with a full 6-slot and long reserve roster, not just one member.
- Battle: world scene is present, but report peek still occupies a lower right floating HUD position and full impact of returns/next upgrade may be too subtle; needs observed long-session review, not assumed broken.
- Dispatch and Forge: recognizable physical 3D places and existing empty-state next actions. **Preserve these strengths**; do not redesign just to create work.

Concrete mechanisms to inspect: `src/components/fusion/FusionWorkbench.tsx`, `.module.css`, `FusionStage.tsx`, `useFusionWorkbenchInteraction.ts`; `src/screens/SlimesScreen.tsx`, `CampManagementLayout.module.css`, `CampTrainPanel.tsx`, `CampRosterStrip.tsx`; `src/app/AppReportSheets.tsx`, `src/screens/BattleScreen.tsx`.

## 5. Execution — ordered by player-value gain, with release gates

### Phase 0: Baseline and design prototype approval (do first)

Deliver:

1. Reproduce and preserve **a matched baseline recording** (not only snapshots) for: new sword/slime, first missing Fusion recipe, enough materials and level, Tier branch decision, two-body merge, form reveal, attack preview, failure/return, post-fusion real Battle. Use isolated development save/fixtures, never mutate the user's normal mode save.
2. Capture first-paint/meaningful-content timing, UI bounds, control reach and text legibility at 375×667, 390×844, 430×932. Confirm iOS Safari safe-area and touch behavior on device when possible; browser emulation is not equivalent to an actual iPhone.
3. Check strongest comparable published layouts **as observed examples**, logging what specifically transfers and what does not.
4. Draft one candidate composition/storyboard for *missing*, *ready*, *merging*, *reveal*, *complete* and one alternative. Evaluate against actual baseline; reject changes whose only benefit is fewer cards or more ornament.

Gate: reviewer can state the observed defect, exact desired experience, before/after friction and trade-off. No implementation based on unverifiable 'looks cleaner' alone.

### Phase 1: Fusion usability and layout (P0, minimum commercial bar)

Goal: all Fusion states are immediately understandable and comfortably usable, and two character faces and weapons stay in frame.

Tasks:

- Replace fixed-width 3-column recipe `grid-template-columns: repeat(3, 1fr)` with readable adaptive *item rows* or clearly structured groups. Present what is owned/required/missing, full names and a single actionable source route; if all ready, use one obvious primary `合成する`.
- Replace ineffective disabled-only dead end with the most relevant next trip (Battle, Recruit, level) without obscuring the complete recipe. Lock state explanation must say *which gate is missing*; do not promise unavailable actions.
- Preserve branch selection with concrete distinct **post-fusion form + attack preview**. The selected branch and its outcome must remain visually paired; avoid ambiguous equal-emphasis option cards.
- Fix first Fusion loading: while GLB/web chunks warm, keep readable heading, recipe/action surface and a lightweight authored character placeholder; no 0.8s+ blank full-screen gradient. Prefer preloading from Camp, but content must still work under cold-network failure.
- Correct `FusionStage` camera / object anchors (currently `BASE_SCALE=0.46`, `LEFT_X=±0.82`) using **actual model bounds and the phone viewport**, not arbitrary shrinking alone. Capture weapon extremes and camera perspective for short/tall aspect ratios. Never alter combat model's permanent body size.
- Keep app navigation and recipe visible only when actually useful; during cinematic, clear obstruction and prevent double commit. Back returns to management, not unrelated Camp origin.

Exit evidence: a player can understand target/requirements/next action within the visible viewport, all source routes work, no clipping or tiny illegible tap areas at the three viewports, and cold-open never exposes an empty meaningless screen. Run test for first missing ingredient, all missing, level locked, ready, branch choice, repeated open/back, refresh and busy-state double tap. **No acceptance from DOM tests alone.**

### Phase 2: Fusion's signature payoff (L3 differentiator)

Goal: 'I want to evolve this slime and see what it can do' is a visible, repeatable product advantage.

Tasks:

- Stage two real GLB characters as distinct, fully visible actors: prepare -> anticipation -> approach -> physical contact -> clear single flash -> recognizable new silhouette -> settle/reaction. No disconnected face/gear, no VFX that hides the important moment.
- Keep *major-form* choreography demonstrably more complex than ordinary rank-up; visual escalation across Tier1 / Tier2 / Tier3 through beats and newly authored attack signatures, not arbitrary increases in body size/particle scale.
- After reveal, allow a deliberate **user-held inspection**. `新しい攻撃を見る` plays one meaningful authored full motion at real speed; allow replay. Then retain `キャンプで見る` and `戦闘で試す` until the player chooses. Never auto-navigate.
- Give a clear before/after comparison that communicates **what changed in combat** and allows the player to recognize it immediately in the actual Battle scene. Do not create a separate system of power scores merely for the presentation.
- Motion timing may provide excitement but must not delay routine subsequent fusions or become a compulsory tutorial. Respect reduced-motion without hiding the new ability/result.

Exit evidence: film the entire important Fusion from user tap to first resulting battle hit at actual speed. Inspect contact/expressions/weapon/VFX in intermediate frames, compare to baseline and benchmark patterns. Visually distinguish at least one ordinary rank-up, first Greatsword form, and two different Tier-3 branching outcomes. Reviewer can describe the unique new attack without reading explanatory UI.

### Phase 3: Camp selection and strengthening (L2 then L3)

Goal: retain the *living Camp* on ordinary entry; make management effective even with many duplicate/job slimes.

Tasks:

- Replace the top-only linear roster and detached duplicated status with a coherent selection/management workspace. Use in-context selection and compact grouping by meaningful assignment/role when roster scales, **without merging instances** or hiding a useful duplicate.
- For Train, place selected actor and +1/+10/MAX within a legible spatial relationship. Show affordable results, post-upgrade gains in the relevant battle metrics/behavior, or an explicit reason and nearest way to obtain resources. Do not occupy the entire screen with a static portrait and disabled buttons.
- Keep Formation front/back slots, reserve transition, swap/replace semantics and dispatch ownership authoritative; make changing the selected individual faster, not harder. Maintain the established one-level back route to menu and then Camp.
- Reward a real upgrade with tactile slime reaction, not merely a toast; avoid adding management forms atop the living world unnecessarily.

Exit evidence: player can switch among 30 separate instances, strengthen one and inspect its changed combat capability, return to roster, swap/dispatch reserve member and still recognize which individual is selected. Include overflow and long names, low/no gold and all-6-slots-full conditions.

### Phase 4: Make defeat and returns produce a next desire (L3)

Goal: in the actual defeat/retreat/idle-return loop, player naturally understands what to improve and wants to try again.

Tasks:

- Observe longer-session crowded 6-character battle; ensure boss/HP/attacks dominate report bubbles and peripheral UI.
- Loss -> prior-stage retreat -> earn while farming -> upgrade opportunity must read as a single causal sequence. Report progress/reward/next realistic opportunity without administrative burden or mandatory collection.
- Provide a direct route to *relevant* Train/Fusion when actionable, rather than a generic explanation. No separate promotion system or forced manual recovery.
- Distinguish normal steady loot from a form-changing milestone; keep the game enjoyable when simply watched.

Exit evidence: first defeat and midgame loss → Camp → meaningful upgrade or ingredient plan → Battle retry can be explained by an uninstructed reviewer, with sustained auto-combat in all other tabs.

### Phase 5: Cross-screen quality and independent product signoff

- Preserve Dispatch map and Forge mechanical staging; improve only **observed** state/feedback/navigation gaps (send/return, draw/result/compare/equip). Do not reimplement solved controls.
- Inspect consistency, safe areas, touch gestures, small and tall phones, accessibility settings, animation correctness (including death eyes), scroll clipping, popover/sheet hierarchy, public asset loading and save integrity.
- Complete **all L2 gates**, then perform a separate blind L3 experience review. Record dissatisfaction and rework remaining problems, rather than declare 'production' after passing unit tests.

## 6. Acceptance methodology (specifically addresses previous false positives)

**Verify the whole action loop**: intent → press → immediate response → physical causality → result → new desire → revisit/refresh. Each phase has screenshots *and* continuous actual-speed video at significant transitions. A page being mounted, a model being loaded, and a unit test passing are necessary checks, not player experience proof.

Baseline scenarios (capture screenshots only at meaningful beats, avoiding a pointless large matrix):

| Scenario | Must answer | Typical blocker |
| --- | --- | --- |
| New user, first Sword | Is the same small slime growing through failure? | Tutorial becomes a form walkthrough |
| Fusion lacking all ingredients | Can I see what is missing and how to obtain it? | Disabled button + tiny links |
| Fusion level locked / one item missing | Is one next step obvious and reachable? | Conflicting gates or dead end |
| Fusion ready + branch | What will I get, and what does my choice change? | Name-only branch, unreadable options |
| Merge -> contact -> result -> preview | Are faces, gear, and new attack readable? | Crop/overlap/fast auto-advance |
| Reopen/refresh during Fusion | Does the durable result remain true and understandable? | Double-commit/incomplete stuck state |
| 30 slime roster / six-slot formation | Can I find the right distinct instance and place it? | Unmanageable horizontal strip |
| Losing then strengthening/retrying | Does defeat create a meaningful next choice? | Passive result and arbitrary navigation |
| Idle return / forge / dispatch | Does the game keep moving, rewards accumulate, and actions remain reachable? | Competing overlays, mandatory collection |

Environments: Chrome for Testing headless at **375×667 / 390×844 / 430×932**, regular-speed playback, minimum one real iPhone Safari pass before final L3 signoff when available. Separate test-data contexts; no normal user save manipulation. For loading, test cold cache and warm cache; record measured first-action feedback and meaningful-content timing instead of assuming speed. For freeze/death/motion, compare actual visual frames and geometry attachment, not only runtime logs.

For every release phase:

1. **Before change**: preserve one failing/weak actual screenshot or journey and a concise user-cost hypothesis.
2. **Implementation**: change smallest relevant component/animation group, retaining current authoritative Domain and proven workflows.
3. **Independent visual critique**: inspect the real screen, especially where the player would hesitate or feel disappointed; identify at least one weakness after the first candidate and rework it if observed. Do not assert a score without independent evidence.
4. **Behavior correctness**: targeted tests and UI contracts, TypeScript/build/bundle, then real browser tap, full animation and refresh at representative transitions. Report verification wall-clock times.
5. **Product gate**: L2 blockers zero; if L3 emotional/identity goal not supported, report it as **not yet achieved**, do not rename L2 success as L3. User reviews the actual deployed scene before signoff when appropriate.
6. **Release**: commit, integrate cleanly, deploy, re-run public smoke/video and verify served asset version. Do not declare deployed from Git push alone.

Stop/redirect if the design requires a long explanation to justify a confusing UI, if the character is lost behind cards, if a flashy effect hides what changes, if visual capture contradicts test success, or if a change increases total tap/reading effort without clear player benefit.

## 7. Sequencing and current decision

**Immediate next implementation: Phase 0 -> Phase 1, Fusion only.** This is the highest-value loop and has witnessed user-facing L2 defects. Phase 2 follows directly once Fusion's base usability passes. The Camp, Battle and remaining systems follow in that order. Do not split focus across screens or start with CSS-only cosmetic cleanup; the unit of work is a meaningful player journey.

Implementation is **not** part of this planning-only revision. This document makes the acceptance standard and sequence authoritative for subsequent changes. No deployment claim until changes exist and the public domain is verified.
