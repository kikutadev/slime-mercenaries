from __future__ import annotations

import argparse
import importlib
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PACKAGE_PARENT = SCRIPT_DIR.parent
if str(PACKAGE_PARENT) not in sys.path:
    sys.path.insert(0, str(PACKAGE_PARENT))

from enemies.common.export import clear_scene, export_glb  # noqa: E402
from enemies.families.mushroom import MushroomDefinition, build_mushroom  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a Slime Mercenaries enemy GLB.")
    parser.add_argument("--slug", required=True)
    parser.add_argument("--output", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def main() -> None:
    args = parse_args()
    module_name = args.slug.replace("-", "_")
    module = importlib.import_module(f"enemies.definitions.{module_name}")
    definition = getattr(module, "DEFINITION")
    if not isinstance(definition, MushroomDefinition):
        raise TypeError(f"Unsupported enemy definition type for {args.slug}: {type(definition)!r}")
    if definition.slug != args.slug:
        raise ValueError(f"Definition slug mismatch: expected {args.slug}, got {definition.slug}")

    clear_scene()
    build_mushroom(definition)
    export_glb(Path(args.output).resolve())
    print(f"Exported {definition.slug} -> {args.output}")


if __name__ == "__main__":
    main()
