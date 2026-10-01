# 2026-10-02 — Combat recovery / tutorial facing / Camp UI correction

Status: Implemented and locally accepted

## Product problems

1. Stage-boundary recovery is not explicit enough. The intended rule is simple: damage/death may carry between waves of one stage, but every completed stage starts the next stage with the whole deployed party alive at full HP.
2. The opening Plain/Sword dummy comparison presents the slime partly toward the camera instead of clearly facing the dummy, which makes the authored action read incorrectly.
3. Primary actions compete with secondary controls. The player should be able to identify the next meaningful action immediately.
4. Camp management is caught between a world view and a bottom sheet. The sheet is too small for roster/strengthen/fusion/equipment decisions, while focusing the selected slime above the sheet creates an awkward split hierarchy.

## Product decisions

### Combat
- Preserve HP and defeated members only between waves within the same stage.
- On every stage completion, fully recover and revive all deployed slimes before the next stage begins.
- A defeat/restart also fully recovers the party before the replacement encounter.
- Make this an explicit encounter-transition contract rather than an incidental consequence of stage-number changes.

### Tutorial dummy
- Plain and Sword actors face the dummy (+X) during idle, anticipation, attack, impact, and settle.
- They must not present their face squarely to the camera while attacking.

### CTA hierarchy
- Tutorial states have exactly one visually dominant CTA.
- Recommended Camp progression uses one filled primary CTA; management category actions remain secondary.
- Do not use glow alone to communicate the required action; fill, size, placement and copy must agree.

### Camp management
- World-only Camp and management are separate visual modes.
- Opening management hides the large focused Camp hero and opens a near-full-height management surface.
- The management surface starts with roster selection, then selected slime summary, then recommended action / category actions.
- Do not use a small bottom sheet for roster + build decisions.
- One tap returns to the world-only Camp.

### Nursery
- Creation/job assignment is a focused task and should use an almost-full-height sheet on phone rather than a short bottom sheet.

## Execution

1. Add explicit battle encounter recovery policy and regression tests.
2. Correct Plain/Sword dummy facing.
3. Convert Camp management to a full management surface and remove focused hero while it is open.
4. Strengthen primary CTA hierarchy in first-play and Camp management.
5. Increase Nursery task surface height.
6. Run focused tests/typecheck.
7. Run 390x844 first-play and Camp management browser QA.
8. Run 430x932 secondary QA.
9. Run full tests/build/UI contract.
10. Commit, push and deploy only after rendered acceptance.

## Acceptance

- Wave 1 -> Wave 2 preserves damage/death.
- Stage N final encounter -> Stage N+1 starts every party member alive at max HP.
- Same-stage farm clear/restart that represents a completed stage also fully recovers the party.
- Both dummy actors visibly face the wooden dummy.
- At every first-play stop, one action is unmistakably primary.
- Camp management occupies enough vertical space to read roster, selected slime and actions without a tiny scrolling sheet.
- No enlarged selected slime remains floating above management.
- 390x844 and 430x932 have no clipping/overlap and no game-origin browser errors.

## Local acceptance result

- 390x844 first-play/Camp management browser QA: PASS, browser errors 0.
- 430x932 secondary browser QA: PASS, browser errors 0.
- TypeScript: PASS.
- UI production contract: PASS.
- Full suite: 82 files / 492 tests PASS.
- Production build and initial bundle guard: PASS.
- Plain and Sword dummy attacks visually face the dummy rather than the camera.
- Camp management is a full-height task surface with no focused 3D hero above it.
- One filled recommended CTA is shown above secondary Camp build actions.
