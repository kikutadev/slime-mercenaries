from __future__ import annotations

import argparse
import sys
from pathlib import Path

import bpy

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from areas import castle, clover, dragon, ember, frost, marsh, mine, mushroom


BUILDERS = {
    clover.AREA_ID: clover.build,
    mushroom.AREA_ID: mushroom.build,
    mine.AREA_ID: mine.build,
    marsh.AREA_ID: marsh.build,
    frost.AREA_ID: frost.build,
    ember.AREA_ID: ember.build,
    castle.AREA_ID: castle.build,
    dragon.AREA_ID: dragon.build,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build reusable stage-environment kits.")
    parser.add_argument("--area", required=True, choices=tuple(BUILDERS))
    parser.add_argument("--output", required=True)
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def export_glb(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
    )


def main() -> None:
    args = parse_args()
    clear_scene()
    BUILDERS[args.area]()
    export_glb(Path(args.output).resolve())
    print(f"Exported environment kit {args.area} -> {args.output}")


if __name__ == "__main__":
    main()
