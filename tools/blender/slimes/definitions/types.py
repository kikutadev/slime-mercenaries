from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SlimeDefinition:
    """Build-time composition metadata; body topology stays canonical."""

    slug: str
    display_name: str
    body_color: tuple[float, float, float, float]
    body_material_name: str = "SlimeBody"
    body_roughness: float = 0.16
    body_scale: tuple[float, float, float] = (1.0, 1.0, 1.0)
    eye_spacing: float = 0.225
    eye_scale: float = 1.0
    eye_height: float = 0.68
    face_offset_y: float = -0.24
    motion_profile: str = "plain"
