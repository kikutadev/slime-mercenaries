# Development

Status: Current

## Validation build

`VITE_VALIDATION_MODE` gates internal QA shortcuts only. The player-facing Settings screen owns the runtime economy choice: Normal uses authored resources, while Development presents Gold/materials as `∞` without persisting the artificial resource floor.

Validation shortcuts such as full-roster preparation, direct level setup, and battle reset are hidden from the normal product UI. Development mode must be active, then open the game with:

```text
?validation-tools=1
```

to expose those controls for internal or headless QA.

Do not make debug/validation controls part of the normal presentation merely because Development economy mode is available.

## UI acceptance

For presentation changes, validate the production build at the target portrait viewport rather than accepting from component code alone.

Minimum checks:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- 390×844 browser flow with console/page errors = 0
- motion sequences reviewed across multiple frames for Battle, Fusion, Dispatch, and Forge
- Settings/save changes: `NODE_PATH=../../node_modules node tools/qa/verify-settings-save.cjs` against a local production preview
