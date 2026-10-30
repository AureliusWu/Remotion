$ErrorActionPreference = 'Stop'
$videoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$text = ((Get-Content -LiteralPath (Join-Path $PSScriptRoot 'sample.json') -Raw -Encoding utf8 | ConvertFrom-Json).lines -join ' ')
$wavPath = Join-Path $videoRoot 'out/ai-history-tts/sample-huihui.wav'
$mp3Path = Join-Path $videoRoot 'public/ai-history/tts-sample-huihui.mp3'
$ffmpeg = Join-Path $videoRoot 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
$speaker = New-Object -ComObject SAPI.SpVoice
$voices = $speaker.GetVoices()
for ($index=0; $index -lt $voices.Count; $index++) {
    $candidate = $voices.Item($index)
    if ($candidate.GetDescription() -eq 'Microsoft Huihui Desktop - Chinese (Simplified)') { $speaker.Voice=$candidate; break }
}
$speaker.Rate = 1
$taskSampleClock = [Diagnostics.Stopwatch]::StartNew()
$stream = New-Object -ComObject SAPI.SpFileStream
try {
    $stream.Format.Type = 22
    $stream.Open($wavPath, 3, $false)
    $speaker.AudioOutputStream = $stream
    $speaker.Speak($text, 0) | Out-Null
}
finally { $stream.Close(); $speaker.AudioOutputStream=$null }
$taskSampleClock.Stop()
$normalizedWavPath = Join-Path $videoRoot 'out/ai-history-tts/sample-huihui-normalized.wav'
$python = Join-Path $videoRoot 'out/ai-history-tts/venv/Scripts/python.exe'
$normalizer = @'
import json,sys,numpy as np,soundfile as sf
a,sr=sf.read(sys.argv[1],dtype='float32');peak=float(np.max(np.abs(a)));rms=float(np.sqrt(np.mean(a.astype(np.float64)**2)))
gain=min(10**(-23/20)/rms,10**(-1/20)/peak)
sf.write(sys.argv[2],a*gain,sr,subtype='PCM_16')
print(json.dumps({'durationSeconds':len(a)/sr,'normalizationGain':gain}))
'@
$sampleStats = (& $python -c $normalizer $wavPath $normalizedWavPath) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Huihui sample normalization failed' }
& $ffmpeg -v error -y -i $normalizedWavPath -codec:a libmp3lame -b:a 128k -ar 44100 -ac 1 $mp3Path
if ($LASTEXITCODE -ne 0) { throw 'Huihui sample encoding failed' }
& $ffmpeg -v error -i $mp3Path -f null -
if ($LASTEXITCODE -ne 0) { throw 'Huihui sample full decode failed' }
$manifestPath = Join-Path $videoRoot 'public/ai-history/tts-sample-manifest.json'
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding utf8 | ConvertFrom-Json
    $manifest.samples = @($manifest.samples | Where-Object file -ne 'tts-sample-huihui.mp3') + [pscustomobject]@{ file='tts-sample-huihui.mp3'; engine='Windows SAPI'; voice='Microsoft Huihui Desktop - Chinese (Simplified)'; sapiRate=1; durationSeconds=$sampleStats.durationSeconds; synthesisSeconds=$taskSampleClock.Elapsed.TotalSeconds; normalizationGain=$sampleStats.normalizationGain; fullDecodePassed=$true }
    [IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
}
Write-Host "Saved $mp3Path"
