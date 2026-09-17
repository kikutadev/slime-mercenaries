from __future__ import annotations

from slimes.base.context import BuildContext
from slimes.parts.defense import create_guardian_helm, create_guardian_tower_shield

from .types import SlimeDefinition


DEFINITION = SlimeDefinition(
    slug="guardian",
    display_name="Guardian Slime",
    # Keep the Shield-branch body invariant. Tier-2 identity is equipment-only.
    body_color=(0.08, 0.58, 0.90, 1.0),
    body_material_name="SlimeBlue",
    motion_profile="guardian",
)


def build_parts(ctx: BuildContext) -> None:
    """Assemble the Tier-2 defensive silhouette on the canonical Base Slime."""
    create_guardian_helm(ctx)
    create_guardian_tower_shield(ctx)
