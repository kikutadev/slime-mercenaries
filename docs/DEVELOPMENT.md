# Development

Status: Current

## Validation build

The current public validation build may keep `VITE_VALIDATION_MODE` enabled so Gold and authored validation tokens remain effectively unlimited. That economy policy is separate from validation-only UI shortcuts.

Validation shortcuts such as full-roster preparation, direct level setup, and battle reset are hidden from the normal product UI. Open the game with:

```text
?validation-tools=1
```

to expose those controls for internal or headless QA.

Do not make debug/validation controls part of the normal presentation merely because the public economy is in validation mode.

## UI acceptance

For presentation changes, validate the production build at the target portrait viewport rather than accepting from component code alone.

Minimum checks:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- 390×844 browser flow with console/page errors = 0
- motion sequences reviewed across multiple frames for Battle, Fusion, Dispatch, and Forge
