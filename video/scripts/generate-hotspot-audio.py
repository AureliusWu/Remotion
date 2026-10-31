"""Offline narration and original music for the 180-second Daily Ten film.

Run with out/ai-history-tts/venv/Scripts/python.exe. The existing Kokoro
generator and its content-addressed caches are reused without changing its
source or publishing anything to public/ai-history.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "out" / "daily-ten-audio"
OUTPUT = ROOT / "public" / "daily-ten"
TTS_TOOLS = ROOT / "scripts" / "ai-history-tts"
sys.path.insert(0, str(TTS_TOOLS))
import make_samples  # noqa: E402
import generate as kokoro  # noqa: E402

# kaldifst uses narrow Windows paths. A junction leaves the single verified
# model/cache in the project but gives that library an ASCII-only path.
MODEL_SHA256 = "05d793700b0b507f760c183c0e39bdd6a97b43d32fdc7bf7b54a5179f1b11222"
ORIGINAL_MODEL = make_samples.MODEL
MODEL_ALIAS = Path.home() / ".codex" / "runtimes" / "remotion-kokoro-05d79370"
if not str(ORIGINAL_MODEL).isascii() and MODEL_ALIAS.is_dir():
    if MODEL_ALIAS.resolve() != ORIGINAL_MODEL.resolve():
        raise RuntimeError("The Kokoro model junction points to a different project")
    make_samples.MODEL = MODEL_ALIAS
    kokoro.MODEL = MODEL_ALIAS


def digest(file: Path) -> str:
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def write_json(file: Path, value: object) -> None:
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def levels(samples: np.ndarray) -> dict:
    values = samples.astype(np.float64)
    peak = float(np.max(np.abs(values)))
    rms = float(np.sqrt(np.mean(values ** 2)))
    return {
        "peakDbfs": round(20 * np.log10(max(peak, 1e-15)), 4),
        "rmsDbfs": round(20 * np.log10(max(rms, 1e-15)), 4),
        "clippedSampleCount": int(np.count_nonzero(np.abs(values) >= 1)),
        "sampleCount": int(len(values)),
    }


def write_subtitles(scenes: list[dict]) -> None:
    def timestamp(seconds: float) -> str:
        total = round(seconds * 1000)
        hours, rest = divmod(total, 3600000)
        minutes, rest = divmod(rest, 60000)
        second, millis = divmod(rest, 1000)
        return f"{hours:02}:{minutes:02}:{second:02},{millis:03}"

    blocks, elapsed = [], 0.0
    for scene in scenes:
        for caption in scene["captions"]:
            blocks.append(f"{len(blocks) + 1}\n"
                          f"{timestamp(elapsed + caption['startSeconds'])} --> "
                          f"{timestamp(elapsed + caption['endSeconds'])}\n{caption['text']}\n")
        elapsed += scene["sceneDurationSeconds"]
    (OUTPUT / "captions.zh.srt").write_text("\n".join(blocks), encoding="utf-8")


def encode_and_measure(wav: Path, mp3: Path, rate: int) -> dict:
    ffmpeg = make_samples.FFMPEG
    run_options = {"check": True, "creationflags": subprocess.CREATE_NO_WINDOW}
    subprocess.run([str(ffmpeg), "-v", "error", "-y", "-i", str(wav),
                    "-c:a", "libmp3lame", "-b:a", "160k", "-ar", "44100",
                    "-ac", "1", str(mp3)], **run_options)
    decoded = WORK / f"{mp3.stem}-decoded.wav"
    subprocess.run([str(ffmpeg), "-v", "error", "-xerror", "-y", "-i", str(mp3),
                    "-c:a", "pcm_s16le", "-ar", str(rate), "-ac", "1",
                    str(decoded)], **run_options)
    values, actual_rate = sf.read(decoded, dtype="float32")
    if actual_rate != rate or not values.size or not np.isfinite(values).all():
        raise RuntimeError(f"Invalid decoded audio: {mp3}")
    return {"fullDecodePassed": True, "sampleRate": rate,
            "decodedDurationSeconds": round(len(values) / rate, 6),
            "measurement": "decoded mono PCM16; dBFS, not LUFS", **levels(values)}


def make_music() -> None:
    rate, seconds = 24000, 180
    samples = np.zeros(rate * seconds, dtype=np.float64)
    chords = [(50, 57, 61, 64), (52, 59, 62, 66),
              (55, 62, 66, 69), (57, 64, 69, 71)]
    hz = lambda midi: 440 * 2 ** ((midi - 69) / 12)
    beat = 60 / 76
    pattern = [(0, 1), (1.5, 2), (3, 3), (4.5, 1), (6.5, 2)]
    for bar in range(30):
        start = bar * beat * 8
        chord = chords[bar % len(chords)]
        for offset, voice in pattern:
            first = int((start + offset * beat) * rate)
            last = min(len(samples), first + int(4.8 * rate))
            if first >= len(samples):
                continue
            t = np.arange(last - first) / rate
            f = hz(chord[voice] + 12)
            envelope = (1 - np.exp(-42 * t)) * np.exp(-t / 1.15) * np.clip((4.8 - t) / .7, 0, 1)
            tone = np.sin(2 * np.pi * f * t) + .13 * np.sin(2 * np.pi * f * 2 * t)
            samples[first:last] += .35 * envelope * tone
        first = int(start * rate)
        last = min(len(samples), first + int(10 * rate))
        if first >= len(samples):
            continue
        t = np.arange(last - first) / rate
        envelope = np.minimum(1, t / 2.7) * np.clip((10 - t) / 4, 0, 1)
        pad = np.sin(2 * np.pi * hz(chord[0] - 12) * t)
        pad += .35 * np.sin(2 * np.pi * hz(chord[1] - 12) * t)
        samples[first:last] += .065 * envelope * pad
    t = np.arange(len(samples)) / rate
    samples *= np.minimum(1, t / 3) * np.minimum(1, (seconds - t) / 7)
    rms, peak = np.sqrt(np.mean(samples ** 2)), np.max(np.abs(samples))
    samples *= min(10 ** (-41 / 20) / rms, 10 ** (-29 / 20) / peak)
    wav = WORK / "music-original.wav"
    mp3 = OUTPUT / "music.mp3"
    sf.write(wav, samples, rate, subtype="PCM_16")
    measurement = encode_and_measure(wav, mp3, rate)
    report = {
        "title": "Ten Windows, One Day", "original": True,
        "deterministic": True, "externalSamples": [],
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "durationSeconds": seconds, "tempoBpm": 76,
        "source": "scripts/generate-hotspot-audio.py --music-only",
        "sha256": digest(mp3), "bytes": mp3.stat().st_size,
        "audioMeasurement": measurement,
    }
    write_json(OUTPUT / "music-manifest.json", report)
    print(json.dumps(report, ensure_ascii=False), flush=True)


def make_voice(storyboard: Path, speed: float) -> None:
    if not str(make_samples.MODEL).isascii():
        raise RuntimeError(
            "kaldifst requires an ASCII model path on this Windows host. "
            f"Create a directory junction at {MODEL_ALIAS} pointing to {ORIGINAL_MODEL}."
        )
    if digest(make_samples.MODEL / "model.int8.onnx") != MODEL_SHA256:
        raise RuntimeError("Kokoro model SHA-256 mismatch")
    plan = json.loads(storyboard.read_text(encoding="utf-8-sig"))
    shots = plan["shots"]
    durations = [float(shot["durationSeconds"]) for shot in shots]
    if abs(sum(durations) - 180) > 1e-6:
        raise ValueError("All Daily Ten scenes must total exactly 180 seconds")
    argv = sys.argv
    try:
        sys.argv = ["generate.py", str(storyboard), "--output", str(OUTPUT),
                    "--workers", "2", "--threads", "2", "--speaker", "3",
                    "--speed", str(speed), "--gap", "0.2"]
        kokoro.main()
    finally:
        sys.argv = argv
    manifest_path = OUTPUT / "voiceover-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["captionsRelativeTo"] = "scene start; fromSeconds is added to sentence PCM timing"
    manifest["totalSceneDurationSeconds"] = 180
    manifest["fps"] = 60
    manifest["modelPathWorkaround"] = {"reason": "kaldifst narrow Windows path",
                                       "singleModelCache": str(ORIGINAL_MODEL),
                                       "asciiJunction": str(make_samples.MODEL)}
    failures = []
    for shot, scene in zip(shots, manifest["scenes"], strict=True):
        if shot["id"] != scene["id"]:
            raise ValueError("Narration manifest order differs from storyboard")
        delay = float(shot.get("fromSeconds", .6))
        duration = float(shot["durationSeconds"])
        scene["fromSeconds"] = delay
        scene["sceneDurationSeconds"] = duration
        for caption in scene["captions"]:
            caption["startSeconds"] = round(caption["startSeconds"] + delay, 6)
            caption["endSeconds"] = round(caption["endSeconds"] + delay, 6)
        if scene["durationSeconds"] + delay > duration - .15:
            failures.append({"id": scene["id"], "reason": "narration exceeds safe scene duration",
                             "audioSeconds": scene["durationSeconds"], "delaySeconds": delay,
                             "sceneSeconds": duration})
        if any(caption["endSeconds"] > duration for caption in scene["captions"]):
            failures.append({"id": scene["id"], "reason": "caption exceeds scene"})
    manifest["failures"] = failures
    manifest["status"] = "failed" if failures else "passed"
    if not failures:
        for scene in manifest["scenes"]:
            if digest(OUTPUT / scene["file"]) != scene["sha256"]:
                manifest["status"] = "failed"
                manifest["failures"].append({"id": scene["id"], "reason": "published hash mismatch"})
    write_json(manifest_path, manifest)
    write_json(ROOT / "effects" / "daily-ten" / "audio-manifest.json", manifest)
    if manifest["status"] != "passed":
        raise ValueError(f"Narration validation failed; do not cut speech: {manifest['failures']}")
    write_subtitles(manifest["scenes"])
    write_json(WORK / "audio-validation.json", {
        "status": "passed", "timelineSeconds": 180, "sceneCount": len(shots),
        "captionCount": sum(len(scene["captions"]) for scene in manifest["scenes"]),
        "fullDecodeAndPublishedHashesPassed": True,
        "highestPeakDbfs": max(scene["audioMeasurement"]["peakDbfs"] for scene in manifest["scenes"]),
        "rmsDbfsRange": [min(scene["audioMeasurement"]["rmsDbfs"] for scene in manifest["scenes"]),
                         max(scene["audioMeasurement"]["rmsDbfs"] for scene in manifest["scenes"])],
        "minimumTailRoomSeconds": round(min(scene["sceneDurationSeconds"] - scene["fromSeconds"]
                                             - scene["durationSeconds"] for scene in manifest["scenes"]), 6),
        "narrationFiles": [{"id": scene["id"], "file": scene["file"],
                            "durationSeconds": scene["durationSeconds"], "sha256": scene["sha256"]}
                           for scene in manifest["scenes"]],
    })
    print(f"Verified {len(shots)} narration clips on the exact 180-second timeline", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("storyboard", type=Path, nargs="?")
    parser.add_argument("--music-only", action="store_true")
    parser.add_argument("--voice-only", action="store_true")
    parser.add_argument("--speed", type=float, default=1.0)
    args = parser.parse_args()
    if args.music_only and args.voice_only:
        parser.error("Choose only one of --music-only and --voice-only")
    WORK.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if not args.voice_only:
        make_music()
    if not args.music_only:
        if not args.storyboard:
            parser.error("A storyboard with shots, narration, and durationSeconds is required")
        make_voice(args.storyboard.resolve(), args.speed)


if __name__ == "__main__":
    main()
