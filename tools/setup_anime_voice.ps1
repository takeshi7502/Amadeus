$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$voiceCache = Join-Path $projectRoot '.cache/voicevox'
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { throw 'Install uv before preparing VOICEVOX.' }
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) { throw 'Install ffmpeg before preparing VOICEVOX.' }
New-Item -ItemType Directory -Path $voiceCache -Force | Out-Null

# Official VOICEVOX CORE 0.17.1 binaries, pinned to verified download hashes.
$artifacts = @(
    @{Name='download.exe'; Remote='download-windows-x64.exe'; Hash='80c08f977da5b9bec6826048d094869ecaacda5aa848b2d99171d41bfd54091a'},
    @{Name='voicevox_core-0.17.1-cp310-abi3-win_amd64.whl'; Remote='voicevox_core-0.17.1-cp310-abi3-win_amd64.whl'; Hash='faaac91e7b19c32d60fcbd4f38b91681e576ec3de01330aa3f37c33ae05db6d1'}
)
foreach ($artifact in $artifacts) {
    $target = Join-Path $voiceCache $artifact.Name
    if (-not (Test-Path -LiteralPath $target)) {
        $temporary = "$target.part"
        Invoke-WebRequest -Uri "https://github.com/VOICEVOX/voicevox_core/releases/download/0.17.1/$($artifact.Remote)" -OutFile $temporary
        if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $artifact.Hash) { throw "Checksum mismatch: $($artifact.Name)" }
        Move-Item -LiteralPath $temporary -Destination $target -Force
    }
    if ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $artifact.Hash) { throw "Checksum mismatch: $($artifact.Name)" }
}
$generatorPython = Join-Path $voiceCache 'venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $generatorPython)) {
    & uv venv (Join-Path $voiceCache 'venv') --python 3.13
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the generator environment.' }
}
& uv pip install --python $generatorPython (Join-Path $voiceCache 'voicevox_core-0.17.1-cp310-abi3-win_amd64.whl')
if ($LASTEXITCODE -ne 0) { throw 'Could not install VOICEVOX CORE.' }
$coreDir = Join-Path $voiceCache 'core'
# The official downloader displays its model/runtime terms before proceeding.
& (Join-Path $voiceCache 'download.exe') --only onnxruntime dict models --models-pattern 0.vvm --models-version 0.17.0 --onnxruntime-version 1.17.3 --output $coreDir --tries 2
if ($LASTEXITCODE -ne 0) { throw 'VOICEVOX resource preparation did not complete.' }
& $generatorPython (Join-Path $PSScriptRoot 'prepare_anime_voice.py') --core-dir $coreDir
if ($LASTEXITCODE -ne 0) { throw 'Anime voice generation did not complete.' }
