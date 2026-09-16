# Camp / Fusion Environment Asset Manifest

Status: Production contract
Date: 2026-09-17

This manifest defines the first environment assets produced with Blender Python for the game UI vertical slice.

## Asset table

| Asset | Runtime role | Priority | Reused in | Output |
|---|---|---:|---|---|
| Camp Diorama | Main interactive home scene | P0 | Camp | `public/assets/environment/camp-diorama.glb` |
| Fusion Altar | Physical fusion stage | P0 | Camp + Fusion | `public/assets/environment/fusion-altar.glb` |
| Training Dummy | Training / upgraded attack target | P0 | Camp + Fusion | `public/assets/environment/training-dummy.glb` |
| Nursery Vat | Plain Slime creation station | P0 | Camp | `public/assets/environment/nursery-vat.glb` |

Weapon rack, weapon pickups, Forge objects and Dispatch assets are explicitly out of scope.

## Shared style

- rounded toy-like fantasy props
- low-detail shapes readable on mobile
- matte materials with modest bevel highlights
- environment lower saturation than slime characters
- glTF-safe Principled materials
- no required texture files in v1
- no baked cameras/lights in exported GLB

## Camp Diorama

### Functional pieces

- grass island
- cream dirt circulation path
- small tent / shelter
- formation flag
- campfire or lantern accent
- rocks / clover / grass clusters
- physical locations for training, fusion and nursery stations

### Named anchors

- `Anchor_SlimeHome`
- `Anchor_SlimeIdleA`
- `Anchor_SlimeIdleB`
- `Anchor_Training`
- `Anchor_Fusion`
- `Anchor_Nursery`
- `Anchor_Formation`
- `Anchor_CameraFocus`
- `Anchor_CameraTarget`

## Fusion Altar

### Functional pieces

- stone base
- left source pad
- right source pad
- central result pad
- three material sockets
- outer / inner / core rune meshes
- short framing pillars

### Named nodes

- `RuneOuter`
- `RuneInner`
- `RuneCore`
- `Pad_Left`
- `Pad_Right`
- `Pad_Result`
- `Socket_Core`
- `Socket_CatalystA`
- `Socket_CatalystB`

### Named anchors

- `Anchor_LeftSlime`
- `Anchor_RightSlime`
- `Anchor_ResultSlime`
- `Anchor_TrainingDummy`
- `Anchor_CameraFocus`
- `Anchor_CameraTarget`

## Training Dummy

### Named nodes

- `Base`
- `Post`
- `TargetBody`
- `TargetMark`
- `Anchor_Impact`

Runtime recoil rotates/translates the rigid root; no baked animation is required.

## Nursery Vat

### Named nodes

- `Basin`
- `Fluid`
- `Bowl_Left`
- `Bowl_Right`
- `CloverMark`
- `Anchor_Spawn`
- `Anchor_CameraFocus`
- `Anchor_CameraTarget`

`Fluid` remains separately addressable for runtime pulse/emissive treatment.

## Budget

| Asset | Triangle target | Material target |
|---|---:|---:|
| Camp Diorama | <= 18k | <= 8 |
| Fusion Altar | <= 8k | <= 5 |
| Training Dummy | <= 2k | <= 3 |
| Nursery Vat | <= 4k | <= 4 |

## Scale references

- ordinary slime width: ~1.8–2.2 world units
- training dummy: ~1.6 units tall
- fusion altar: ~4.6–5.2 units diameter
- camp island: ~9.5 × 7.0 units

All render-mesh transforms must be applied before export. Empty anchor transforms remain meaningful and are exported intentionally.

## Release gate

No asset is considered accepted from a Blender viewport render alone. Acceptance uses the actual 390×844 game camera and existing slime GLBs.
