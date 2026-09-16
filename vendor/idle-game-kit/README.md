# idle-game-kit

`idle-game-kit` is a TypeScript idle-game foundation built around one rule: **the production game and the balance simulator use the same Domain logic**.

The repository contains the reusable kit plus multiple product-owned Reference Products under `games/`. Game-specific world rules, UI, assets, tests, balance policy, PWA shell and release details stay inside each game's directory; reusable contracts stay under `src/`, `simulator/`, and root `docs/`.

## What the kit provides

- Arbitrary-size `GameNumber` economy values and canonical serialization
- Currency transactions, stackable producers, instance characters, levels, curves, conditions, and modifiers
- Active gain, continuous activities, and timed activities
- Deterministic named RNG streams and gacha rules
- Rewards, tokens, achievements, titles, boosts, calendar rewards, and prestige
- Rewarded-offer rules separated from provider availability, plus provider-neutral rewarded-ad orchestration
- Optional non-consumable purchase/entitlement contract with idempotent restore and provider completion ordering
- Platform-neutral save/export/import contracts
- Web adapters for IndexedDB, persistent storage, browser ads, Google Publisher Tag, PWA service workers, and deployment-base-aware assets
- Same-core simulation, wait/no-action analysis, wall detection, and reusable balance targets
- Optional React presentation helpers: store binding, semantic progress/dialog/attention/async-action primitives, transient presentation queue, and reduced-motion-aware motion presets

Daily / Weekly Mission is a reusable Kit capability with period-local counter/state objectives, manual/auto claims, point milestones, and definition validation; Grimoire Rewrite is the first product intended to consume it.

## Boundary model

```text
Domain Core
  pure rules, state transitions, rates, rewards, time advancement

Application
  store, persistence contracts, save transfer, provider-neutral orchestration

Platform adapters
  IndexedDB, browser lifecycle, PWA, ad providers, file/browser integration

Reference Products
  games/<game>/definitions, plugin, selectors, simulator policy, web UI,
  docs, assets, public shell, tests
```

A game may prove or motivate a reusable capability, but its names, world concepts, screens, art, balance values, and release configuration do not become Kit defaults.

## Reference Products

### Adventurer Guild

The first completed reference product. It primarily exercises continuous activities, direct allocation, roster growth, offline progression, gacha/limit-break, prestige, persistence, ads, PWA behavior, and same-core balance simulation.

Canonical product documentation and all product-owned resources live under:

- `games/adventurer-guild/`
- `games/adventurer-guild/docs/README.md`

### Grimoire Rewrite

The second reference product is developed as a separate repository. It primarily exercises always-on combat, immediate three-axis upgrades, Grimoire collection/Merge, three-slot loadout, restoration reveals, serial story progression, missions, and permanent forward progression without Prestige.

Canonical product documentation lives in the sibling repository:

- `../grimoire-rewrite/`
- `../grimoire-rewrite/docs/README.md`

## Public kit entrypoints

The source boundary is intentionally explicit:

- `src/index.ts` — platform-neutral Domain/Application API
- `simulator/index.ts` — same-core simulator API
- `src/platform/web/index.ts` — optional browser-only adapters
- `src/platform/cloudflare/index.ts` — optional Cloudflare-oriented shared-data adapters
- `src/react/index.ts` — optional React binding and unstyled semantic UI primitives

`pnpm build:kit` bundles those same boundaries into `dist-kit/` with these imports:

```ts
import { GameNumber, advanceContinuousActivity } from 'idle-game-kit';
import { runSimulation } from 'idle-game-kit/simulator';
import { FakeAdAdapter } from 'idle-game-kit/web';
import { CloudflarePublicPlayerDirectory } from 'idle-game-kit/cloudflare';
import { Motion, ProgressBar, useApplicationStore } from 'idle-game-kit/react';
```

The generated package contains ESM bundles, TypeScript declarations and README only. Reference Product assets, manifests, CSS and world-specific implementation are excluded. `pnpm test:package` verifies the packed kit from an isolated Mining Outpost consumer.

## Development

Requirements:

- Node.js 22+
- pnpm 11.25.0

Install and run the current default web reference target:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Verification:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:package
pnpm build
```

The current root `vite.config.ts` selects Adventurer Guild as the default development/build target while its entrypoint and `public/` resources remain physically owned by `games/adventurer-guild/`. `pnpm build:kit` is independent of that Reference Product target.

## Web / platform contracts

- IndexedDB is authoritative for Web player state.
- Cache Storage / Service Worker owns application assets only.
- Offline elapsed time advances through the same game-time logic used by live play.
- Export/import validates before replacing current state.
- Provider-unavailable ads must never block normal game progression.
- Production and simulator use the same Domain calculations.

Product-specific PWA metadata, deployment targets, screenshots, balance targets and release versions belong to the relevant `games/<game>/` documentation.

## Documentation

- `docs/SPEC.md` — reusable Kit contract
- `docs/CONCEPT.md` — Kit design intent
- `docs/README.md` — authority map
- `docs/adr/` — Kit-wide durable rationale
- `games/<game>/docs/` — Reference Product current truth

The next Kit change should come from a concrete consumer need, provider/deployment constraint, or observed product problem—not from adding systems for completeness alone.


## Cloudflare infrastructure baseline

Kit-backed Web products are solo-first: the local save remains authoritative and remote shared-data features are optional. For new Cloudflare deployments, prefer Workers + Static Assets, Workers API routes, and D1 for public/queryable relational data. See `docs/adr/0007-solo-first-cloudflare-public-directory.md` and `infrastructure/cloudflare/README.md`.
