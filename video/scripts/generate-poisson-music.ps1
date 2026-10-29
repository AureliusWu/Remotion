[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$videoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$workingDirectory = Join-Path $videoRoot 'out/poisson-voiceover'
$outputDirectory = Join-Path $videoRoot 'public/poisson-process'
$ffmpegPath = Join-Path $videoRoot 'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
$ffprobePath = Join-Path $videoRoot 'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
$nodePath = (Get-Command node -ErrorAction Stop).Source
New-Item -ItemType Directory -Path $workingDirectory, $outputDirectory -Force | Out-Null
$wavPath = Join-Path $workingDirectory 'quiet-pages-music.wav'
$mp3Path = Join-Path $outputDirectory 'quiet-pages-music.mp3'

# Original deterministic synthesis. No samples, downloaded music, or random input.
# The music master peaks at -42 dBFS, intentionally far below the narration.
$musicCode = @'
const fs = require('node:fs');
const path = process.argv[1];
const sampleRate = 44100;
const seconds = 180;
const samples = sampleRate * seconds;
const signal = new Float64Array(samples);
const chords = [[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,69]];
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const tau = Math.PI * 2;

// A slowly released electric-piano texture with one note every 2.5 seconds.
for (let event = 0; event < 70; event++) {
  const start = 1.5 + event * 2.5;
  const chord = chords[Math.floor(event / 4) % chords.length];
  const note = chord[[0,2,1,3][event % 4]];
  const frequency = hz(note);
  const length = 7;
  const from = Math.round(start * sampleRate);
  const until = Math.min(samples, Math.round((start + length) * sampleRate));
  for (let i = from; i < until; i++) {
    const t = (i - from) / sampleRate;
    const envelope = (1 - Math.exp(-t * 32)) * Math.exp(-t / 1.7) * Math.min(1, (length - t) / 0.8);
    const piano = Math.sin(tau * frequency * t) + 0.21 * Math.sin(tau * frequency * 2 * t) + 0.055 * Math.sin(tau * frequency * 3 * t);
    signal[i] += 0.65 * envelope * piano;
  }
}

// Breath-like low pad changes over ten seconds; overlapping ramps avoid clicks.
for (let event = 0; event < 18; event++) {
  const start = event * 10;
  const chord = chords[event % chords.length];
  const from = Math.round(start * sampleRate);
  const length = 16;
  const until = Math.min(samples, Math.round((start + length) * sampleRate));
  for (let i = from; i < until; i++) {
    const t = (i - from) / sampleRate;
    const envelope = Math.min(1, t / 4) * Math.min(1, (length - t) / 6);
    const pad = Math.sin(tau * hz(chord[0] - 12) * t) * 0.48 + Math.sin(tau * hz(chord[2] - 12) * t) * 0.35;
    signal[i] += 0.13 * envelope * pad;
  }
}

let peak = 0;
for (let i = 0; i < samples; i++) {
  const t = i / sampleRate;
  signal[i] *= Math.min(1, t / 3.5) * Math.min(1, (seconds - t) / 6);
  peak = Math.max(peak, Math.abs(signal[i]));
}
const targetPeak = 10 ** (-42 / 20);
const gain = targetPeak / peak;
const pcm = Buffer.alloc(44 + samples * 2);
pcm.write('RIFF',0); pcm.writeUInt32LE(36+samples*2,4); pcm.write('WAVEfmt ',8);
pcm.writeUInt32LE(16,16); pcm.writeUInt16LE(1,20); pcm.writeUInt16LE(1,22);
pcm.writeUInt32LE(sampleRate,24); pcm.writeUInt32LE(sampleRate*2,28);
pcm.writeUInt16LE(2,32); pcm.writeUInt16LE(16,34); pcm.write('data',36);
pcm.writeUInt32LE(samples*2,40);
for (let i = 0; i < samples; i++) pcm.writeInt16LE(Math.round(signal[i] * gain * 32767),44+i*2);
fs.writeFileSync(path,pcm);
process.stdout.write(JSON.stringify({seconds,sampleRate,channels:1,targetPeakDbfs:-42,original:true,deterministic:true}));
'@
$synthesisOutput = & $nodePath -e $musicCode $wavPath
if ($LASTEXITCODE -ne 0) { throw 'Original music synthesis failed.' }
Write-Host $synthesisOutput
& $ffmpegPath -hide_banner -loglevel error -y -i $wavPath -codec:a libmp3lame -b:a 128k -ar 44100 -ac 1 $mp3Path
if ($LASTEXITCODE -ne 0) { throw 'Music MP3 encoding failed.' }
$decodedPath = Join-Path $workingDirectory 'quiet-pages-music-decoded.wav'
& $ffmpegPath -v error -y -i $mp3Path -codec:a pcm_s16le -ar 44100 -ac 1 $decodedPath
if ($LASTEXITCODE -ne 0) { throw 'Music complete PCM decode failed.' }
$levelCode = @'
const fs=require('fs');const bytes=fs.readFileSync(process.argv[1]);let offset=12,pcm;
while(offset+8<=bytes.length){const id=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4);if(id==='data')pcm=bytes.subarray(offset+8,offset+8+size);offset+=8+size+(size%2);}
if(!pcm||pcm.length%2)throw new Error('Expected 16-bit PCM data');
let peak=0,squares=0;for(let i=0;i<pcm.length;i+=2){const value=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(value));squares+=value*value;}
process.stdout.write(JSON.stringify({fullDecodePassed:true,measurement:'decoded 44.1 kHz 16-bit mono PCM',peakDbfs:Number((20*Math.log10(peak)).toFixed(4)),rmsDbfs:Number((20*Math.log10(Math.sqrt(squares/(pcm.length/2)))).toFixed(4)),sampleCount:pcm.length/2,decodedDurationSeconds:pcm.length/2/44100}));
'@
$levelOutput = & $nodePath -e $levelCode $decodedPath
if ($LASTEXITCODE -ne 0) { throw 'Music PCM level measurement failed.' }
$audioLevels = ($levelOutput -join '') | ConvertFrom-Json
$durationOutput = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $mp3Path
if ($LASTEXITCODE -ne 0) { throw 'Music duration check failed.' }
$manifest = [ordered]@{
    file = 'quiet-pages-music.mp3'
    title = 'Quiet Pages'
    description = 'Original deterministic soft electric-piano and sine-pad synthesis, generated for this project.'
    durationSeconds = [double]::Parse(($durationOutput -join '').Trim(), [Globalization.CultureInfo]::InvariantCulture)
    contentDurationSeconds = 180
    targetPeakDbfs = -42
    audioMeasurement = $audioLevels
    encoding = 'MP3, 128 kbps, 44.1 kHz, mono'
    source = 'scripts/generate-poisson-music.ps1'
    externalAssets = @()
    suggestedVolume = 1
}
$voiceoverManifestPath = Join-Path $outputDirectory 'voiceover-manifest.json'
if (Test-Path -LiteralPath $voiceoverManifestPath) {
    $voiceoverManifest = Get-Content -LiteralPath $voiceoverManifestPath -Raw -Encoding utf8 | ConvertFrom-Json
    if ($voiceoverManifest.scenes.Count -gt 0 -and $null -ne $voiceoverManifest.scenes[0].PSObject.Properties['audioMeasurement']) {
        $quietestVoiceRms = ($voiceoverManifest.scenes | ForEach-Object { $_.audioMeasurement.rmsDbfs } | Measure-Object -Minimum).Minimum
        $minimumDifference = [Math]::Round($quietestVoiceRms - $audioLevels.rmsDbfs, 4)
        $manifest.relativeToNarration = [ordered]@{
            voiceoverManifestSha256 = (Get-FileHash -LiteralPath $voiceoverManifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
            quietestNarrationRmsDbfs = $quietestVoiceRms
            minimumRmsDifferenceDb = $minimumDifference
            passesAtLeast20dB = $minimumDifference -ge 20
        }
        if ($minimumDifference -lt 20) { throw "Music is only $minimumDifference dB below the quietest narration; lower its synthesis target." }
    }
}
[IO.File]::WriteAllText((Join-Path $outputDirectory 'music-manifest.json'), ($manifest | ConvertTo-Json -Depth 5), [Text.UTF8Encoding]::new($false))
Write-Host "Saved $mp3Path"
