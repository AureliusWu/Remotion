"""Run the licensed local Kokoro model on a common Chinese comparison script."""
from pathlib import Path
import hashlib
import json
import subprocess
import time

import numpy as np
import sherpa_onnx
import soundfile as sf

VIDEO = Path(__file__).resolve().parents[2]
CACHE = VIDEO / "out" / "ai-history-tts"
MODEL = CACHE / "kokoro-int8-multi-lang-v1_1"
OUTPUT = VIDEO / "public" / "ai-history"
FFMPEG = VIDEO / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
FFPROBE = FFMPEG.with_name("ffprobe.exe")


def make_engine(threads=4):
    config = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                model=str(MODEL / "model.int8.onnx"),
                voices=str(MODEL / "voices.bin"),
                tokens=str(MODEL / "tokens.txt"),
                lexicon=f"{MODEL / 'lexicon-us-en.txt'},{MODEL / 'lexicon-zh.txt'}",
            ),
            num_threads=threads,
            provider="cpu",
            debug=False,
        ),
        rule_fsts=",".join(str(MODEL / file) for file in ["date-zh.fst", "phone-zh.fst", "number-zh.fst"]),
        max_num_sentences=1,
        silence_scale=0.2,
    )
    if not config.validate():
        raise RuntimeError("Invalid local Kokoro model configuration")
    return sherpa_onnx.OfflineTts(config)


def encode(wav, output):
    subprocess.run([str(FFMPEG), "-v", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", "-ac", "1", str(output)], check=True, creationflags=subprocess.CREATE_NO_WINDOW)
    subprocess.run([str(FFMPEG), "-v", "error", "-i", str(output), "-f", "null", "-"], check=True, creationflags=subprocess.CREATE_NO_WINDOW)
    probe = subprocess.run([str(FFPROBE), "-v", "error", "-show_entries", "format=duration,size", "-of", "json", str(output)], capture_output=True, text=True, check=True, creationflags=subprocess.CREATE_NO_WINDOW)
    return json.loads(probe.stdout)["format"]


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    sample = json.loads(Path(__file__).with_name("sample.json").read_text(encoding="utf-8"))
    engine = make_engine()
    report = {"engine": "sherpa-onnx", "version": sherpa_onnx.__version__, "model": "Kokoro-82M-v1.1-zh (official sherpa INT8 conversion)", "modelLicense": "Apache-2.0", "modelSha256": hashlib.file_digest((MODEL / "model.int8.onnx").open("rb"), "sha256").hexdigest(), "text": sample["lines"], "samples": []}
    for sid, name in [(3, "zf001"), (70, "zm031")]:
        parts = []
        durations = []
        started = time.perf_counter()
        for index, line in enumerate(sample["lines"]):
            audio = engine.generate(text=line, sid=sid, speed=1.0)
            data = np.asarray(audio.samples, dtype=np.float32)
            if data.size == 0 or not np.isfinite(data).all():
                raise RuntimeError("Invalid generated samples")
            parts.append(data)
            durations.append(len(data) / audio.sample_rate)
            if index < len(sample["lines"]) - 1:
                parts.append(np.zeros(round(0.3 * audio.sample_rate), dtype=np.float32))
            print(f"{name}: line {index + 1}, {durations[-1]:.2f} seconds", flush=True)
        elapsed = time.perf_counter() - started
        samples = np.concatenate(parts)
        peak = float(np.max(np.abs(samples)))
        rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
        # Fair listening comparison: target -23 dBFS RMS, with a -1 dBFS peak ceiling.
        gain = min(10 ** (-23 / 20) / rms, 10 ** (-1 / 20) / peak)
        samples *= gain
        wav = CACHE / f"sample-kokoro-{name}.wav"
        sf.write(wav, samples, audio.sample_rate, subtype="PCM_16")
        output = OUTPUT / f"tts-sample-kokoro-{name}.mp3"
        media = encode(wav, output)
        seconds = len(samples) / audio.sample_rate
        report["samples"].append({"file": output.name, "speakerId": sid, "speakerName": name, "speed": 1.0, "durationSeconds": seconds, "encodedDurationSeconds": float(media["duration"]), "synthesisSeconds": elapsed, "realTimeFactor": elapsed / seconds, "sampleRate": audio.sample_rate, "threads": 4, "normalizationGain": gain, "fullDecodePassed": True})
        print(f"Saved {output}: audio={seconds:.3f}s generation={elapsed:.3f}s RTF={elapsed / seconds:.3f}", flush=True)
    (OUTPUT / "tts-sample-manifest.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
