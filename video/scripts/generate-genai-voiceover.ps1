[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$videoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputDirectory = Join-Path $videoRoot 'public/china-genai'
$workingDirectory = Join-Path $videoRoot 'out/genai-voiceover'
$binaryDirectory = Join-Path $videoRoot 'node_modules/@remotion/compositor-win32-x64-msvc'
$ffmpegPath = Join-Path $binaryDirectory 'ffmpeg.exe'
$ffprobePath = Join-Path $binaryDirectory 'ffprobe.exe'

foreach ($binaryPath in @($ffmpegPath, $ffprobePath)) {
    if (-not (Test-Path -LiteralPath $binaryPath -PathType Leaf)) {
        throw "Required bundled binary is missing: $binaryPath. Run npm ci in video/ first."
    }
}
New-Item -ItemType Directory -Path $outputDirectory, $workingDirectory -Force | Out-Null

$scenes = @(
    [pscustomobject]@{ File = '01-latest.mp3'; SceneSeconds = 10; Text = '中国有多少人在使用生成式人工智能？截至二零二六年上半年，最新公开统计是：突破七亿人。' },
    [pscustomobject]@{ File = '02-history.mp3'; SceneSeconds = 14; Text = '把公开记录连起来看：二零二四年六月，二点三亿；年底，二点四九亿。二零二五年六月，五点一五亿；年底，六点零二亿。二零二六年上半年，突破七亿。' },
    [pscustomobject]@{ File = '03-growth.mp3'; SceneSeconds = 10; Text = '仅看二零二五年，用户规模就增加了三点五三亿人，同比增长百分之一百四十一点七。' },
    [pscustomobject]@{ File = '04-penetration.mp3'; SceneSeconds = 8; Text = '报告显示，过半人口在统计期内使用过生成式人工智能。' },
    [pscustomobject]@{ File = '05-uses.mp3'; SceneSeconds = 10; Text = '回答问题最普遍。图像、视频、文本和办公，也是主要用途。同一用户可选择多个场景。' },
    [pscustomobject]@{ File = '06-method.mp3'; SceneSeconds = 8; Text = '资料检索截至十月二十九日。最新统计期是二零二六年上半年，不代表实时人数。' }
)

function Get-MediaDuration {
    param([Parameter(Mandatory)][string]$Path)
    $durationOutput = & $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $Path
    if ($LASTEXITCODE -ne 0) { throw "ffprobe could not measure $Path" }
    return [double]::Parse(($durationOutput -join '').Trim(), [Globalization.CultureInfo]::InvariantCulture)
}

$speaker = $null
$selectedVoice = $null
$manifestScenes = @()
try {
    $speaker = New-Object -ComObject SAPI.SpVoice
    $availableVoices = $speaker.GetVoices()
    for ($voiceIndex = 0; $voiceIndex -lt $availableVoices.Count; $voiceIndex++) {
        $candidateVoice = $availableVoices.Item($voiceIndex)
        if ($candidateVoice.GetDescription() -eq 'Microsoft Huihui Desktop - Chinese (Simplified)') {
            $selectedVoice = $candidateVoice
            break
        }
    }
    if ($null -eq $selectedVoice) { throw 'The installed Microsoft Huihui Simplified Chinese SAPI voice is required.' }
    $speaker.Voice = $selectedVoice
    $speaker.Volume = 100
    $voiceName = $selectedVoice.GetDescription()

    foreach ($scene in $scenes) {
        $wavPath = Join-Path $workingDirectory ([IO.Path]::ChangeExtension($scene.File, '.wav'))
        $mp3Path = Join-Path $outputDirectory $scene.File
        $maxAudioSeconds = $scene.SceneSeconds - 1.2
        $chosenRate = $null
        $wavDuration = 0

        # Raise the native speech rate only as far as this scene requires. No trimming
        # or post-synthesis speed changes: every sentence is spoken in full.
        foreach ($rate in 0..4) {
            $fileStream = $null
            try {
                $speaker.Rate = $rate
                $fileStream = New-Object -ComObject SAPI.SpFileStream
                $fileStream.Format.Type = 22 # 22.05 kHz, 16-bit mono PCM
                $fileStream.Open($wavPath, 3, $false) # SSFMCreateForWrite
                $speaker.AudioOutputStream = $fileStream
                $speaker.Speak($scene.Text, 0) | Out-Null # synchronous, full text
            }
            finally {
                if ($null -ne $fileStream) { $fileStream.Close() }
            }
            $wavDuration = Get-MediaDuration -Path $wavPath
            # Reserve encoder-padding margin as well as the scene's 1.2 seconds.
            if ($wavDuration -lt ($maxAudioSeconds - 0.15)) {
                $chosenRate = $rate
                break
            }
        }
        if ($null -eq $chosenRate -and $scene.File -eq '04-penetration.mp3' -and $wavDuration -lt ($scene.SceneSeconds - 0.95)) {
            $maxAudioSeconds = $scene.SceneSeconds - 0.8
            $chosenRate = 4
        }
        if ($null -eq $chosenRate) { throw "Narration still exceeds its scene at rate 4; shorten the script: $($scene.File)" }

        & $ffmpegPath -hide_banner -loglevel error -y -i $wavPath -vn -codec:a libmp3lame -b:a 128k -ar 44100 -ac 1 $mp3Path
        if ($LASTEXITCODE -ne 0) { throw "MP3 encoding failed: $($scene.File)" }
        $mp3Duration = Get-MediaDuration -Path $mp3Path
        if ($mp3Duration -ge $maxAudioSeconds) { throw "Encoded narration exceeds its scene: $($scene.File)" }

        $manifestScenes += [ordered]@{
            file = $scene.File
            text = $scene.Text
            voice = $voiceName
            sapiRate = $chosenRate
            durationSeconds = [Math]::Round($mp3Duration, 6)
            rawWavDurationSeconds = [Math]::Round($wavDuration, 6)
            sceneDurationSeconds = $scene.SceneSeconds
            fromSeconds = 0.6
            maxAudioDurationSeconds = $maxAudioSeconds
        }
        Write-Host ("{0}: rate={1}, audio={2:N3}s, scene={3}s" -f $scene.File, $chosenRate, $mp3Duration, $scene.SceneSeconds)
    }
}
finally {
    if ($null -ne $speaker) {
        $speaker.AudioOutputStream = $null
        [Runtime.InteropServices.Marshal]::ReleaseComObject($speaker) | Out-Null
    }
}

$manifest = [ordered]@{
    generatedAt = (Get-Date).ToString('o')
    generator = 'Windows SAPI, local installed Microsoft Huihui Desktop voice'
    language = 'zh-CN'
    encoding = 'MP3, 128 kbps, 44.1 kHz, mono'
    fps = 60
    totalSceneDurationSeconds = ($scenes | Measure-Object -Property SceneSeconds -Sum).Sum
    scenes = $manifestScenes
}
$manifestPath = Join-Path $outputDirectory 'voiceover-manifest.json'
[IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
Write-Host "Saved $manifestPath"
