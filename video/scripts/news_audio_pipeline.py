"""Edition-scoped offline news narration; every write path belongs to its edition."""
from __future__ import annotations

import argparse
import copy
from datetime import datetime, timezone
from functools import partial
import importlib.util
import json
import math
from pathlib import Path
import re
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "hotspot_audio_helpers", ROOT / "scripts" / "generate-hotspot-audio.py"
)
if spec is None or spec.loader is None:
    raise RuntimeError("The installed news audio helpers could not be loaded")
hotspot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hotspot)
kokoro = hotspot.kokoro
BASE_PRONUNCIATIONS = copy.deepcopy(kokoro.PRONUNCIATIONS)
ORIGINAL_INITIALIZER = kokoro.initialize_worker


def apply_pronunciations(pronunciations: dict) -> None:
    """Change only this process's spoken-input rules; never edit the global file."""
    kokoro.PRONUNCIATIONS = copy.deepcopy(pronunciations)
    kokoro.TEXT_NORMALIZATION_VERSION = pronunciations["version"]
    kokoro.TERM_MAPPINGS = {key.lower(): value for key, value in pronunciations["terms"].items()}
    kokoro.TERM_PATTERN = re.compile(
        r"(?<![A-Za-z0-9_])(?:" + "|".join(
            re.escape(key) for key in sorted(kokoro.TERM_MAPPINGS, key=len, reverse=True)
        ) + r")(?![A-Za-z0-9_])", re.IGNORECASE
    )


def initialize_edition_worker(settings: dict, pronunciations: dict) -> None:
    # A picklable partial carries local rules into each Windows spawn worker.
    apply_pronunciations(pronunciations)
    ORIGINAL_INITIALIZER(settings)


def write_json(file: Path, value: object) -> None:
    kokoro.atomic_json(file, value)


def write_subtitles(output: Path, scenes: list[dict]) -> None:
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
    temporary = output / "captions.zh.srt.tmp"
    temporary.write_text("\n".join(blocks), encoding="utf-8")
    temporary.replace(output / "captions.zh.srt")


