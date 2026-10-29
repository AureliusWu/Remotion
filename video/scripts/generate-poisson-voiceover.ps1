[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$videoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$storyboardPath = Join-Path $videoRoot 'src/poisson-process/storyboard.json'
$outputDirectory = Join-Path $videoRoot 'public/poisson-process'
$workingDirectory = Join-Path $videoRoot 'out/poisson-voiceover'
$binaryDirectory = Join-Path $videoRoot 'node_modules/@remotion/compositor-win32-x64-msvc'
$ffmpegPath = Join-Path $binaryDirectory 'ffmpeg.exe'
$ffprobePath = Join-Path $binaryDirectory 'ffprobe.exe'
$nodePath = (Get-Command node -ErrorAction Stop).Source
$sampleRate = 22050
$pauseSeconds = 0.22
$pauseSamples = [int][Math]::Round($pauseSeconds * $sampleRate)
$maximumAudioSeconds = 18.4

foreach ($requiredPath in @($storyboardPath, $ffmpegPath, $ffprobePath)) {
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required input is missing: $requiredPath"
    }
}
New-Item -ItemType Directory -Path $outputDirectory, $workingDirectory -Force | Out-Null
$storyboard = Get-Content -LiteralPath $storyboardPath -Raw -Encoding utf8 | ConvertFrom-Json

function Get-MediaDuration {
    param([Parameter(Mandatory)][string]$Path)
    $durationOutput = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Path
    if ($LASTEXITCODE -ne 0) { throw "ffprobe could not measure $Path" }
    return [double]::Parse(($durationOutput -join '').Trim(), [Globalization.CultureInfo]::InvariantCulture)
}

function Get-AudioLevels {
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$DecodedPath)
    # This bundled FFmpeg intentionally omits volumedetect; measure its decoded PCM.
    & $ffmpegPath -v error -y -i $Path -codec:a pcm_s16le -ar 44100 -ac 1 $DecodedPath
    if ($LASTEXITCODE -ne 0) { throw "Complete PCM decode failed: $Path" }
    $levelCode = @'
const fs=require('fs'); const bytes=fs.readFileSync(process.argv[1]); let offset=12,pcm;
while(offset+8<=bytes.length){const id=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4);if(id==='data')pcm=bytes.subarray(offset+8,offset+8+size);offset+=8+size+(size%2);}
if(!pcm||pcm.length%2)throw new Error('Expected 16-bit PCM data');
let peak=0,squares=0;for(let i=0;i<pcm.length;i+=2){const value=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(value));squares+=value*value;}
process.stdout.write(JSON.stringify({fullDecodePassed:true,measurement:'decoded 44.1 kHz 16-bit mono PCM',peakDbfs:Number((20*Math.log10(peak)).toFixed(4)),rmsDbfs:Number((20*Math.log10(Math.sqrt(squares/(pcm.length/2)))).toFixed(4)),sampleCount:pcm.length/2,decodedDurationSeconds:pcm.length/2/44100}));
'@
    $levelJson = & $nodePath -e $levelCode $DecodedPath
    if ($LASTEXITCODE -ne 0) { throw "PCM level measurement failed: $Path" }
    return ($levelJson -join '') | ConvertFrom-Json
}

function Read-PcmWave {
    param([Parameter(Mandatory)][string]$Path)
    $reader = [IO.BinaryReader]::new([IO.File]::OpenRead($Path))
    try {
        if ([Text.Encoding]::ASCII.GetString($reader.ReadBytes(4)) -ne 'RIFF') { throw "Not a RIFF wave: $Path" }
        $null = $reader.ReadUInt32()
        if ([Text.Encoding]::ASCII.GetString($reader.ReadBytes(4)) -ne 'WAVE') { throw "Not a WAVE file: $Path" }
        $validFormat = $false
        $pcm = $null
        while ($reader.BaseStream.Position + 8 -le $reader.BaseStream.Length) {
            $chunkId = [Text.Encoding]::ASCII.GetString($reader.ReadBytes(4))
            $chunkBytes = $reader.ReadUInt32()
            $nextPosition = $reader.BaseStream.Position + $chunkBytes + ($chunkBytes % 2)
            if ($chunkId -eq 'fmt ') {
                $format = $reader.ReadUInt16()
                $channels = $reader.ReadUInt16()
                $waveSampleRate = $reader.ReadUInt32()
                $null = $reader.ReadUInt32()
                $null = $reader.ReadUInt16()
                $bits = $reader.ReadUInt16()
                $validFormat = $format -eq 1 -and $channels -eq 1 -and $waveSampleRate -eq 22050 -and $bits -eq 16
            }
            elseif ($chunkId -eq 'data') { $pcm = $reader.ReadBytes([int]$chunkBytes) }
            $reader.BaseStream.Position = $nextPosition
        }
        if (-not $validFormat -or $null -eq $pcm -or $pcm.Length % 2 -ne 0) { throw "Expected 22.05 kHz 16-bit mono PCM: $Path" }
        return [pscustomobject]@{ Bytes = $pcm; Samples = $pcm.Length / 2; DurationSeconds = $pcm.Length / 2 / 22050 }
    }
    finally { $reader.Dispose() }
}

