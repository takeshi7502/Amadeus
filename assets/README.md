# Web runtime assets

`runtime/` is the small, versioned set of assets the shipped web application
needs: logo, fonts, Live2D model/SDK, licenses and the active Japanese voice clips.
These are application assets, not the local generator cache or user data.
Keep them in Git so Vercel builds have the same inputs as local builds.

`runtime-manifest.json` pins the SHA-256 of every shipped runtime file.
`python tools/prepare_vercel.py` verifies them and creates the ignored `public/`
directory. Vercel runs this command automatically before deployment. A missing
or modified asset fails the build instead of publishing a broken interface.

After intentionally regenerating the prepared local assets, run:

```powershell
python tools/prepare_vercel.py --refresh-runtime
```

Review and commit `assets/runtime/` and `assets/runtime-manifest.json` together.
Do not commit `.cache/`, the local VOICEVOX engine, settings, tokens or user data.

Artwork/model: DSUV / ELVELT, port by JulienQ1, CC BY-NC 4.0. Fonts, Cubism and
VOICEVOX clips retain their separate licenses and credits under `runtime/licenses/`,
`runtime/voice/VOICEVOX-TERMS.txt` and the application's System & Sources panel.
