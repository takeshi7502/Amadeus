"""Generate an anime-style Japanese phrase bank locally with VOICEVOX CORE.

See docs/VOICE.md for the isolated generator environment and model setup.
Nothing is sent to an online TTS service. Only cached MP3 files go to the web.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROFILES = [
    {"id": "metan-sweet", "label": "Metan · ngọt ngào", "style_id": 0, "speed": 1.07, "pitch": 0.015, "intonation": 1.2},
    {"id": "metan-tsun", "label": "Metan · tsundere", "style_id": 6, "speed": 1.08, "pitch": 0.0, "intonation": 1.2},
]
CREDIT = "VOICEVOX:四国めたん"


def main():
    from voicevox_core.blocking import Onnxruntime, OpenJtalk, Synthesizer, VoiceModelFile

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--core-dir", type=Path, default=ROOT / ".cache/voicevox/core")
    args = parser.parse_args()
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg is required to encode cached MP3 clips.")
    core = args.core_dir.resolve()
    dll = next(core.glob("onnxruntime/**/voicevox_onnxruntime*.dll"), None)
    dictionary = next(core.glob("dict/**/sys.dic"), None)
    model_path = next(core.glob("models/**/0.vvm"), None)
    if not all([dll, dictionary, model_path]):
        raise SystemExit("Missing VOICEVOX runtime, dictionary or 0.vvm. See docs/VOICE.md.")
    runtime = Onnxruntime.load_once(filename=str(dll))
    synth = Synthesizer(runtime, OpenJtalk(dictionary.parent), acceleration_mode="CPU", cpu_num_threads=min(os.cpu_count() or 2, 6))
    with VoiceModelFile.open(model_path) as model:
        synth.load_voice_model(model)
    catalog = json.loads((ROOT / "src/amadeus/static/voice-lines.json").read_text(encoding="utf-8"))
    output = ROOT / "runtime_assets/voice"
    output.mkdir(parents=True, exist_ok=True)
    model_hash = hashlib.sha256(model_path.read_bytes()).hexdigest()
    profiles = []
    for settings in PROFILES:
        profile = {"id": settings["id"], "label": settings["label"], "credit": CREDIT,
                   "voice": f'voicevox-metan-{settings["style_id"]}', "lines": []}
        for line in catalog["lines"]:
            key = json.dumps([line["ja"], settings, model_hash, "core-0.17.1"], ensure_ascii=False, sort_keys=True)
            digest = hashlib.sha256(key.encode()).hexdigest()[:12]
            name = f'{settings["id"]}-{line["id"]}-{digest}.mp3'
            target = output / name
            if not target.is_file() or target.stat().st_size < 1000:
                temporary = target.with_suffix(".part")
                try:
                    query = synth.create_audio_query(line["ja"], settings["style_id"])
                    query.speed_scale = settings["speed"]
                    query.pitch_scale = settings["pitch"]
                    query.intonation_scale = settings["intonation"]
                    query.pre_phoneme_length = 0.08
                    query.post_phoneme_length = 0.12
                    wav = synth.synthesis(query, settings["style_id"])
                    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "96k", "-f", "mp3", str(temporary)], input=wav, check=True, timeout=60)
                    if temporary.stat().st_size < 1000:
                        raise RuntimeError(f'Empty clip: {line["id"]}')
                    temporary.replace(target)
                finally:
                    temporary.unlink(missing_ok=True)
                print("Prepared", settings["id"], line["id"], flush=True)
            profile["lines"].append({**line, "src": f"/runtime/voice/{name}", "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
        profiles.append(profile)
    bank = {**profiles[0], "version": 2, "default_profile": profiles[0]["id"], "profiles": profiles}
    temporary = output / "bank.part"
    temporary.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(output / "bank.json")
    # Keep the terms alongside distributable audio and include the credit in UI.
    terms = core / "models/TERMS.txt"
    if terms.is_file():
        shutil.copyfile(terms, output / "VOICEVOX-TERMS.txt")
    print(f"Ready: {len(profiles)} anime profiles, {len(catalog['lines'])} clips each; generated locally.")


if __name__ == "__main__":
    main()
