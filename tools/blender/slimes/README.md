# Modular Slime Asset Builder

This directory is the source of truth for Slime Mercenaries character GLBs.

## Rule

Ordinary forms reuse one canonical Base Slime body. New forms are assembled from socketed reusable parts plus a small composition definition. Do not copy the body generator into a job-specific file.

```text
base body + sockets + reusable parts + form definition -> standalone GLB
```

Standalone GLBs keep the browser runtime simple while preserving source-level reuse.

## Sockets

The shared root exports these stable attachment points:

- `HeadSocket`
- `FrontLeftSocket`
- `FrontRightSocket`
- `BackSocket`
- `WeaponSocket`
- `OffhandSocket`
- `ProjectileOrigin`
- `SpellOrigin`

Accepted legacy runtime anchors such as `WeaponAnchor` and `BowAnchor` are created by the relevant part module under the identity `WeaponSocket`, so their effective transforms remain unchanged.

## Add a form

1. Reuse or add a part builder under `parts/`.
2. Add exactly one module under `definitions/<slug>.py`.
3. Export `DEFINITION` and, when needed, `build_parts(ctx)`.
4. Run Blender with `slimes/build.py -- --slug <slug> --output <path>` or the compatibility `generate_slime.py` wrapper.
5. Do not add the form to a central registry; `build.py` loads the definition module by slug.

## Parallel ownership

Once `base/*` and the socket contract are frozen, lanes can work independently in different part/definition files. Only the coordinator changes shared base interfaces or performs final publication.
