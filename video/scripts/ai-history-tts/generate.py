"""Sentence-level local Kokoro narration with resumable content-addressed caches."""
from concurrent.futures import ProcessPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
sys.dont_write_bytecode = True
import time
import uuid

import numpy as np
import sherpa_onnx
import soundfile as sf

from make_samples import VIDEO, CACHE, MODEL, OUTPUT, FFMPEG, FFPROBE, make_engine

ENGINE = None
SETTINGS = None
ARCHIVE_SHA256 = "259c9c8bc906d6078e4e0570421885dabb68b539c2f970fcbb890a58eeaf3e9c"
PRONUNCIATIONS = json.loads(Path(__file__).with_name("pronunciations.json").read_text(encoding="utf-8"))
TEXT_NORMALIZATION_VERSION = PRONUNCIATIONS["version"]
TERM_MAPPINGS = {key.lower(): value for key, value in PRONUNCIATIONS["terms"].items()}
TERM_PATTERN = re.compile(r"(?<![A-Za-z0-9_])(?:" + "|".join(re.escape(key) for key in sorted(TERM_MAPPINGS, key=len, reverse=True)) + r")(?![A-Za-z0-9_])", re.IGNORECASE)


def spoken_text(text):
    # Kokoro's Chinese lexicon omits the year numeral 〇 and book-title marks.
    # Preserve the author's caption text; normalize only the spoken input.
    for original, replacement in PRONUNCIATIONS["characterReplacements"].items():
        text = text.replace(original, replacement)
    return TERM_PATTERN.sub(lambda match: TERM_MAPPINGS[match.group(0).lower()], text)


