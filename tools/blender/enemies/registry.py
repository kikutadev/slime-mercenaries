from __future__ import annotations

from dataclasses import dataclass
import importlib
from typing import Callable, Any

import bpy


@dataclass(frozen=True)
class EnemyFamilyBuilder:
    family: str
    definition_type: type
    build: Callable[[Any], bpy.types.Object]


def resolve_family_builder(family: str) -> EnemyFamilyBuilder:
    """Resolve one family without a central slug registry.

    A family module owns `DEFINITION_TYPE` and `build_enemy`, so parallel lanes can
    add a family without editing this coordinator-owned dispatcher.
    """
    module = importlib.import_module(f"enemies.families.{family}")
    definition_type = getattr(module, "DEFINITION_TYPE", None)
    build = getattr(module, "build_enemy", None)
    if not isinstance(definition_type, type) or not callable(build):
        raise TypeError(
            f"Enemy family '{family}' must export DEFINITION_TYPE and build_enemy(definition)"
        )
    return EnemyFamilyBuilder(family=family, definition_type=definition_type, build=build)
