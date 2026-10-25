"""Reproducible local assets: licensed fan artwork/model, fonts and Cubism.

Downloaded files and the built SDK stay in runtime_assets/ and .cache/ (ignored).
Amadeus artwork/model: DSUV / ELVELT, port by JulienQ1, CC BY-NC 4.0.
Cubism Framework/Core and fonts retain their own licenses; see asset credits.
"""
from __future__ import annotations

import hashlib
import io
import json
import shutil
import subprocess
import sys
import tarfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "runtime_assets"
CACHE = ROOT / ".cache" / "avatar"
REVISION = "eb95bd52fcac76d90109c2f3c4bd2c915be09d98"
FRAMEWORK = "01e64ba44fc29e5e7206f0c397ee532edf824ee9"
FAN = f"https://raw.githubusercontent.com/JulienQ1/AmadeusMobile/{REVISION}/"
CORE = "https://raw.githubusercontent.com/Open-LLM-VTuber/Open-LLM-VTuber-Web/d176e7df2366952e3bacbf12cf9a8b18a4315932/src/renderer/WebSDK/Core/"
CHAT_FONT = "https://raw.githubusercontent.com/google/fonts/0b58fb370093f9a9f4ff785d94405710b79de67c/ofl/ibmplexsans/"
FILES = {
    "branding/logo.webp": FAN + "web/public/img/logo.webp",
    "licenses/amadeus-model.txt": FAN + "LICENSE",
    **{f"kurisu/{name}": FAN + "web/public/model/kurisu/" + name for name in (
        "kurisu.model3.json", "kurisu.moc3", "kurisu.physics3.json", "kurisu.cdi3.json", "texture_4096.png")},
    "fonts/BeVietnamPro-Regular.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Regular.ttf",
    "fonts/BeVietnamPro-Medium.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/BeVietnamPro-Medium.ttf",
    "fonts/BarlowCondensed-Medium.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/BarlowCondensed-Medium.ttf",
    "fonts/IBMPlexSans-Variable.ttf": CHAT_FONT + "IBMPlexSans%5Bwdth%2Cwght%5D.ttf",
    "licenses/ibm-plex-sans.txt": CHAT_FONT + "OFL.txt",
    "licenses/be-vietnam-pro.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/OFL.txt",
    "licenses/barlow-condensed.txt": "https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt",
    "vendor/live2dcubismcore.min.js": CORE + "live2dcubismcore.min.js",
    "licenses/cubism-core.md": CORE + "LICENSE.md",
    "licenses/cubism-framework.md": f"https://raw.githubusercontent.com/Live2D/CubismWebFramework/{FRAMEWORK}/LICENSE.md",
}
CORE_HASH = "942783587666a3a1bddea93afd349e26f798ed19dcd7a52449d0ae3322fcff7c"


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Amadeus-assets/0.2"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    OUT.mkdir(exist_ok=True)
    lock_path = ROOT / "tools" / "assets.lock.json"
    hashes = json.loads(lock_path.read_text()) if lock_path.exists() else {}
    for name, url in FILES.items():
        target = OUT / name
        expected = hashes.get(name, {}).get("sha256")
        if target.is_file() and expected and hashlib.sha256(target.read_bytes()).hexdigest() == expected:
            continue
        data = download(url)
        actual = hashlib.sha256(data).hexdigest()
        if name == "vendor/live2dcubismcore.min.js" and actual != CORE_HASH:
            raise RuntimeError("Cubism Core checksum mismatch")
        if expected and actual != expected:
            raise RuntimeError(f"Checksum mismatch: {name}. Review the source instead of overwriting.")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        hashes[name] = {"url": url, "sha256": actual}
        print("Prepared", name)
    lock_path.write_text(json.dumps(hashes, indent=2) + "\n", encoding="utf-8")
    framework = CACHE / f"CubismWebFramework-{FRAMEWORK}"
    if not (framework / "src" / "live2dcubismframework.ts").is_file():
        CACHE.mkdir(parents=True, exist_ok=True)
        archive = download(f"https://codeload.github.com/Live2D/CubismWebFramework/tar.gz/{FRAMEWORK}")
        with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
            for member in tar.getmembers():
                resolved = (CACHE / member.name).resolve()
                if not resolved.is_relative_to(CACHE.resolve()) or member.issym() or member.islnk():
                    raise RuntimeError("Unsafe SDK archive path")
            tar.extractall(CACHE, filter="data")
    entry = CACHE / "entry.js"
    base = (framework / "src").as_posix()
    entry.write_text("\n".join([
        f'export {{ CubismFramework, Option, LogLevel }} from "{base}/live2dcubismframework.ts";',
        f'export {{ CubismUserModel }} from "{base}/model/cubismusermodel.ts";',
        f'export {{ CubismMatrix44 }} from "{base}/math/cubismmatrix44.ts";',
        f'export {{ CubismRenderer_WebGL }} from "{base}/rendering/cubismrenderer_webgl.ts";',
    ]), encoding="utf-8")
    esbuild = ROOT / "node_modules" / "esbuild" / "bin" / "esbuild"
    if not esbuild.is_file() or not shutil.which("node"):
        raise RuntimeError("Install Node and run npm ci before preparing the Cubism bundle.")
    subprocess.run(["node", str(esbuild), str(entry), "--bundle", "--format=esm", "--minify", "--target=es2020",
                    f"--outfile={OUT / 'vendor' / 'cubism.js'}"], check=True, cwd=ROOT)
    print("Assets ready. Artwork/model: CC BY-NC 4.0, DSUV / ELVELT, JulienQ1. See docs/AVATAR.md.")


if __name__ == "__main__":
    main()
