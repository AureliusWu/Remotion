"""Build an edition's 48 kHz / PCM24 dual-mono master from retained FLOAT WAVs.

No model loading, network access, TTS generation or legacy-script imports.
The 24 kHz speech is explicitly labelled as resampled, not native Hi-Res.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import struct
import sys
import uuid

sys.dont_write_bytecode = True
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
EDITIONS = ("daily-ten", "weekly-ten", "ai-weekly")
NATIVE_RATE = 24000
MASTER_RATE = 48000
VOICE_VOLUME = .88
SENTENCE_GAP = .2
FPS = 60
RESAMPLER = {"method": "2x zero insertion and linear-phase Kaiser-windowed sinc FIR",
             "taps": 129, "kaiserBeta": 8.6, "cutoffHz": 12000,
             "groupDelayCompensated": True, "boundary": "zero extension",
             "outputSamples": "exactly twice the input sample count"}
MUSIC = {"title": "Ten Windows, One Day", "tempoBpm": 76,
         "chordsMidi": [[50, 57, 61, 64], [52, 59, 62, 66],
                        [55, 62, 66, 69], [57, 64, 69, 71]],
         "pattern": [[0, 1], [1.5, 2], [3, 3], [4.5, 1], [6.5, 2]],
         "bars": 30, "targetRmsDbfs": -41, "peakCeilingDbfs": -29,
         "synthesisFadeInSeconds": 3, "synthesisFadeOutSeconds": 7,
         "compositionFadeInSeconds": 2, "compositionFadeOutSeconds": 4,
         "externalSamples": [], "nativeSampleRate": MASTER_RATE}


class MasterError(ValueError):
    pass


def file_hash(file: Path) -> str:
    with file.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def content_hash(value: object) -> str:
    # Match generate.py's existing content-addressed line cache exactly.
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def read_json(file: Path) -> dict:
    try:
        return json.loads(file.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError) as error:
        raise MasterError(f"Cannot read JSON input {file}: {error}") from error


def exact_samples(seconds: float, rate: int, label: str) -> int:
    value = float(seconds) * rate
    if not math.isfinite(value) or abs(value - round(value)) > 1e-5:
        raise MasterError(f"{label} does not align to whole samples")
    return round(value)


def normalize_text(text: str, rules: dict) -> str:
    for original, replacement in rules.get("characterReplacements", {}).items():
        text = text.replace(original, replacement)
    terms = {key.lower(): value for key, value in rules.get("terms", {}).items()}
    if terms:
        pattern = re.compile(r"(?<![A-Za-z0-9_])(?:" + "|".join(
            re.escape(key) for key in sorted(terms, key=len, reverse=True)
        ) + r")(?![A-Za-z0-9_])", re.IGNORECASE)
        text = pattern.sub(lambda match: terms[match.group(0).lower()], text)
    return text


def cache_candidates(text: str, spoken: str, engine: dict, version: str) -> list[tuple[str, str]]:
    base = {"text": spoken, "synthesis": engine}
    primary = dict(base)
    if text != spoken:
        primary["textNormalizationVersion"] = version
    options = [("current", primary), ("legacy-normalized-text", base),
               ("legacy-year-normalization", {**base, "textNormalizationVersion": "zh-year-zero-v1"})]
    result, seen = [], set()
    for kind, value in options:
        key = content_hash(value)
        if key not in seen:
            result.append((kind, key))
            seen.add(key)
    return result


def resolve_sentence(root: Path, text: str, engine: dict, rules: dict, version: str) -> tuple[dict, np.ndarray]:
    spoken = normalize_text(text, rules)
    cache = root / "out" / "ai-history-tts" / "line-cache"
    candidates = cache_candidates(text, spoken, engine, version)
    for kind, key in candidates:
        file = cache / f"{key}.wav"
        if not file.is_file():
            continue
        info = sf.info(file)
        if info.samplerate != NATIVE_RATE or info.channels != 1 or info.subtype != "FLOAT" or info.frames <= 0:
            raise MasterError(f"Original cache must be nonempty 24000 Hz / FLOAT / mono: {file}")
        samples, rate = sf.read(file, dtype="float64", always_2d=False)
        if rate != NATIVE_RATE or samples.ndim != 1 or not np.isfinite(samples).all():
            raise MasterError(f"Invalid/non-finite original FLOAT PCM: {file}")
        if not np.any(samples):
            raise MasterError(f"Silent original sentence cache: {file}")
        return {"file": str(file.relative_to(root)), "sha256": file_hash(file),
                "cacheKey": key, "cacheKeyKind": kind, "frames": len(samples),
                "sampleRate": rate, "subtype": info.subtype, "channels": 1,
                "textSha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                "spokenTextSha256": hashlib.sha256(spoken.encode("utf-8")).hexdigest()}, samples
    expected = ", ".join(str(cache / f"{key}.wav") for _, key in candidates)
    raise MasterError(f"Missing original FLOAT sentence cache; no TTS/download fallback. Expected: {expected}")


def load_plan(root: Path, edition: str, total_seconds: float = 180) -> dict:
    root = root.resolve()
    if edition not in EDITIONS:
        raise MasterError(f"Edition must be one of {', '.join(EDITIONS)}")
    storyboard_file = root / "effects" / edition / "storyboard.json"
    manifest_file = root / "public" / edition / "voiceover-manifest.json"
    storyboard, manifest = read_json(storyboard_file), read_json(manifest_file)
    if manifest.get("status") != "passed":
        raise MasterError("A final passed voiceover manifest is required")
    storyboard_sha = file_hash(storyboard_file)
    if manifest.get("storyboardSha256") != storyboard_sha:
        raise MasterError("Stale voiceover manifest: storyboard SHA-256 differs")
    shots, voices = storyboard.get("shots", []), manifest.get("scenes", [])
    if not shots or len(shots) != len(voices):
        raise MasterError("Storyboard and narration scene counts differ")
    ids = [shot["id"] for shot in shots]
    if len(ids) != len(set(ids)):
        raise MasterError("Scene IDs must be unique")
    engine, rules = manifest.get("engine"), manifest.get("spokenTextNormalization")
    if not isinstance(engine, dict) or not isinstance(rules, dict) or not rules.get("version"):
        raise MasterError("Manifest lacks the exact original synthesis/normalization settings")
    inputs = [{"file": str(storyboard_file.relative_to(root)), "sha256": storyboard_sha},
              {"file": str(manifest_file.relative_to(root)), "sha256": file_hash(manifest_file)}]
    scenes, cursor, sentence_count = [], 0, 0
    for shot, voice in zip(shots, voices, strict=True):
        if shot["id"] != voice["id"] or float(shot["durationSeconds"]) != float(voice["sceneDurationSeconds"]):
            raise MasterError("Scene order or duration differs from the narration manifest")
        duration = float(shot["durationSeconds"])
        if not math.isfinite(duration) or duration <= 0 or abs(duration * FPS - round(duration * FPS)) > 1e-6:
            raise MasterError(f"Invalid/non-frame-aligned scene duration: {shot['id']}")
        slot = exact_samples(duration, MASTER_RATE, "scene duration")
        delay = float(voice["fromSeconds"])
        gap = float(voice.get("pauseBetweenLinesSeconds", SENTENCE_GAP))
        if abs(delay - .6) > 1e-8 or abs(gap - SENTENCE_GAP) > 1e-8:
            raise MasterError("The source edition must use 0.6-second start and 0.2-second sentence gaps")
        prefix = exact_samples(delay, MASTER_RATE, "narration delay")
        gain = float(voice.get("normalization", {}).get("gain", 0))
        if not math.isfinite(gain) or gain <= 0:
            raise MasterError(f"Invalid/missing original normalization gain: {shot['id']}")
        captions = voice.get("captions", [])
        if [caption.get("text") for caption in captions] != shot.get("narration") or not captions:
            raise MasterError(f"Captions differ from the locked narration: {shot['id']}")
        version = voice.get("spokenTextNormalizationVersion", rules["version"])
        lines, native_cursor, previous_end = [], 0, 0.0
        for index, caption in enumerate(captions):
            metadata, samples = resolve_sentence(root, caption["text"], engine, rules, version)
            start = delay + native_cursor / NATIVE_RATE
            spoken_end = start + len(samples) / NATIVE_RATE
            readable_end = spoken_end + .15
            if index < len(captions) - 1:
                readable_end = min(readable_end, spoken_end + gap - .02)
            tolerance = 2 / NATIVE_RATE
            if (abs(caption["startSeconds"] - start) > tolerance
                    or abs(caption["endSeconds"] - readable_end) > tolerance):
                raise MasterError(f"Caption timing differs from original PCM samples: {shot['id']}")
            if (caption["startSeconds"] < previous_end or caption["endSeconds"] > duration
                    or caption["endSeconds"] <= caption["startSeconds"]):
                raise MasterError(f"Subtitle overlaps or lies outside scene slot: {shot['id']}")
            previous_end = caption["endSeconds"]
            metadata.update({"sentenceIndex": index, "sceneNativeStartSample": native_cursor,
                             "masterStartSample": cursor + prefix + native_cursor * 2,
                             "masterEndSampleExclusive": cursor + prefix + (native_cursor + len(samples)) * 2})
            inputs.append({"file": metadata["file"], "sha256": metadata["sha256"]})
            lines.append({"metadata": metadata, "samples": samples})
            native_cursor += len(samples)
            if index < len(captions) - 1:
                native_cursor += exact_samples(gap, NATIVE_RATE, "sentence gap")
        if "pcmDurationSeconds" in voice and abs(voice["pcmDurationSeconds"] - native_cursor / NATIVE_RATE) > 2 / NATIVE_RATE:
            raise MasterError(f"Original PCM duration differs from manifest: {shot['id']}")
        audio_count = native_cursor * 2
        if prefix + audio_count + exact_samples(.15, MASTER_RATE, "tail margin") > slot:
            raise MasterError(f"Narration exceeds scene slot with tail margin: {shot['id']}")
        scenes.append({"id": shot["id"], "startSample": cursor, "endSampleExclusive": cursor + slot,
                       "slotSamples": slot, "voiceStartSample": cursor + prefix,
                       "voiceEndSampleExclusive": cursor + prefix + audio_count,
                       "voiceSamples": audio_count, "nativeSamples": native_cursor,
                       "normalizationGain": gain, "voiceVolume": VOICE_VOLUME,
                       "sentenceGapSeconds": gap, "lines": lines})
        cursor += slot
        sentence_count += len(lines)
    total_samples = exact_samples(total_seconds, MASTER_RATE, "master duration")
    if cursor != total_samples:
        raise MasterError(f"Timeline must total {total_seconds} seconds; got {cursor / MASTER_RATE}")
    return {"root": root, "edition": edition, "durationSeconds": total_seconds,
            "totalSamples": total_samples, "inputs": inputs, "scenes": scenes,
            "sentenceCount": sentence_count, "storyboardSha256": storyboard_sha,
            "engine": engine, "sourceNativeSampleRate": NATIVE_RATE,
            "normalizationVersion": rules["version"]}


def resample_2x(samples: np.ndarray) -> np.ndarray:
    if samples.ndim != 1 or not len(samples) or not np.isfinite(samples).all():
        raise MasterError("Resampling requires a finite nonempty mono signal")
    positions = np.arange(RESAMPLER["taps"], dtype=np.float64) - (RESAMPLER["taps"] - 1) / 2
    kernel = np.sinc(positions / 2) * np.kaiser(RESAMPLER["taps"], RESAMPLER["kaiserBeta"])
    kernel *= 2 / np.sum(kernel)
    upsampled = np.zeros(len(samples) * 2, dtype=np.float64)
    upsampled[::2] = samples
    delay = (len(kernel) - 1) // 2
    return np.convolve(upsampled, kernel, mode="full")[delay:delay + len(upsampled)]


def rms_db(samples: np.ndarray) -> float:
    rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
    return round(20 * math.log10(max(rms, 1e-15)), 6)


def synthesize_music(seconds: float) -> tuple[np.ndarray, dict]:
    count = exact_samples(seconds, MASTER_RATE, "music duration")
    samples = np.zeros(count, dtype=np.float64)
    beat = 60 / MUSIC["tempoBpm"]
    hz = lambda midi: 440 * 2 ** ((midi - 69) / 12)
    for bar in range(MUSIC["bars"]):
        start = bar * beat * 8
        chord = MUSIC["chordsMidi"][bar % len(MUSIC["chordsMidi"])]
        for offset, voice in MUSIC["pattern"]:
            first = int((start + offset * beat) * MASTER_RATE)
            last = min(count, first + int(4.8 * MASTER_RATE))
            if first >= count:
                continue
            t = np.arange(last - first) / MASTER_RATE
            frequency = hz(chord[voice] + 12)
            envelope = (1 - np.exp(-42 * t)) * np.exp(-t / 1.15) * np.clip((4.8 - t) / .7, 0, 1)
            tone = np.sin(2 * np.pi * frequency * t) + .13 * np.sin(2 * np.pi * frequency * 2 * t)
            samples[first:last] += .35 * envelope * tone
        first = int(start * MASTER_RATE)
        last = min(count, first + int(10 * MASTER_RATE))
        if first >= count:
            continue
        t = np.arange(last - first) / MASTER_RATE
        envelope = np.minimum(1, t / 2.7) * np.clip((10 - t) / 4, 0, 1)
        pad = np.sin(2 * np.pi * hz(chord[0] - 12) * t)
        pad += .35 * np.sin(2 * np.pi * hz(chord[1] - 12) * t)
        samples[first:last] += .065 * envelope * pad
    times = np.arange(count) / MASTER_RATE
    samples *= np.minimum(1, times / 3) * np.minimum(1, (seconds - times) / 7)
    rms, peak = np.sqrt(np.mean(samples ** 2)), np.max(np.abs(samples))
    if not rms or not peak:
        raise MasterError("Original music synthesis produced silence")
    gain = min(10 ** (-41 / 20) / rms, 10 ** (-29 / 20) / peak)
    samples *= gain
    original_rms = rms_db(samples)
    # This matches AiFilm's current frame-based 0–2 / 176–180 second fade.
    if seconds < 6:
        raise MasterError("Music timeline is too short for the composition fade")
    samples *= np.interp(times, [0, 2, seconds - 4, seconds], [0, 1, 1, 0])
    return samples, {**MUSIC, "parametersSha256": content_hash(MUSIC),
                     "normalizationGain": float(gain), "preCompositionFadeRmsDbfs": original_rms,
                     "postCompositionFadeRmsDbfs": rms_db(samples),
                     "referenceLevel": "same -41 dBFS pre-MP3 RMS target and -29 dBFS ceiling as original synthesis",
                     "regeneratedFromAnalyticFunctions": True, "usedPcm16OrMp3": False,
                     "float64DataSha256": hashlib.sha256(samples.astype("<f8", copy=False).tobytes()).hexdigest()}


def pcm_payload_hash(file: Path) -> str:
    with file.open("rb") as source:
        header = source.read(12)
        if header[:4] != b"RIFF" or header[8:] != b"WAVE":
            raise MasterError("Expected a RIFF/WAVE master")
        while chunk := source.read(8):
            if len(chunk) != 8:
                raise MasterError("Truncated WAV chunk")
            name, size = chunk[:4], struct.unpack("<I", chunk[4:])[0]
            if name == b"data":
                remaining, digest = size, hashlib.sha256()
                while remaining:
                    block = source.read(min(remaining, 1024 * 1024))
                    if not block:
                        raise MasterError("Truncated WAV PCM payload")
                    digest.update(block)
                    remaining -= len(block)
                return digest.hexdigest()
            source.seek(size + size % 2, 1)
    raise MasterError("WAV master has no data chunk")


def verify_master(file: Path, plan: dict) -> dict:
    info = sf.info(file)
    if (info.samplerate != MASTER_RATE or info.channels != 2 or info.subtype != "PCM_24"
            or info.frames != plan["totalSamples"]):
        raise MasterError("Master must have exact frame count, 48000 Hz, PCM24, and two channels")
    scenes, peak, sums, clipped, nondual = [], np.zeros(2), np.zeros(2), np.zeros(2, dtype=np.int64), 0
    with sf.SoundFile(file) as source:
        for scene in plan["scenes"]:
            block = source.read(scene["slotSamples"], dtype="float64", always_2d=True)
            if len(block) != scene["slotSamples"] or not np.isfinite(block).all():
                raise MasterError(f"Incomplete/non-finite master decode: {scene['id']}")
            peak = np.maximum(peak, np.max(np.abs(block), axis=0))
            sums += np.sum(block ** 2, axis=0)
            clipped += np.sum(np.abs(block) >= (2 ** 23 - 1) / 2 ** 23, axis=0)
            nondual += int(np.count_nonzero(block[:, 0] != block[:, 1]))
            level = rms_db(block)
            if level < -100:
                raise MasterError(f"Master scene is silent: {scene['id']}")
            scenes.append({"id": scene["id"], "frames": len(block), "rmsDbfs": level,
                           "peakDbfs": round(20 * math.log10(max(float(np.max(np.abs(block))), 1e-15)), 6)})
        if source.read(1).size:
            raise MasterError("Master has unexpected extra samples")
    if int(np.sum(clipped)) or nondual:
        raise MasterError("Master clipping or unexpected channel differences detected")
    return {"status": "passed", "fullDecodePassed": True, "sampleRate": MASTER_RATE,
            "bitsPerSample": 24, "channels": 2, "layout": "dual-mono",
            "framesPerChannel": info.frames, "durationSeconds": info.frames / MASTER_RATE,
            "clippedSamplesPerChannel": [int(value) for value in clipped],
            "nonIdenticalChannelFrames": nondual,
            "samplePeakDbfsPerChannel": [round(20 * math.log10(max(float(value), 1e-15)), 6) for value in peak],
            "rmsDbfsPerChannel": [round(10 * math.log10(max(float(value) / info.frames, 1e-30)), 6) for value in sums],
            "scenes": scenes}


def output_paths(root: Path, edition: str) -> tuple[Path, Path]:
    output = root / "out" / f"{edition}-master"
    expected = (root / "out").resolve() / f"{edition}-master"
    if output.resolve() != expected:
        raise MasterError("Master output resolves outside its own edition directory")
    return output / "master-48k24.wav", output / "master-manifest.json"


def plan_summary(plan: dict) -> dict:
    wav, manifest = output_paths(plan["root"], plan["edition"])
    return {"status": "plan_ready", "checkOnly": True, "masterVerified": False,
            "edition": plan["edition"], "sceneCount": len(plan["scenes"]),
            "sentenceCount": plan["sentenceCount"], "durationSeconds": plan["durationSeconds"],
            "framesPerChannel": plan["totalSamples"], "sampleRate": MASTER_RATE, "bitsPerSample": 24,
            "channels": 2, "layout": "dual-mono", "sourceNativeSampleRate": NATIVE_RATE,
            "resampled": True, "nativeHiRes": False, "wouldWrite": [str(wav), str(manifest)]}


def publish_pair(temporary: Path, output: Path, temporary_manifest: Path, manifest_file: Path) -> None:
    """Restore the previous file pair if either publication replace fails."""
    pairs = ((temporary, output), (temporary_manifest, manifest_file))
    if any(source.parent != output.parent or target.parent != output.parent for source, target in pairs):
        raise MasterError("Master publication files must stay in the same edition directory")
    backups, applied, keep_backups = {}, [], False
    try:
        for _, target in pairs:
            if target.exists():
                backup = target.with_name(f"{target.name}.{uuid.uuid4().hex}.rollback")
                backups[target] = backup
                shutil.copy2(target, backup)
            else:
                backups[target] = None
        for source, target in pairs:
            source.replace(target)
            applied.append(target)
    except BaseException as publication_error:
        rollback_errors = []
        for target in reversed(applied):
            try:
                if backups[target] is not None:
                    backups[target].replace(target)
                elif target.exists():
                    target.unlink()
            except OSError as rollback_error:
                rollback_errors.append(str(rollback_error))
        if rollback_errors:
            keep_backups = True
            retained = [str(backup) for backup in backups.values() if backup and backup.exists()]
            raise MasterError(f"Master publication and rollback failed; retained recovery files {retained}: "
                              f"{rollback_errors}") from publication_error
        raise
    finally:
        if not keep_backups:
            for backup in backups.values():
                if backup is not None and backup.exists():
                    backup.unlink()


def build_master(plan: dict) -> dict:
    root, edition = plan["root"], plan["edition"]
    output, manifest_file = output_paths(root, edition)
    narration = np.zeros(plan["totalSamples"], dtype=np.float64)
    scene_reports = []
    for scene in plan["scenes"]:
        native_parts = []
        for index, line in enumerate(scene["lines"]):
            native_parts.append(line["samples"])
            if index < len(scene["lines"]) - 1:
                native_parts.append(np.zeros(exact_samples(SENTENCE_GAP, NATIVE_RATE, "sentence gap")))
        native = np.concatenate(native_parts)
        voice = resample_2x(native) * scene["normalizationGain"] * VOICE_VOLUME
        if len(voice) != scene["voiceSamples"] or not np.isfinite(voice).all() or rms_db(voice) < -100:
            raise MasterError(f"Invalid/silent reconstructed narration: {scene['id']}")
        narration[scene["voiceStartSample"]:scene["voiceEndSampleExclusive"]] = voice
        scene_reports.append({key: value for key, value in scene.items() if key != "lines"} | {
            "sentences": [line["metadata"] for line in scene["lines"]],
            "reconstructedVoiceRmsDbfs": rms_db(voice),
            "reconstructedVoiceFloat64Sha256": hashlib.sha256(voice.astype("<f8", copy=False).tobytes()).hexdigest()})
    music, music_report = synthesize_music(plan["durationSeconds"])
    mixed = narration + music
    if not np.isfinite(mixed).all() or np.max(np.abs(mixed)) >= (2 ** 23 - 1) / 2 ** 23:
        raise MasterError("Mixed FLOAT master would clip at PCM24 output")
    for source in plan["inputs"]:
        if file_hash(root / source["file"]) != source["sha256"]:
            raise MasterError(f"Input changed during master build: {source['file']}")
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.parent / f"master-48k24.{uuid.uuid4().hex}.tmp.wav"
    temporary_manifest = manifest_file.with_name(f"master-manifest.{uuid.uuid4().hex}.tmp.json")
    try:
        with sf.SoundFile(temporary, mode="w", samplerate=MASTER_RATE, channels=2, subtype="PCM_24", format="WAV") as destination:
            for start in range(0, len(mixed), 65536):
                mono = mixed[start:start + 65536]
                destination.write(np.column_stack((mono, mono)))
        verification = verify_master(temporary, plan)
        for source in plan["inputs"]:
            if file_hash(root / source["file"]) != source["sha256"]:
                raise MasterError(f"Input changed during master verification: {source['file']}")
        builder_sha = file_hash(Path(__file__))
        composition = {"edition": edition, "sourceInputs": plan["inputs"],
                       "durationSeconds": plan["durationSeconds"], "sampleRate": MASTER_RATE,
                       "voiceVolume": VOICE_VOLUME, "sceneTiming": scene_reports,
                       "resampler": RESAMPLER, "music": music_report,
                       "builderSha256": builder_sha, "numpyVersion": np.__version__,
                       "soundfileVersion": sf.__version__}
        report = {"status": "passed", "stage": "lossless_master", "masterVerified": True,
                  "edition": edition, "generatedAt": datetime.now(timezone.utc).isoformat(),
                  "file": str(output.relative_to(root)), "sha256": file_hash(temporary),
                  "pcm24DataSha256": pcm_payload_hash(temporary),
                  "float64MixSha256": hashlib.sha256(mixed.astype("<f8", copy=False).tobytes()).hexdigest(),
                  "compositionSha256": content_hash(composition), "bytes": temporary.stat().st_size,
                  "sampleRate": MASTER_RATE, "bitsPerSample": 24, "channels": 2,
                  "layout": "dual-mono", "spatialAudio": False, "atmos": False,
                  "sourceNativeSampleRate": NATIVE_RATE, "resampled": True, "nativeHiRes": False,
                  "sourcePrecision": "original IEEE float32 model samples, not a native 24-bit recording",
                  "quantization": {"format": "PCM_24", "dither": "none", "implementation": "libsndfile"},
                  "durationSeconds": plan["durationSeconds"], "framesPerChannel": plan["totalSamples"],
                  "sceneCount": len(plan["scenes"]), "sentenceCount": plan["sentenceCount"],
                  "originalInputsUnchanged": True, "usedLossyInput": False,
                  "storyboardSha256": plan["storyboardSha256"], "sourceInputs": plan["inputs"],
                  "engine": plan["engine"], "scenes": scene_reports, "music": music_report,
                  "resampler": RESAMPLER, "builderSha256": builder_sha,
                  "runtime": {"pythonVersion": sys.version.split()[0], "numpyVersion": np.__version__,
                              "soundfileVersion": sf.__version__, "libsndfileVersion": sf.__libsndfile_version__},
                  "verification": verification}
        temporary_manifest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        publish_pair(temporary, output, temporary_manifest, manifest_file)
    finally:
        for owned_file in (temporary, temporary_manifest):
            if owned_file.exists():
                owned_file.unlink()
    return {"status": "passed", "masterVerified": True, "edition": edition,
            "file": str(output), "manifest": str(manifest_file), "sha256": report["sha256"],
            "durationSeconds": plan["durationSeconds"], "framesPerChannel": plan["totalSamples"],
            "sampleRate": MASTER_RATE, "bitsPerSample": 24, "channels": 2, "layout": "dual-mono",
            "sourceNativeSampleRate": NATIVE_RATE, "resampled": True, "nativeHiRes": False,
            "clippedSamplesPerChannel": verification["clippedSamplesPerChannel"]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("edition", choices=EDITIONS)
    parser.add_argument("--check", action="store_true", help="Read-only input/timing plan; does not create or validate a master")
    args = parser.parse_args()
    try:
        plan = load_plan(ROOT, args.edition)
        result = plan_summary(plan) if args.check else build_master(plan)
        # ASCII JSON also round-trips safely through a Windows GBK process pipe.
        print(json.dumps(result, ensure_ascii=True))
        return 0
    except (MasterError, OSError, ValueError, RuntimeError, KeyError, TypeError) as error:
        print(json.dumps({"status": "failed", "edition": args.edition, "error": str(error),
                          "errorType": type(error).__name__}, ensure_ascii=True), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
