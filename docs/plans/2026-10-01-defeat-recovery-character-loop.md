# 2026-10-01 — Defeat / Recovery Character Loop

Status: Complete
Scope: frontier defeat -> Camp return -> recovery -> strengthen -> automatic retry

## Product problem

Defeat is a core loop of Slime Mercenaries, but the current player-facing result is mostly a system notice (`敗北・撤退`). When the player opens Camp after losing, the slimes themselves do not visibly carry the experience of having just been defeated.

That weakens both attachment and motivation: the player sees state management rather than companions returning from a failed expedition.

## Goal

> A frontier defeat should be readable on the slimes themselves: they return tired, recover in Camp, and then resume normal life while the game farms/rebuilds for the automatic retry.

Do not turn defeat into punishment or stop idle rewards.

## Phase A — Camp recovery reaction

- [x] Add a presentation-only `retreat` Camp reaction.
- [x] Derive it from the authoritative retry/farm state when no stronger Camp interaction reaction is active.
- [x] Ambient residents enter Camp tired: lowered posture, narrowed eyes, soft wobble; no defeat X-eyes and no corpse-like flattening.
- [x] Focused Hero also supports the recovery reaction.
- [x] Recovery settles back into the resident's normal temperament/idle after a short authored beat.

Acceptance:

- after a real defeat, entering Camp immediately shows the party as tired before they recover;
- the reaction is visibly different from sleep and battle defeat;
- idle rewards / retry simulation remain untouched.

## Phase B — Let the characters own Camp defeat feedback

- [x] Do not let the large global `敗北・撤退` notice dominate the Camp while recovery animation is visible.
- [x] Keep battle-side defeat/result presentation intact.
- [x] Other screens may keep relevant system notices.

Acceptance:

- Camp return screenshot is visually led by tired slimes, not a brown notification card;
- the player can still understand that the party lost from the battle result and recovery state.

## QA

1. Focused Camp reaction tests.
2. Use the existing real first-play/defeat browser route, not a static component fixture.
3. Capture Camp immediately after defeat, around 1s recovery, and after recovery settles.
4. Verify 390x844 first, then 430x932 spot check.
5. TypeScript / UI contract / full tests / build after rendered acceptance passes.

## Non-goals

- economy or retry-count changes;
- manual revive systems;
- injury debuffs;
- affection/stat penalties;
- new persisted recovery state;
- changing the mandatory battle defeat `べちゃ潰れ + X eyes` presentation.

## Execution result

- A visible Battle defeat is remembered in UI-session state by the observed `partyDefeated` event ID; it is not persisted into the save schema.
- 390x844 real-play capture passed: 0.45s return shows narrowed eyes / low tired posture, 1.45s transitions toward normal Camp life, and 3.4s is back to ordinary life motion.
- 430x932 spot check passed with the same tired return pose and no layout break.
- Camp suppresses the global `frontier-state` notice while the character recovery presentation owns the feedback. Battle result presentation remains unchanged.