def sha256(path):
    with Path(path).open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def content_hash(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f"{path.name}.{uuid.uuid4().hex}.tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def initialize_worker(settings):
    global ENGINE, SETTINGS
    SETTINGS = settings
    ENGINE = make_engine(settings["threads"])


def run(command, capture=False):
    return subprocess.run(command, check=True, capture_output=capture, text=capture, creationflags=subprocess.CREATE_NO_WINDOW)


def generate_scene(job):
    settings = SETTINGS
    shot = job["shot"]
    started = time.perf_counter()
    parts = []
    captions = []
    elapsed_samples = 0
    generated_lines = 0
    sample_rate = 24000
    line_cache = CACHE / "line-cache"
    line_cache.mkdir(parents=True, exist_ok=True)
    gap_samples = round(settings["gapSeconds"] * sample_rate)
    for index, text in enumerate(shot["narration"]):
        spoken = spoken_text(text)
        line_input = {"text": spoken, "synthesis": settings["synthesis"]}
        legacy_normalized_key = content_hash(line_input)
        if spoken != text:
            line_input["textNormalizationVersion"] = TEXT_NORMALIZATION_VERSION
        line_key = content_hash(line_input)
        line_path = line_cache / f"{line_key}.wav"
        # A cache keyed by the exact already-normalized text is also safe to reuse.
        legacy_line = line_cache / f"{legacy_normalized_key}.wav"
        version_one_line = line_cache / f"{content_hash({'text': spoken, 'synthesis': settings['synthesis'], 'textNormalizationVersion': 'zh-year-zero-v1'})}.wav"
        if not line_path.exists() and legacy_line.exists():
            shutil.copyfile(legacy_line, line_path)
        if not line_path.exists() and version_one_line.exists():
            shutil.copyfile(version_one_line, line_path)
        if line_path.exists():
            samples, actual_rate = sf.read(line_path, dtype="float32")
            if actual_rate != sample_rate or samples.ndim != 1:
                raise RuntimeError(f"Invalid cached line {line_key}")
        else:
            audio = ENGINE.generate(text=spoken, sid=settings["speakerId"], speed=settings["speed"])
            samples = np.asarray(audio.samples, dtype=np.float32)
            if audio.sample_rate != sample_rate or not samples.size or not np.isfinite(samples).all():
                raise RuntimeError(f"Invalid synthesis for {shot['id']} line {index + 1}")
            temporary = line_path.with_name(f"{line_key}.{uuid.uuid4().hex}.wav")
            sf.write(temporary, samples, sample_rate, subtype="FLOAT")
            temporary.replace(line_path)
            generated_lines += 1
        start = elapsed_samples / sample_rate
        spoken_end = start + len(samples) / sample_rate
        readable_end = spoken_end + 0.15
        if index < len(shot["narration"]) - 1:
            readable_end = min(readable_end, spoken_end + settings["gapSeconds"] - 0.02)
        captions.append({"text": text, "startSeconds": round(start, 6), "endSeconds": round(readable_end, 6)})
        parts.append(samples)
        elapsed_samples += len(samples)
        if index < len(shot["narration"]) - 1:
            parts.append(np.zeros(gap_samples, dtype=np.float32))
            elapsed_samples += gap_samples

    samples = np.concatenate(parts)
    peak = float(np.max(np.abs(samples)))
    rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
    if not peak or not rms:
        raise RuntimeError(f"Silent synthesized scene: {shot['id']}")
    gain = min(10 ** (-23 / 20) / rms, 10 ** (-1 / 20) / peak)
    samples *= gain
    scene_cache = CACHE / "scene-cache" / job["hash"]
    scene_cache.mkdir(parents=True, exist_ok=True)
    wav = scene_cache / "scene.wav"
    mp3 = scene_cache / "scene.mp3"
    sf.write(wav, samples, sample_rate, subtype="PCM_16")
    run([str(FFMPEG), "-v", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "1", str(mp3)])
    decoded_path = scene_cache / "scene-decoded.wav"
    run([str(FFMPEG), "-v", "error", "-y", "-i", str(mp3), "-codec:a", "pcm_s16le", "-ar", "44100", "-ac", "1", str(decoded_path)])
    decoded_samples, decoded_rate = sf.read(decoded_path, dtype="float32")
    if not decoded_samples.size or not np.isfinite(decoded_samples).all():
        raise RuntimeError(f"Invalid decoded audio: {shot['id']}")
    decoded_peak = float(np.max(np.abs(decoded_samples)))
    decoded_rms = float(np.sqrt(np.mean(decoded_samples.astype(np.float64) ** 2)))
    probe = json.loads(run([str(FFPROBE), "-v", "error", "-show_entries", "format=duration,size", "-of", "json", str(mp3)], capture=True).stdout)["format"]
    scene = {
        "id": shot["id"], "file": f"{shot['id']}.mp3", "text": "".join(shot["narration"]),
        "hash": job["hash"], "speakerId": settings["speakerId"], "speakerName": "zf_001" if settings["speakerId"] == 3 else f"sid-{settings['speakerId']}",
        "speed": settings["speed"], "durationSeconds": float(probe["duration"]), "pcmDurationSeconds": len(samples) / sample_rate,
        "spokenTextNormalizationVersion": TEXT_NORMALIZATION_VERSION,
        "captions": captions, "pauseBetweenLinesSeconds": settings["gapSeconds"], "sampleRate": sample_rate,
        "synthesisSeconds": time.perf_counter()-started, "generatedLines": generated_lines,
        "normalization": {"targetRmsDbfs": -23, "peakCeilingDbfs": -1, "gain": gain},
        "fullDecodePassed": True, "sha256": sha256(mp3), "bytes": int(probe["size"]),
        "audioMeasurement": {"fullDecodePassed": True, "measurement": "full decoded 44.1kHz mono 16-bit PCM WAV", "peakDbfs": round(20*np.log10(decoded_peak), 4), "rmsDbfs": round(20*np.log10(decoded_rms), 4), "sampleCount": int(decoded_samples.size)},
    }
    atomic_json(scene_cache / "scene.json", scene)
    return scene


def publish(scene):
    source = CACHE / "scene-cache" / scene["hash"] / "scene.mp3"
    target = OUTPUT / scene["file"]
    if not target.exists() or sha256(target) != scene["sha256"]:
        shutil.copyfile(source, target)


def main():
    global OUTPUT
    parser = argparse.ArgumentParser()
    parser.add_argument("storyboard", type=Path)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--speaker", type=int, default=3)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--gap", type=float, default=0.2)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    OUTPUT = args.output.resolve()
    if not 1 <= args.workers <= 2 or not 1 <= args.threads <= 6 or not 0.85 <= args.speed <= 1.05:
        parser.error("Use 1–2 workers, 1–6 threads each and native speech speed 0.85–1.05")
    if not 0.18 <= args.gap <= 0.25:
        parser.error("Sentence gap must be 0.18–0.25 seconds")
    plan = json.loads(args.storyboard.read_text(encoding="utf-8-sig"))
    shots = plan["shots"]
    ids = [shot["id"] for shot in shots]
    if len(set(ids)) != len(ids) or any(not re.fullmatch(r"[A-Za-z0-9_-]+", item) for item in ids):
        raise ValueError("Shot IDs must be unique safe filenames")
    for shot in shots:
        if not shot["narration"] or any(not isinstance(text, str) or not text.strip() for text in shot["narration"]):
            raise ValueError(f"Missing narration for {shot['id']}")
    lexicon = set()
    for filename in ["lexicon-us-en.txt", "lexicon-zh.txt"]:
        lexicon.update(line.split()[0].lower() for line in (MODEL / filename).read_text(encoding="utf-8").splitlines() if line.strip())
    spoken_ascii = sorted(set(re.findall(r"[A-Za-z]+(?:-[0-9]+)?", " ".join(spoken_text(line) for shot in shots for line in shot["narration"]))))
    unknown_words = [word for word in spoken_ascii if word.lower() not in lexicon]
    if unknown_words:
        raise ValueError(f"Unknown English spoken words would be skipped: {unknown_words}. Update pronunciations.json before synthesis.")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    model_hash = sha256(MODEL / "model.int8.onnx")
    synthesis = {"engine": "sherpa-onnx", "version": sherpa_onnx.__version__, "modelSha256": model_hash, "speakerId": args.speaker, "speed": args.speed}
    settings = {"synthesis": synthesis, "speakerId": args.speaker, "speed": args.speed, "threads": args.threads, "gapSeconds": args.gap}
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(), "storyboard": str(args.storyboard.resolve()), "storyboardSha256": sha256(args.storyboard),
        "engine": synthesis, "pythonVersion": sys.version.split()[0],
        "model": {"name": "hexgrad/Kokoro-82M-v1.1-zh", "conversion": "official sherpa INT8", "license": "Apache-2.0", "archiveSha256": ARCHIVE_SHA256, "modelSha256": model_hash, "source": "https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh", "download": "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-int8-multi-lang-v1_1.tar.bz2"},
        "encoding": "MP3 128kbps 44.1kHz mono", "workers": args.workers, "threadsPerWorker": args.threads,
        "captionsRelativeTo": "audio start; parent timeline adds 0.7 seconds", "status": "running", "scenes": [],
        "spokenTextNormalization": PRONUNCIATIONS,
        "spokenAsciiLexiconCheck": {"status": "passed", "tokens": spoken_ascii, "lexicons": ["lexicon-us-en.txt", "lexicon-zh.txt"]},
    }
    completed = {}
    jobs = []
    for shot in shots:
        key_input = {"id": shot["id"], "shot": shot["narration"], "settings": settings["synthesis"], "gap": args.gap, "normalization": "rms-23-peak-1-v2-pcm-audit"}
        normalized_lines = [spoken_text(text) for text in shot["narration"]]
        if normalized_lines != shot["narration"]:
            key_input["spokenLines"] = normalized_lines
            key_input["textNormalizationVersion"] = TEXT_NORMALIZATION_VERSION
        key = content_hash(key_input)
        metadata = CACHE / "scene-cache" / key / "scene.json"
        if metadata.exists() and metadata.with_name("scene.mp3").is_file():
            scene = json.loads(metadata.read_text(encoding="utf-8"))
            if scene["id"] == shot["id"] and sha256(metadata.with_name("scene.mp3")) == scene["sha256"]:
                completed[shot["id"]] = scene
                publish(scene)
                continue
        jobs.append({"shot": shot, "hash": key})
    manifest_path = OUTPUT / "voiceover-manifest.json"

    def save_progress():
        report["scenes"] = [completed[item] for item in ids if item in completed]
        report["totalAudioSeconds"] = sum(scene["durationSeconds"] for scene in report["scenes"])
        atomic_json(manifest_path, report)

    started = time.perf_counter()
    save_progress()
    print(f"{len(completed)} scene(s) reused, {len(jobs)} to synthesize", flush=True)
    try:
        if jobs:
            with ProcessPoolExecutor(max_workers=args.workers, initializer=initialize_worker, initargs=(settings,)) as pool:
                futures = {pool.submit(generate_scene, job): job for job in jobs}
                for future in as_completed(futures):
                    scene = future.result()
                    completed[scene["id"]] = scene
                    publish(scene)
                    save_progress()
                    print(f"[{len(completed)}/{len(shots)}] {scene['id']}: {scene['durationSeconds']:.2f}s audio, {scene['synthesisSeconds']:.2f}s work", flush=True)
        report["status"] = "passed"
        report["elapsedSeconds"] = time.perf_counter()-started
        save_progress()
    except BaseException as error:
        report["status"] = "failed"
        report["error"] = repr(error)
        save_progress()
        raise
    print(f"Completed {len(shots)} scenes, {report['totalAudioSeconds']:.2f}s total audio; {manifest_path}", flush=True)


if __name__ == "__main__":
    main()
