# 2026-10-01 — Camp Population / Individual Continuity

Status: Complete
Scope: post-onboarding Camp population, resident readability, fusion identity continuity

## Product problem

The first slime now has a readable birth/failure/job/first-battle story, but attachment breaks once the roster grows if owned slimes disappear from the Camp presentation or become interchangeable management records.

Current concrete defect: validation can own six normal job slimes while Camp life renders at most four residents (`selectCampLifeResidents(..., 4)` plus `residents.slice(0, 4)`). Two owned companions therefore have no physical presence in the Camp.

Fusion continuity was reviewed before implementation: `fuseSlime` updates the existing `SlimeProgress` at the same persistent `slimeId`; it does not replace the instance. Temperament derived from instance ID therefore naturally survives fusion. Preserve that behavior.

## Goal

> When the player owns a six-slime party, all six can visibly exist in Camp, remain individually tappable, and retain the same identity through growth/fusion.

## Phase A — Six-resident Camp

- [x] Raise the normal Camp resident presentation cap from four to six.
- [x] Author six stable home positions rather than aliasing extra residents onto slot four.
- [x] Keep residents inside the portrait-safe Camp area at 390x844 and 430x932.
- [x] Preserve dispatch exclusion and selected-Hero exclusion.
- [x] Preserve deterministic routine offsets and temperament behavior.

Acceptance:

- validation roster with six available residents visibly renders six distinct slimes when no Hero is focused;
- no resident is permanently hidden behind another at the sampled 0/9/18/27/36/45s states;
- direct resident tap still focuses the intended persistent instance.

## Phase B — Identity continuity through growth

- [x] Add/retain a focused test proving fusion mutates the same instance ID rather than replacing it.
- [x] Verify temperament for that instance is unchanged before/after fusion.
- [x] Do not add names, affection meters, or save-schema fields for this work.

Acceptance:

- the slime the player has been watching is the same persistent instance after fusion;
- Camp temperament remains stable after form change.

## QA

1. Focused selector/layout/temperament/domain tests.
2. 390x844 validation roster Camp: screenshots at 0/9/18/27/36/45 seconds.
3. Tap at least one resident and verify focused Hero corresponds to that instance.
4. 430x932 spot check after 390x844 passes.
5. TypeScript + UI contract + relevant tests; full test/build only after the rendered acceptance passes.

## Non-goals

- showing an unlimited roster simultaneously;
- new gameplay bonuses from personality;
- petting/feeding systems;
- nickname UI;
- economy/balance changes.

## Execution result

- 390x844 Camp observed at 0/9/18/27/36/45 seconds; six residents can be simultaneously read, with crowded mode reducing ambient scale and applying stable per-slot separation only when five or more residents are present.
- 430x932 spot check passed with browser errors 0.
- Direct resident tap rechecked at 430x932: tapping the visible Wand resident focused that persistent instance and retained the sleepy temperament in line, eyes, posture and motion.
- Fusion continuity test proves the same `slimeId` remains in the roster across Fusion and therefore keeps the same deterministic Camp temperament.
