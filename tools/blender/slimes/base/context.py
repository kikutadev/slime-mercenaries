from __future__ import annotations

from dataclasses import dataclass, field

import bpy

from .materials import make_material


@dataclass(slots=True)
class BuildContext:
    """Shared build context passed to socketed part builders."""

    root: bpy.types.Object
    sockets: dict[str, bpy.types.Object]
    materials: dict[str, bpy.types.Material] = field(default_factory=dict)

    def material(
        self,
        name: str,
        color: tuple[float, float, float, float],
        *,
        roughness: float,
        metallic: float = 0.0,
        coat_weight: float | None = None,
    ) -> bpy.types.Material:
        existing = self.materials.get(name)
        if existing is not None:
            return existing
        material = make_material(
            name,
            color,
            roughness=roughness,
            metallic=metallic,
            coat_weight=coat_weight,
        )
        self.materials[name] = material
        return material

    def socket(self, name: str) -> bpy.types.Object:
        try:
            return self.sockets[name]
        except KeyError as exc:
            raise KeyError(f"Unknown slime socket: {name}") from exc