class NewsAudioPipeline:
    def __init__(self, edition: str, expected_news_count: int | None = None):
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", edition):
            raise ValueError("Edition must be a safe lower-case directory name")
        self.edition = edition
        self.expected_news_count = expected_news_count
        self.output = ROOT / "public" / edition
        self.work = ROOT / "out" / f"{edition}-audio"
        self.effect = ROOT / "effects" / edition
        self.storyboard = self.effect / "storyboard.json"

    def pronunciations(self) -> tuple[dict, dict | None]:
        merged = copy.deepcopy(BASE_PRONUNCIATIONS)
        file = self.effect / "pronunciations.json"
        if not file.exists():
            return merged, None
        local = json.loads(file.read_text(encoding="utf-8-sig"))
        if not isinstance(local.get("version"), str) or not local["version"].strip():
            raise ValueError("An edition pronunciation override needs its own version")
        for field in ("terms", "characterReplacements"):
            values = local.get(field, {})
            if not isinstance(values, dict) or any(
                not isinstance(key, str) or not key or not isinstance(value, str)
                for key, value in values.items()
            ):
                raise ValueError(f"Invalid edition pronunciation {field}")
            merged[field].update(values)
        merged["version"] += ":" + local["version"]
        merged["editionOverride"] = {"edition": self.edition, "source": str(file.relative_to(ROOT)),
                                     "sha256": hotspot.digest(file)}
        return merged, {**merged["editionOverride"], "terms": local.get("terms", {})}

    def preserved_fingerprints(self) -> dict[str, str]:
        files = {
            ROOT / "scripts" / "generate-hotspot-audio.py",
            ROOT / "scripts" / "generate-weekly-ten-audio.py",
            ROOT / "scripts" / "generate-ai-weekly-audio.py",
            ROOT / "scripts" / "news_audio_pipeline.py",
            ROOT / "scripts" / "ai-history-tts" / "generate.py",
            ROOT / "scripts" / "ai-history-tts" / "make_samples.py",
        }
        for edition in ("daily-ten", "weekly-ten", "ai-history", "ai-weekly"):
            if edition == self.edition:
                continue
            for name in ("storyboard.json", "audio-manifest.json"):
                files.add(ROOT / "effects" / edition / name)
            directory = ROOT / "public" / edition
            if directory.exists():
                files.update(file for file in directory.rglob("*") if file.is_file())
            files.update(file for file in (ROOT / "out").glob(f"{edition}*") if file.is_file())
        return {str(file.relative_to(ROOT)): hotspot.digest(file)
                for file in sorted(files) if file.is_file()}

    def check_dependencies(self) -> dict:
        model = hotspot.make_samples.MODEL
        if not str(model).isascii():
            raise RuntimeError("The Windows Kokoro FST reader requires the existing ASCII model junction")
        if hotspot.digest(model / "model.int8.onnx") != hotspot.MODEL_SHA256:
            raise RuntimeError("Kokoro model SHA-256 mismatch")
        for binary in (hotspot.make_samples.FFMPEG, hotspot.make_samples.FFPROBE):
            if not binary.is_file():
                raise RuntimeError(f"Missing project media binary: {binary}")
        music = ROOT / "public" / "daily-ten" / "music.mp3"
        music_manifest = json.loads(music.with_name("music-manifest.json").read_text(encoding="utf-8"))
        if hotspot.digest(music) != music_manifest["sha256"]:
            raise RuntimeError("The original music differs from its verified manifest")
        if music_manifest["durationSeconds"] != 180:
            raise RuntimeError("Expected the existing 180-second original music")
        _, local_rules = self.pronunciations()
        return {
            "status": "passed", "edition": self.edition,
            "pythonVersion": sys.version.split()[0], "engine": "sherpa-onnx",
            "modelSha256": hotspot.MODEL_SHA256, "runtime": str(Path(sys.executable)),
            "modelPath": str(model), "narrationOutput": str(self.output),
            "effectsManifest": str(self.effect / "audio-manifest.json"),
            "workDirectory": str(self.work),
            "pronunciationOverride": local_rules,
            "music": {"file": "daily-ten/music.mp3", "sha256": music_manifest["sha256"],
                      "durationSeconds": 180, "original": True, "regenerated": False},
        }

    def validate_plan(self, storyboard: Path) -> tuple[dict, str]:
        if storyboard != self.storyboard.resolve():
            raise ValueError(f"This edition only accepts effects/{self.edition}/storyboard.json")
        source_hash = hotspot.digest(storyboard)
        plan = json.loads(storyboard.read_text(encoding="utf-8-sig"))
        shots = plan["shots"]
        if len(shots) < 3:
            raise ValueError("The film requires an introduction, news, and conclusion")
        durations = [float(shot["durationSeconds"]) for shot in shots]
        if (any(not math.isfinite(value) or value <= 0 for value in durations)
                or durations[0] != 10 or durations[-1] != 10
                or abs(sum(durations) - 180) > 1e-6):
            raise ValueError("The film must total 180 seconds with 10-second introduction and conclusion")
        if self.expected_news_count is not None:
            if len(shots) - 2 != self.expected_news_count or any(value != 16 for value in durations[1:-1]):
                raise ValueError("Weekly Ten requires ten 16-second news scenes")
        if any(float(shot.get("fromSeconds", .6)) != .6 for shot in shots):
            raise ValueError("The news timeline uses a 0.6-second narration delay")
        return plan, source_hash

    def make_voice(self, storyboard: Path, speed: float, dependencies: dict, before: dict) -> None:
        plan, source_hash = self.validate_plan(storyboard)
        shots = plan["shots"]
        pronunciation_rules, local_rules = self.pronunciations()
        original_argv = sys.argv
        try:
            apply_pronunciations(pronunciation_rules)
            kokoro.initialize_worker = partial(initialize_edition_worker, pronunciations=pronunciation_rules)
            sys.argv = ["generate.py", str(storyboard), "--output", str(self.output),
                        "--workers", "2", "--threads", "2", "--speaker", "3",
                        "--speed", str(speed), "--gap", "0.2"]
            kokoro.main()
        finally:
            sys.argv = original_argv
            apply_pronunciations(BASE_PRONUNCIATIONS)
            kokoro.initialize_worker = ORIGINAL_INITIALIZER
        if hotspot.digest(storyboard) != source_hash:
            raise RuntimeError("The storyboard changed during synthesis; rerun with the locked script")
        if local_rules and hotspot.digest(ROOT / local_rules["source"]) != local_rules["sha256"]:
            raise RuntimeError("The edition pronunciation rules changed during synthesis")

        manifest_path = self.output / "voiceover-manifest.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        manifest.update({
            "film": self.edition, "totalSceneDurationSeconds": 180, "fps": 60,
            "captionsRelativeTo": "scene start; includes the 0.6-second narration delay",
            "modelPathWorkaround": dependencies["modelPath"], "music": dependencies["music"],
            "pronunciationOverride": local_rules,
        })
        failures = []
        for shot, scene in zip(shots, manifest["scenes"], strict=True):
            if shot["id"] != scene["id"]:
                raise ValueError("Narration order differs from the locked storyboard")
            scene["fromSeconds"] = .6
            scene["sceneDurationSeconds"] = float(shot["durationSeconds"])
            for caption in scene["captions"]:
                caption["startSeconds"] = round(caption["startSeconds"] + .6, 6)
                caption["endSeconds"] = round(caption["endSeconds"] + .6, 6)
            if scene["durationSeconds"] + .6 > scene["sceneDurationSeconds"] - .15:
                failures.append({"id": scene["id"], "reason": "narration exceeds safe scene duration",
                                 "audioSeconds": scene["durationSeconds"],
                                 "sceneSeconds": scene["sceneDurationSeconds"]})
            previous_end = 0
            for caption in scene["captions"]:
                if (not caption["text"].strip() or caption["startSeconds"] < previous_end
                        or caption["endSeconds"] <= caption["startSeconds"]
                        or caption["endSeconds"] > scene["sceneDurationSeconds"]):
                    failures.append({"id": scene["id"], "reason": "invalid or out-of-scene subtitle"})
                previous_end = caption["endSeconds"]
            if hotspot.digest(self.output / scene["file"]) != scene["sha256"]:
                failures.append({"id": scene["id"], "reason": "published audio SHA-256 mismatch"})

        after = self.preserved_fingerprints()
        changed = sorted(path for path in before.keys() | after.keys() if before.get(path) != after.get(path))
        if changed:
            failures.append({"reason": "existing film assets changed", "files": changed})
        manifest["failures"] = failures
        manifest["status"] = "failed" if failures else "passed"
        write_json(manifest_path, manifest)
        write_json(self.effect / "audio-manifest.json", manifest)
        write_json(self.output / "music-reference.json", dependencies["music"])
        report = {
            "status": manifest["status"], "edition": self.edition,
            "checkedAt": datetime.now(timezone.utc).isoformat(),
            "storyboardSha256": source_hash, "timelineSeconds": 180,
            "sceneCount": len(shots), "newsCount": len(shots) - 2,
            "captionCount": sum(len(scene["captions"]) for scene in manifest["scenes"]),
            "fullDecodeAndPublishedHashesPassed": not failures,
            "existingAssetsPreserved": not changed, "protectedFileCount": len(before),
            "highestPeakDbfs": max(scene["audioMeasurement"]["peakDbfs"] for scene in manifest["scenes"]),
            "rmsDbfsRange": [min(scene["audioMeasurement"]["rmsDbfs"] for scene in manifest["scenes"]),
                             max(scene["audioMeasurement"]["rmsDbfs"] for scene in manifest["scenes"])],
            "minimumTailRoomSeconds": round(min(scene["sceneDurationSeconds"] - .6 - scene["durationSeconds"]
                                                 for scene in manifest["scenes"]), 6),
            "narrationFiles": [{"id": scene["id"], "file": scene["file"],
                                "durationSeconds": scene["durationSeconds"], "sha256": scene["sha256"]}
                               for scene in manifest["scenes"]],
            "music": dependencies["music"], "failures": failures,
            "pronunciationOverride": local_rules,
        }
        write_json(self.work / "audio-validation.json", report)
        if failures:
            raise ValueError(f"Narration validation failed; shorten copy rather than cut speech: {failures}")
        write_subtitles(self.output, manifest["scenes"])
        print(f"Verified {len(shots)} {self.edition} narration clips, 180 seconds; "
              f"{len(before)} existing assets unchanged", flush=True)


def run_cli(edition: str, expected_news_count: int | None = None) -> None:
    pipeline = NewsAudioPipeline(edition, expected_news_count)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("storyboard", type=Path, nargs="?", default=pipeline.storyboard)
    parser.add_argument("--check", action="store_true", help="Read-only runtime/output/music checks")
    parser.add_argument("--speed", type=float, default=1.03)
    args = parser.parse_args()
    dependencies = pipeline.check_dependencies()
    before = pipeline.preserved_fingerprints()
    if args.check:
        print(json.dumps({**dependencies, "protectedFileCount": len(before)}, ensure_ascii=False, indent=2))
        return
    if not .85 <= args.speed <= 1.05:
        parser.error("Native Kokoro speed must be between 0.85 and 1.05")
    pipeline.work.mkdir(parents=True, exist_ok=True)
    pipeline.output.mkdir(parents=True, exist_ok=True)
    pipeline.make_voice(args.storyboard.resolve(), args.speed, dependencies, before)