function Write-JoinedWave {
    param([Parameter(Mandatory)][object[]]$Segments, [Parameter(Mandatory)][string]$Path)
    $dataBytes = ($Segments | ForEach-Object { $_.Bytes.Length } | Measure-Object -Sum).Sum + ($Segments.Count - 1) * $pauseSamples * 2
    $writer = [IO.BinaryWriter]::new([IO.File]::Open($Path, [IO.FileMode]::Create))
    try {
        $writer.Write([Text.Encoding]::ASCII.GetBytes('RIFF'))
        $writer.Write([uint32](36 + $dataBytes))
        $writer.Write([Text.Encoding]::ASCII.GetBytes('WAVEfmt '))
        $writer.Write([uint32]16)
        $writer.Write([uint16]1)
        $writer.Write([uint16]1)
        $writer.Write([uint32]$sampleRate)
        $writer.Write([uint32]($sampleRate * 2))
        $writer.Write([uint16]2)
        $writer.Write([uint16]16)
        $writer.Write([Text.Encoding]::ASCII.GetBytes('data'))
        $writer.Write([uint32]$dataBytes)
        for ($segmentIndex = 0; $segmentIndex -lt $Segments.Count; $segmentIndex++) {
            $writer.Write([byte[]]$Segments[$segmentIndex].Bytes)
            if ($segmentIndex -lt $Segments.Count - 1) { $writer.Write([byte[]]::new($pauseSamples * 2)) }
        }
    }
    finally { $writer.Dispose() }
}

