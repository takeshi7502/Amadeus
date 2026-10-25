"""Build a public/ asset directory for a local Vercel CLI deployment.

Only prepared model/font/vendor assets and the active voice profiles are copied.
No local settings, user database, logs, environment or generator caches are read.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "public")
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(ROOT) or output == ROOT:
        raise SystemExit("The output must be a child directory of this project.")
    assets = ROOT / "runtime_assets"
    manifest = json.loads((assets / "voice/bank.json").read_text(encoding="utf-8"))
    lines = [line for profile in manifest.get("profiles", [manifest]) for line in profile["lines"]]
    needed = [assets / "voice/bank.json"]
    for line in lines:
        if not re.fullmatch(r"/runtime/voice/[a-z0-9-]+\.mp3", line["src"]):
            raise SystemExit("Invalid voice asset path.")
        path = assets / line["src"].removeprefix("/runtime/")
        if hashlib.sha256(path.read_bytes()).hexdigest() != line["sha256"]:
            raise SystemExit(f"Voice asset checksum mismatch: {path.name}")
        needed.append(path)
    for folder in ["branding", "fonts", "kurisu", "vendor", "licenses"]:
        files = list((assets / folder).glob("*"))
        if not files:
            raise SystemExit(f"Missing runtime assets: {folder}. Run tools/prepare_assets.py first.")
        needed.extend(path for path in files if path.is_file())
    terms = assets / "voice/VOICEVOX-TERMS.txt"
    if terms.is_file():
        needed.append(terms)
    # Replace only our known generated asset subdirectories, not arbitrary files.
    for name in ["assets", "runtime"]:
        target = (output / name).resolve()
        if not target.is_relative_to(output) or target.is_symlink():
            raise SystemExit("Unsafe output path.")
        if target.exists():
            shutil.rmtree(target)
    output.mkdir(parents=True, exist_ok=True)
    static = ROOT / "src/amadeus/static"
    shutil.copytree(static, output / "assets")
    shutil.copyfile(static / "index.html", output / "index.html")
    for source in set(needed):
        target = output / "runtime" / source.relative_to(assets)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    files = list(path for path in output.rglob("*") if path.is_file())
    print(f"Prepared {len(files)} public files, {sum(path.stat().st_size for path in files) / 1024 / 1024:.2f} MiB.")
    print("Ready for npx vercel --prod. Configure Turso and AI secrets in Vercel first.")


if __name__ == "__main__":
    main()
