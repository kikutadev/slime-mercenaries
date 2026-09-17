from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.gun import create_engineer_goggles, create_engineer_turret, create_engineer_wrench

from .types import SlimeDefinition

DEFINITION = SlimeDefinition(
    slug="engineer",
    display_name="Engineer Slime",
    body_color=(0.065, 0.48, 0.54, 1.0),
    body_material_name="SlimeEngineerTeal",
    body_scale=(1.0, 1.0, 1.0),
    motion_profile="engineer",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble Engineer vocabulary while keeping its turret independently addressable."""
    create_engineer_goggles(ctx)
    create_engineer_wrench(ctx)
    create_engineer_turret(ctx)
