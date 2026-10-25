"""Prepare short Japanese TTS clips; only these authored lines leave this machine.

Run: uv sync --extra voice; uv run --extra voice python tools/prepare_voice.py
Output is ignored runtime data. The app needs no TTS service during playback.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "src/amadeus/static/voice-lines.json"


async def prepare(args):
    import edge_tts

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    output = ROOT / "runtime_assets/voice"
    output.mkdir(parents=True, exist_ok=True)
    voice = args.voice or catalog["voice"]
    rate = args.rate or catalog["rate"]
    pitch = args.pitch or catalog["pitch"]
    limit = asyncio.Semaphore(3)

    async def clip(line):
        key = json.dumps([line["ja"], voice, rate, pitch], ensure_ascii=False)
        digest = hashlib.sha256(key.encode()).hexdigest()[:12]
        name = f'{line["id"]}-{digest}.mp3'
        target = output / name
        async with limit:
            if not target.is_file() or target.stat().st_size < 1000:
                temporary = target.with_suffix(".part")
                try:
                    await asyncio.wait_for(edge_tts.Communicate(line["ja"], voice, rate=rate, pitch=pitch).save(str(temporary)), timeout=75)
                    if temporary.stat().st_size < 1000:
                        raise RuntimeError(f'Empty audio for {line["id"]}')
                    temporary.replace(target)
                finally:
                    temporary.unlink(missing_ok=True)
                print("Prepared", line["id"], flush=True)
        return {**line, "src": f"/runtime/voice/{name}", "sha256": hashlib.sha256(target.read_bytes()).hexdigest()}

    lines = await asyncio.gather(*(clip(line) for line in catalog["lines"]))
    bank = {"version": catalog["version"], "voice": voice, "label": catalog["label"] if voice == catalog["voice"] else voice, "lines": lines}
    manifest = output / "bank.json"
    temporary = manifest.with_suffix(".part")
    temporary.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(manifest)
    print(f"Ready: {len(lines)} Japanese clips. Voice: {voice}. No original character recordings.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--voice", help="Edge TTS voice name")
    parser.add_argument("--rate", help="Speaking rate, e.g. --rate=+6%%")
    parser.add_argument("--pitch", help="Pitch, e.g. --pitch=+0Hz")
    asyncio.run(prepare(parser.parse_args()))


if __name__ == "__main__":
    main()
