# Modular Enemy Asset Builder

Enemy GLBs are generated from family-level shared bodies plus per-form definitions.

```text
family body grammar + per-form definition -> standalone GLB
```

The first family is `Mushroom`. Do not copy the family body into each enemy definition.

## Stable runtime nodes

Every mushroom export contains:

- `EnemyRoot`
- `BodyRoot`
- `Stem`
- `Cap`
- `FaceRoot`
- `Eye_L`
- `Eye_R`
- `Mouth`
- `AttackOrigin`
- `EffectOrigin`
- `GroundOrigin`

## Build

Generate one enemy:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background \
  --python tools/blender/enemies/build.py -- \
  --slug tiny-mushroom \
  --output public/assets/enemies/tiny-mushroom.glb
```

Generate the complete Mushroom family:

```bash
pnpm run generate:enemies
```

Validate exported runtime contracts and bounds:

```bash
pnpm run validate:enemies
```

The browser runtime loads the exported GLB. Production enemy geometry must not be reconstructed procedurally in `BattleRuntime.ts`. Game and gallery must share the same exported GLB and `src/game/enemy-motion.ts` motion/VFX source.