# idle-game-kit vendored package provenance

- Source repository: `https://github.com/kikutadev/idle-game-kit.git`
- Source commit: `721cff76241a776a2fcfff47b6503e5b9f543810`
- Package version: `0.2.0`
- Build command: `pnpm build:kit`
- Reason for vendoring: `idle-game-kit` is not yet published as an immutable registry package. Slime Mercenaries must remain independently buildable and must not depend on an adjacent dirty worktree.

Product code must import only public package entry points such as `idle-game-kit`, `idle-game-kit/web`, `idle-game-kit/react`, and `idle-game-kit/simulator`.
