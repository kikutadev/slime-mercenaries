# Stage Environment Production Roadmap

Status: Production complete — 8 Area kits / 40 Stage layouts publicly verified
Date: 2026-09-21

## Goal

敵キャラクターだけでなく、戦闘画面だけを見ても「どのAreaの、どの深度まで進んだか」が分かる状態にする。

40個の独立背景を作るのではなく、**1 Area = 1 environment kit + Stage 1–5 layout** とする。

## Product rules

- combat clear zone（中央の味方/敵戦闘帯）をpropで遮らない
- Areaごとに色ではなく大型シルエットでも判別できる
- Stage 1 → 5で「入口 → 奥地 → Boss地点」が景色から伝わる
- Stage 5は小物密度を上げるのではなく、専用landmarkを一つ主役にする
- wave / victory marchの移動感は scenery scrollで維持する
- 遠景・中景・近景は異なる移動量を持たせ、浅い3/4俯瞰でも奥行きを作る
- battle readabilityを優先し、active charactersより環境を高彩度/高コントラストにしない

## Architecture

Runtime environment key:
- `areaId`
- `stageNumber`
- `waveIndex`

Authored assets:
`public/assets/environments/<area>-kit.glb`

Each kit owns named reusable roots such as:
- `Prop_*`
- `Landmark_*`

Runtime owns:
- ground / road / fog / lighting
- Stage 1–5 placement layout
- prop cloning
- near/mid/far scroll factors
- combat-clear-zone assertions

Blender owns:
- prop silhouette
- material grammar
- local pivot/origin
- kit export

## Production order

1. Runtimeを `stageNumber` 単独判定から `areaId + stageNumber` へ変更
2. 未使用のenvironment presentation二重系を整理
3. Area 2 Mushroom Forestをvertical sliceとして完成
4. Area 2でBlender kit / Stage 1–5 / scroll / QA gateを確立
5. Area 1を同方式へ移植
6. Area 3–8を順次production化
7. 8 Area × 5 Stage = 40状態をportrait battle cameraでcaptureして最終比較

## Area 2 — Mushroom Forest contract

Palette:
- teal/dark green floor
- cream-to-muted-violet path
- coral/orange mushroom accents
- soft purple shadow/fog

Required prop families:
- small mushroom cluster
- broad-cap mushroom
- fern tuft
- thick exposed root / root arch
- stump
- fallen log
- controlled glow mushroom
- deep-forest trunk/canopy mass

Boss landmark:
- giant hollow tree + giant mushroom shelf

Stage progression:
1. Forest entrance — sparse mushrooms / open road
2. Fungal path — mushroom clusters become dominant
3. Root grove — exposed roots / stump / tighter corridor
4. Glow hollow — darker fog / controlled glow mushrooms / deeper trees
5. Great Mushroom hollow — one large hollow-tree landmark and broad shelf silhouette

## Area 2 acceptance

- Blender-generated kit loads with all required named roots
- Stage 1–5 have distinct placement signatures
- no near/mid prop intrudes into the central combat clear zone
- Stage 5 owns the boss landmark and no other stage does
- all stages preserve character readability at the production battle camera
- scenery scroll remains bounded under long victory-march travel
- stage/wave changes do not trigger unnecessary GLB reload inside the same stage
- targeted tests / typecheck / production build pass
- 5-stage headless portrait captures inspected at 1x

## Implementation progress — 2026-09-21

- [x] `BattleSceneModel.areaId` is propagated into `BattleRuntimeOptions` and encounter updates
- [x] environment selection now uses `areaId + stageNumber + waveIndex`
- [x] old Clover-only procedural runtime and unused parallel environment-presentation path removed
- [x] one reusable Blender kit authored for each of all 8 Areas
- [x] all 8 kits pass required-root / origin / landmark / mobile-mesh-budget validation
- [x] Area 1 Clover Road migrated from the old monolithic battlefield asset to the reusable-kit path
- [x] Areas 2–8 own distinct palettes, prop vocabularies, stage names, and Boss landmarks
- [x] all 8 Areas have five distinct Stage 1–5 layout signatures
- [x] all Stage 1–4 layouts exclude `Landmark_*`; every Stage 5 owns exactly one landmark
- [x] near/mid prop placement has an executable combat-clear-zone gate
- [x] scenery is split into near / mid / far layers with 1.00 / 0.62 / 0.18 travel factors
- [x] long victory-march travel is wrapped and bounded for every parallax layer
- [x] same-stage wave transitions change scenery phase without rebuilding the environment GLB
- [x] Area/Stage environment replacement is prepared off-screen and activated atomically
- [x] production environment Gallery added with Area and Stage switching
- [x] headless production-camera capture passes: **8 Areas × 5 Stages = 40 frames**
- [x] all **40 frame hashes are unique**
- [x] adjacent Stage visual-delta gate passes for every Area
- [x] local environment Gallery capture reports no browser/page/resource errors
- [x] full Vitest gate passes: **58 files / 365 tests**
- [x] TypeScript typecheck passes
- [x] production build passes
- [x] production deploy to `games.kikuta.dev`
- [x] public **8/8 kit SHA-256 hashes** match committed local artifacts byte-for-byte
- [x] public **8 Areas × 5 Stages = 40-frame** Gallery recapture passes with 40 unique hashes and no browser/page/resource errors
- [x] deployment Worker version: `99fddc71-62e7-49ad-ba20-c4497944ccdb`

### Generated kits

| Area | Kit | Reusable roots | Meshes | Stage 5 landmark |
| --- | --- | ---: | ---: | --- |
| Clover Road | `clover-road-kit.glb` | 8 | 38 | `Landmark_CloverGate` |
| Mushroom Forest | `mushroom-forest-kit.glb` | 9 | 39 | `Landmark_HollowTree` |
| Amber Mine | `amber-mine-kit.glb` | 8 | 39 | `Landmark_AmberVein` |
| Sunken Marsh | `sunken-marsh-kit.glb` | 8 | 36 | `Landmark_SunkenGate` |
| Frost Ruins | `frost-ruins-kit.glb` | 8 | 32 | `Landmark_FrozenTempleGate` |
| Ember Canyon | `ember-canyon-kit.glb` | 8 | 40 | `Landmark_LavaFall` |
| Moonlit Castle | `moonlit-castle-kit.glb` | 8 | 34 | `Landmark_MoonCrownGate` |
| Dragon Crater | `dragon-crater-kit.glb` | 8 | 33 | `Landmark_StarAltar` |

The environment-kit asset sizes remain bounded for mobile delivery: the current eight GLBs are approximately **176–292 KiB each**.