$speaker = $null
$manifestScenes = @()
$failures = @()
try {
    $speaker = New-Object -ComObject SAPI.SpVoice
    $availableVoices = $speaker.GetVoices()
    $selectedVoice = $null
    for ($voiceIndex = 0; $voiceIndex -lt $availableVoices.Count; $voiceIndex++) {
        $candidateVoice = $availableVoices.Item($voiceIndex)
        if ($candidateVoice.GetDescription() -eq 'Microsoft Huihui Desktop - Chinese (Simplified)') { $selectedVoice = $candidateVoice; break }
    }
    if ($null -eq $selectedVoice) { throw 'The installed Microsoft Huihui Simplified Chinese SAPI voice is required.' }
    $speaker.Voice = $selectedVoice
    $speaker.Volume = 100
    $voiceName = $selectedVoice.GetDescription()

    foreach ($scene in $storyboard.scenes) {
        $chosenRate = $null
        $chosenSegments = @()
        $joinedDuration = 0
        $baseName = [IO.Path]::GetFileNameWithoutExtension($scene.file)
        foreach ($rate in 0..3) {
            $speaker.Rate = $rate
            $segments = @()
            for ($lineIndex = 0; $lineIndex -lt $scene.lines.Count; $lineIndex++) {
                $linePath = Join-Path $workingDirectory ("{0}-rate{1}-line{2:D2}.wav" -f $baseName, $rate, ($lineIndex + 1))
                $stream = $null
                try {
                    $stream = New-Object -ComObject SAPI.SpFileStream
                    $stream.Format.Type = 22
                    $stream.Open($linePath, 3, $false)
                    $speaker.AudioOutputStream = $stream
                    $speaker.Speak([string]$scene.lines[$lineIndex], 0) | Out-Null
                }
                finally { if ($null -ne $stream) { $stream.Close() } }
                $segments += Read-PcmWave -Path $linePath
            }
            $joinedDuration = ($segments | Measure-Object -Property DurationSeconds -Sum).Sum + ($scene.lines.Count - 1) * $pauseSeconds
            # Include MP3 encoder-padding headroom without shortening any sentence.
            if ($joinedDuration -le ($maximumAudioSeconds - 0.08)) { $chosenRate = $rate; $chosenSegments = $segments; break }
        }
        if ($null -eq $chosenRate) {
            $failures += [ordered]@{ file = $scene.file; durationAtRate3 = [Math]::Round($joinedDuration, 6); limitSeconds = $maximumAudioSeconds; lines = $scene.lines }
            Write-Warning ("{0} exceeds the limit at rate 3: {1:N3}s > {2}s. Shorten storyboard text." -f $scene.file, $joinedDuration, $maximumAudioSeconds)
            continue
        }

        $joinedWavPath = Join-Path $workingDirectory "$baseName.wav"
        $mp3Path = Join-Path $outputDirectory $scene.file
        Write-JoinedWave -Segments $chosenSegments -Path $joinedWavPath
        & $ffmpegPath -hide_banner -loglevel error -y -i $joinedWavPath -vn -codec:a libmp3lame -b:a 128k -ar 44100 -ac 1 $mp3Path
        if ($LASTEXITCODE -ne 0) { throw "MP3 encoding failed: $($scene.file)" }
        $mp3Duration = Get-MediaDuration -Path $mp3Path
        if ($mp3Duration -gt $maximumAudioSeconds) { throw "Encoded narration exceeds 18.4 seconds: $($scene.file)" }
        $audioLevels = Get-AudioLevels -Path $mp3Path -DecodedPath (Join-Path $workingDirectory "$baseName-decoded.wav")

        $captions = @()
        $elapsedSamples = 0
        for ($lineIndex = 0; $lineIndex -lt $scene.lines.Count; $lineIndex++) {
            $startSeconds = $storyboard.fromSeconds + $elapsedSamples / $sampleRate
            $spokenEndSeconds = $startSeconds + $chosenSegments[$lineIndex].DurationSeconds
            $endSeconds = [Math]::Min($spokenEndSeconds + 0.15, $scene.sceneDurationSeconds - 0.1)
            if ($lineIndex -lt $scene.lines.Count - 1) { $endSeconds = [Math]::Min($endSeconds, $spokenEndSeconds + $pauseSeconds - 0.02) }
            $captions += [ordered]@{ text = $scene.lines[$lineIndex]; startSeconds = [Math]::Round($startSeconds, 6); endSeconds = [Math]::Round($endSeconds, 6) }
            $elapsedSamples += $chosenSegments[$lineIndex].Samples + $pauseSamples
        }

        $manifestScenes += [ordered]@{
            file = $scene.file
            text = $scene.lines -join ''
            voice = $voiceName
            sapiRate = $chosenRate
            durationSeconds = [Math]::Round($mp3Duration, 6)
            rawWavDurationSeconds = [Math]::Round($joinedDuration, 6)
            sceneDurationSeconds = $scene.sceneDurationSeconds
            fromSeconds = $storyboard.fromSeconds
            maxAudioDurationSeconds = $maximumAudioSeconds
            pauseBetweenLinesSeconds = $pauseSeconds
            audioMeasurement = $audioLevels
            captions = $captions
        }
        Write-Host ("{0}: rate={1}, audio={2:N3}s, captions={3}" -f $scene.file, $chosenRate, $mp3Duration, $captions.Count)
    }
}
finally {
    if ($null -ne $speaker) { $speaker.AudioOutputStream = $null; [Runtime.InteropServices.Marshal]::ReleaseComObject($speaker) | Out-Null }
}

$manifest = [ordered]@{
    generatedAt = (Get-Date).ToString('o')
    generator = 'Windows SAPI, local installed Microsoft Huihui Desktop voice; sentence-level PCM timing'
    storyboard = 'src/poisson-process/storyboard.json'
    language = 'zh-CN'
    encoding = 'MP3, 128 kbps, 44.1 kHz, mono'
    fps = $storyboard.fps
    totalSceneDurationSeconds = ($storyboard.scenes | Measure-Object -Property sceneDurationSeconds -Sum).Sum
    scenes = $manifestScenes
    failures = $failures
}
$manifestPath = Join-Path $outputDirectory 'voiceover-manifest.json'
[IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 10), [Text.UTF8Encoding]::new($false))
if ($failures.Count -gt 0) { throw "$($failures.Count) scene(s) require shorter storyboard narration. See $manifestPath" }
Write-Host "Saved $manifestPath"
