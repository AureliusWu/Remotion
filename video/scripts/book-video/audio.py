"""Read a finalized book script, then synthesize and lay out the actual speech."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from tempfile import TemporaryDirectory
import uuid

import numpy as np
import sherpa_onnx
import soundfile as sf

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "ai-history-tts"))
import generate as kokoro
import make_samples

FPS = 60
SOURCE_RATE = 24_000
SAMPLE_RATE = 48_000
STEP = SOURCE_RATE // FPS
MODEL_SHA256 = "05d793700b0b507f760c183c0e39bdd6a97b43d32fdc7bf7b54a5179f1b11222"


def parse_script(raw):
    script = json.loads(raw.decode("utf-8-sig"))
    scenes = script.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        raise ValueError("The finalized script must contain scenes")
    ids = set()
    for scene in scenes:
        scene_id = scene.get("id", "")
        lines = scene.get("lines")
        if not re.fullmatch(r"[a-z][a-z0-9-]{0,63}", scene_id) or scene_id in ids:
            raise ValueError(f"Invalid or duplicate scene ID: {scene_id}")
        if not isinstance(lines, list) or not lines or any(
            not isinstance(line, str) or not line.strip() for line in lines
        ):
            raise ValueError(f"Missing spoken lines in {scene_id}")
        ids.add(scene_id)
    rules = script.get("pronunciations", {})
    if not isinstance(rules, dict) or any(
        not key.strip() or not isinstance(value, str) or not value.strip()
        for key, value in rules.items()
    ):
        raise ValueError("Pronunciation overrides must map nonempty text to spoken text")
    return scenes, rules


class Speech:
    def __init__(self, speaker, speed):
        runtime = Path(sys.executable).parent.parent.parent
        model = Path(os.environ.get("REMOTION_KOKORO_MODEL", runtime / "kokoro-int8-multi-lang-v1_1"))
        if os.name == "nt" and not str(model).isascii():
            alias = Path.home() / ".codex" / "runtimes" / "remotion-kokoro-05d79370"
            if not alias.is_dir() or alias.resolve() != model.resolve():
                raise ValueError("Set REMOTION_KOKORO_MODEL to the verified ASCII Kokoro model path")
            model = alias
        if kokoro.sha256(model / "model.int8.onnx") != MODEL_SHA256:
            raise ValueError("Kokoro model SHA-256 mismatch")
        self.synthesis = {
            "engine": "sherpa-onnx", "version": sherpa_onnx.__version__,
            "modelSha256": MODEL_SHA256, "speakerId": speaker, "speed": speed,
        }
        self.speaker = speaker
        self.speed = speed
        self.cache = runtime / "line-cache"
        self.cache.mkdir(exist_ok=True)
        self.lexicon = set()
        for name in ("lexicon-zh.txt", "lexicon-us-en.txt"):
            entries = (model / name).read_text(encoding="utf-8").splitlines()
            self.lexicon.update(line.split()[0].lower() for line in entries if line.strip())
        make_samples.MODEL = model
        self.engine = None

    def line(self, text, rules):
        spoken = text
        for key in sorted(rules, key=len, reverse=True):
            spoken = spoken.replace(key, rules[key])
        spoken = kokoro.spoken_text(spoken)
        unknown = {
            word for word in re.findall(r"[A-Za-z]+(?:-[0-9]+)?", spoken)
            if word.lower() not in self.lexicon
        }
        if unknown:
            raise ValueError(f"Provide pronunciation overrides for: {', '.join(sorted(unknown))}")
        key = kokoro.content_hash({"text": spoken, "synthesis": self.synthesis})
        cache = self.cache / f"{key}.wav"
        if cache.exists():
            samples, rate = sf.read(cache, dtype="float32")
        else:
            if self.engine is None:
                self.engine = make_samples.make_engine(4)
            audio = self.engine.generate(text=spoken, sid=self.speaker, speed=self.speed)
            samples, rate = np.asarray(audio.samples, dtype=np.float32), audio.sample_rate
        if (rate != SOURCE_RATE or samples.ndim != 1 or not samples.size
                or not np.isfinite(samples).all()):
            raise ValueError(f"Invalid voice samples for {text}")
        active = np.flatnonzero(np.abs(samples) > 0.001)
        if not active.size:
            raise ValueError(f"Silent voice samples for {text}")
        if not cache.exists():
            temporary = cache.with_name(f"{cache.stem}.{uuid.uuid4().hex}.wav")
            sf.write(temporary, samples, rate, subtype="FLOAT")
            temporary.replace(cache)
        # Keep natural consonant attacks and a short decay outside the active range.
        return samples[max(0, int(active[0]) - 480):int(active[-1]) + 1680]


def arrange(scenes, rules, speech):
    frame = 0
    arranged = []
    audio = []

    def add_silence(frames):
        nonlocal frame
        audio.append(np.zeros(frames * STEP, dtype=np.float32))
        frame += frames

    for index, scene in enumerate(scenes):
        start = frame
        add_silence(18)
        lines = []
        for text in scene["lines"]:
            samples = speech.line(text, rules)
            duration = (len(samples) + STEP - 1) // STEP
            audio.append(np.pad(samples, (0, duration * STEP - len(samples))))
            line_start = frame
            frame += duration
            add_silence(5 if text.endswith(("，", "、", "：")) else 10)
            lines.append({"text": text, "startFrame": line_start, "endFrame": frame - 2})
        add_silence(96 if index == len(scenes) - 1 else 27)
        arranged.append({"id": scene["id"], "startFrame": start, "endFrame": frame, "lines": lines})
    return np.concatenate(audio), arranged, frame


def ffmpeg_run(binary, source, args):
    command = [binary, "-hide_banner", "-nostdin", "-xerror", "-y", "-i", str(source), *args]
    result = subprocess.run(
        command, capture_output=True, encoding="utf-8", errors="replace",
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
    )
    if result.returncode:
        raise RuntimeError(f"FFmpeg audio processing failed: {result.stderr[-2000:]}")
    return result.stderr


def measure(binary, source):
    output = ffmpeg_run(binary, source, [
        "-af", "loudnorm=I=-16:TP=-2:LRA=9:print_format=json", "-f", "null", "-",
    ])
    return json.loads(output[output.rfind("{"):output.rfind("}") + 1])


def normalize(binary, raw, output, frame_count):
    initial = measure(binary, raw)
    samples = frame_count * (SAMPLE_RATE // FPS)
    gain = -16 - float(initial["input_i"])
    if float(initial["input_tp"]) + gain <= -2:
        effect = f"volume={gain:.4f}dB"
    else:
        effect = "loudnorm=I=-16:TP=-2:LRA=9"
    exact_length = f"aresample={SAMPLE_RATE},apad=whole_len={samples},atrim=end_sample={samples}"
    ffmpeg_run(binary, raw, ["-af", f"{effect},{exact_length}", "-c:a", "pcm_s24le", str(output)])
    measured = measure(binary, output)
    info = sf.info(output)
    loudness, peak = float(measured["input_i"]), float(measured["input_tp"])
    profile = (info.samplerate, info.channels, info.frames, info.subtype)
    if profile != (SAMPLE_RATE, 2, samples, "PCM_24") or not -17 <= loudness <= -15 or peak > -1:
        raise ValueError(f"Narration failed audio verification: {info}, {loudness} LUFS, {peak} dBTP")
    return {
        "sampleRate": SAMPLE_RATE, "channels": 2, "sampleFrames": samples, "encoding": "PCM_24",
        "integratedLufs": loudness, "truePeakDbtp": peak, "fullDecodePassed": True,
    }


def main(script_file, output, binary, speaker, speed):
    raw_script = script_file.read_bytes()
    script_sha = hashlib.sha256(raw_script).hexdigest()
    scenes, rules = parse_script(raw_script)
    output.mkdir(parents=True, exist_ok=True)
    lock = output / ".audio-build.lock"
    with lock.open("x", encoding="utf-8") as owner:
        owner.write(f"{os.getpid()}\n")
    try:
        speech = Speech(speaker, speed)
        audio, arranged, frames = arrange(scenes, rules, speech)
        with TemporaryDirectory(prefix=".audio-build-", dir=output) as stage:
            stage = Path(stage)
            raw = stage / "raw.wav"
            narration = stage / "narration.wav"
            sf.write(raw, np.stack((audio, audio), axis=-1), SOURCE_RATE, subtype="FLOAT")
            measurement = normalize(binary, raw, narration, frames)
            if script_file.read_bytes() != raw_script:
                raise ValueError("The script changed during synthesis; rebuild from the revised script")
            narration_sha = kokoro.sha256(narration)
            timeline = {
                "schemaVersion": 1, "scriptSha256": script_sha, "narrationSha256": narration_sha,
                "fps": FPS, "durationInFrames": frames, "scenes": arranged,
            }
            timeline_path = stage / "timeline.json"
            kokoro.atomic_json(timeline_path, timeline)
            duration = round(frames / FPS, 6)  # ffprobe reports WAV duration to microseconds.
            captions = [
                {"text": line["text"], "startSeconds": line["startFrame"] / FPS,
                 "endSeconds": line["endFrame"] / FPS}
                for scene in arranged for line in scene["lines"]
            ]
            manifest = {
                "schemaVersion": 1, "status": "passed", "scriptSha256": script_sha,
                "timelineSha256": kokoro.sha256(timeline_path), "narrationSha256": narration_sha,
                "fps": FPS, "durationInFrames": frames, "synthesis": speech.synthesis,
                "audioMeasurement": measurement,
                "scenes": [{
                    "id": "continuous-narration", "file": narration.name, "sha256": narration_sha,
                    "fromSeconds": 0, "durationSeconds": duration, "sceneDurationSeconds": duration,
                    "captions": captions,
                }],
            }
            manifest_path = stage / "voiceover-manifest.json"
            kokoro.atomic_json(manifest_path, manifest)
            for file in (narration, timeline_path, manifest_path):
                file.replace(output / file.name)
    finally:
        lock.unlink()


if __name__ == "__main__":
    script, output, ffmpeg, speaker, speed = sys.argv[1:]
    main(Path(script), Path(output), ffmpeg, int(speaker), float(speed))
