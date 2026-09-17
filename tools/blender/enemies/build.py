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
from enemies.registry import resolve_family_builder  # noqa: E402


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
    family = getattr(module, "FAMILY", "mushroom")
    builder = resolve_family_builder(family)

    if not isinstance(definition, builder.definition_type):
        raise TypeError(
            f"Unsupported {family} definition type for {args.slug}: {type(definition)!r}; "
            f"expected {builder.definition_type!r}"
        )
    if getattr(definition, "slug", None) != args.slug:
        raise ValueError(f"Definition slug mismatch: expected {args.slug}, got {getattr(definition, 'slug', None)}")

    clear_scene()
    builder.build(definition)
    export_glb(Path(args.output).resolve())
    print(f"Exported {definition.slug} ({family}) -> {args.output}")


if __name__ == "__main__":
    main()
