# Tier-3 Rogue production motion — done

## Scope

Owned files only:

- `src/game/slime-motions/tier3/rogue.ts`
- `src/game/slime-motions/tier3/rogue.test.ts`
- `.tmp/tier3-motion-workers/rogue-done.md`

No BattleRuntime, GalleryStage, gallery definition, other family, main-branch, or deploy changes.

## Ninja

- authored low squash -> smoke vanish -> three afterimage row passes
- exposes real-body alpha, dash path progress, per-pass pulse/index, speed-line and afterimage envelopes
- reappears before damage-resolution VFX
- resolves four tightly staggered delayed slash-line pulses after return
- returns body/equipment/VFX to stable endpoint

## Assassin

- authored unusually still low stance before launch
- exposes instant back-side relocation progress with a very short visibility dip
- crossing dual slash converges on a compact impact flash
- exposes a strong held hit-stop contract
- delayed red-purple execution-line envelope lands after hit-stop
- intentionally uses fewer VFX channels than Ninja; timing/contrast provide the identity
- returns body/equipment/VFX to stable endpoint

## Validation

- `pnpm --config.verify-deps-before-run=false exec vitest run src/game/slime-motions/tier3/rogue.test.ts` — 7/7 passed
- `pnpm --config.verify-deps-before-run=false typecheck` — passed
- pnpm auto dependency verification was disabled because this isolated worktree's untracked `node_modules` resolves to the main repo and pnpm correctly refuses to purge/install through an external modules-dir symlink.
- Vitest used an isolated temporary directory inside the worktree because the sandbox cannot create its default `/tmp/x9-*/ssr` directory.
