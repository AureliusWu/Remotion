"""Fully decode an edition's narration and measure PCM levels and clipping."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

sys.dont_write_bytecode = True
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
FFMPEG = ROOT / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"


def digest(file: Path) -> str:
    with file.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def decode_measure(source: Path, output: Path) -> dict:
    subprocess.run([str(FFMPEG), "-v", "error", "-xerror", "-y", "-i", str(source),
                    "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "1", str(output)],
                   check=True, creationflags=subprocess.CREATE_NO_WINDOW)
    samples, rate = sf.read(output, dtype="int16")
    if rate != 48000 or samples.ndim != 1 or not samples.size:
        raise ValueError("Expected nonempty decoded 48kHz mono PCM16")
    values = samples.astype(np.float64) / 32768
    peak = float(np.max(np.abs(values)))
    rms = float(np.sqrt(np.mean(values ** 2)))
    if peak <= 0 or rms <= 0 or not np.isfinite(values).all():
        raise ValueError("Silent or invalid decoded audio")
    clipping = int(np.count_nonzero(np.abs(samples.astype(np.int32)) >= 32767))
    return {"fullDecodePassed": True, "sampleRate": rate,
            "sampleCount": len(samples), "durationSeconds": round(len(samples) / rate, 6),
            "peakDbfs": round(20 * np.log10(peak), 4),
            "rmsDbfs": round(20 * np.log10(rms), 4),
            "clippedSampleCount": clipping}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("edition")
    args = parser.parse_args()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", args.edition):
        parser.error("Edition must be a safe lower-case directory name")
    source = ROOT / "public" / args.edition
    work = ROOT / "out" / f"{args.edition}-audio"
    decoded = work / "pcm-check"
    decoded.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((source / "voiceover-manifest.json").read_text(encoding="utf-8-sig"))
    storyboard_file = ROOT / "effects" / args.edition / "storyboard.json"
    plan = json.loads(storyboard_file.read_text(encoding="utf-8-sig"))
    if manifest["status"] != "passed" or digest(storyboard_file) != manifest["storyboardSha256"]:
        raise ValueError("The final narration manifest must match the current locked storyboard")
    report = {"edition": args.edition, "status": "running",
              "checkedAt": datetime.now(timezone.utc).isoformat(),
              "measurement": "full decoded 48kHz mono PCM16; dBFS, not LUFS",
              "scenes": [], "captionCount": 0}
    seconds = 0
    for shot, scene in zip(plan["shots"], manifest["scenes"], strict=True):
        if shot["id"] != scene["id"] or scene["sceneDurationSeconds"] != shot["durationSeconds"]:
            raise ValueError("Scene order or duration differs from the storyboard")
        audio_file = (source / scene["file"]).resolve()
        if not audio_file.is_relative_to(source.resolve()) or digest(audio_file) != scene["sha256"]:
            raise ValueError("Invalid narration filename or SHA-256")
        if scene["durationSeconds"] + scene["fromSeconds"] > shot["durationSeconds"] - .15:
            raise ValueError(f"Narration overruns scene: {scene['id']}")
        if [caption["text"] for caption in scene["captions"]] != shot["narration"]:
            raise ValueError(f"Subtitles differ from the narration source: {scene['id']}")
        previous_end = 0
        for caption in scene["captions"]:
            if (caption["startSeconds"] < previous_end or caption["endSeconds"] <= caption["startSeconds"]
                    or caption["endSeconds"] > shot["durationSeconds"]):
                raise ValueError(f"Overlapping or out-of-scene caption: {scene['id']}")
            previous_end = caption["endSeconds"]
        measurement = decode_measure(audio_file, decoded / f"{scene['id']}.wav")
        if measurement["clippedSampleCount"] or not -30 < measurement["rmsDbfs"] < -16:
            raise ValueError(f"Clipped or unexpected narration level: {scene['id']}")
        report["scenes"].append({"id": scene["id"], **measurement,
                                 "captionCount": len(scene["captions"]),
                                 "tailRoomSeconds": round(shot["durationSeconds"] - scene["fromSeconds"]
                                                          - scene["durationSeconds"], 6)})
        report["captionCount"] += len(scene["captions"])
        seconds += shot["durationSeconds"]
    if abs(seconds - 180) > 1e-6:
        raise ValueError("Narration scene timeline must be exactly 180 seconds")
    srt = (source / "captions.zh.srt").read_text(encoding="utf-8-sig")
    if srt.count(" --> ") != report["captionCount"]:
        raise ValueError("Independent SRT count differs from the narration manifest")
    music = manifest["music"]
    music_file = (ROOT / "public" / music["file"]).resolve()
    if not music_file.is_relative_to((ROOT / "public").resolve()) or digest(music_file) != music["sha256"]:
        raise ValueError("Original music SHA-256 mismatch")
    report["music"] = decode_measure(music_file, decoded / "music.wav")
    if report["music"]["clippedSampleCount"] or report["music"]["durationSeconds"] != 180:
        raise ValueError("Original music duration or clipping check failed")
    report.update({"status": "passed", "timelineSeconds": seconds,
                   "sceneCount": len(report["scenes"]), "captionSourceAndTimingPassed": True,
                   "totalClippedSampleCount": sum(scene["clippedSampleCount"] for scene in report["scenes"]),
                   "highestPeakDbfs": max(scene["peakDbfs"] for scene in report["scenes"]),
                   "rmsDbfsRange": [min(scene["rmsDbfs"] for scene in report["scenes"]),
                                    max(scene["rmsDbfs"] for scene in report["scenes"])]})
    (work / "pcm-audio-validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                                                    encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "scenes"},
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
