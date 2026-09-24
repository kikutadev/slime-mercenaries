# Live Combat Authority + Regression Coverage

Status: Implemented
Date: 2026-09-23

## Goal

Remove the remaining dual-authority behavior where analytical Domain combat pre-decides a visible battle result and BattleRuntime is forced to conform.

When the Battle screen is active:

- individual rendered units determine victory/defeat from their own HP and attacks;
- Domain time may advance analytical work for handoff continuity, but it must not resolve the encounter, grant rewards, retreat, or advance wave/stage before the rendered result;
- BattleRuntime reports one completed encounter result to Domain;
- Domain validates the encounter identity and performs the durable progression/reward transition exactly once.

When Battle is not active or the app is offline/backgrounded, existing analytical combat remains the fast authoritative path.

## Regression contracts

1. An observed live encounter is never resolved by wall-clock analysis before BattleRuntime reports a result.
2. A live victory grants its encounter rewards exactly once and advances exactly one encounter.
3. A stale/double result is rejected and cannot duplicate rewards.
4. A live defeat retreats/restarts through Domain without bulk HP mutation in presentation.
5. Runtime victory/defeat is based only on individual unit HP/defeat state, not a pre-authored result.
6. A finished runtime never locally respawns the same encounter while waiting for Domain handoff.
7. Live encounter ordering, terminal world boundary, reward targeting, and per-enemy HP remain covered by focused tests.
8. Background/offline analytical progression keeps working and existing live/offline deterministic tests remain green.

## Implementation

- add a Domain defer-resolution policy for active rendered combat;
- add stable combat encounter identity and a Domain command to accept one rendered result;
- controller tracks whether the Battle surface is active and applies defer-resolution only to visible live ticks;
- BattleScreen reports a result once per encounter;
- remove authoritative result/deadline fields and lethal-damage guards from BattleRuntime;
- remove local result reset/replay;
- replace obsolete timing/result tests with live-resolution boundary tests.

## Completion

Implemented on 2026-09-23.

Verification:
- focused live-authority regression set: 46 tests passed;
- full suite: 65 test files / 416 tests passed;
- TypeScript typecheck passed;
- UI production contract passed;
- production Vite build passed;
- browser QA automation was attempted with dedicated Chrome for Testing but the local headless run stalled before producing evidence, so rendered interaction is not claimed as verified.
