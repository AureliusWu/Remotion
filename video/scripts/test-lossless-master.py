"""Portable fixture tests for lossless masters; no models, media tools or network."""
from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

sys.dont_write_bytecode = True
import numpy as np
import soundfile as sf

SOURCE = Path(__file__).with_name("build-lossless-master.py")
spec = importlib.util.spec_from_file_location("lossless_master_under_test", SOURCE)
master = importlib.util.module_from_spec(spec)
assert spec is not None and spec.loader is not None
sys.modules[spec.name] = master
spec.loader.exec_module(master)


def json_file(file: Path, value: dict) -> None:
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


class MasterFixtures(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="remotion-lossless-test-")
        self.root = Path(self.temporary.name) / "video"
        self.edition = "ai-weekly"
        self.storyboard_file = self.root / "effects" / self.edition / "storyboard.json"
        self.manifest_file = self.root / "public" / self.edition / "voiceover-manifest.json"
        self.cache = self.root / "out" / "ai-history-tts" / "line-cache"
        self.cache.mkdir(parents=True)
        self.engine = {"engine": "fixture", "version": "1", "modelSha256": "no-model-needed",
                       "speakerId": 3, "speed": 1.03}
        self.rules = {"version": "fixture-local-v1", "characterReplacements": {"〇": "零"},
                      "terms": {"API": "A P I"}}
        shots, voices = [], []
        for number, (scene_id, seconds) in enumerate((("intro", 2), ("news", 4), ("outro", 2))):
            text = [f"API fixture {scene_id}。", f"第{number}条句子。"]
            spoken = [f"A P I fixture {scene_id}。", text[1]]
            captions, elapsed = [], 0
            for index, (original, spoken_line) in enumerate(zip(text, spoken, strict=True)):
                frames = 2880 + 480 * index
                times = np.arange(frames) / 24000
                samples = (.24 * np.sin(2 * np.pi * (350 + number * 110) * times)).astype("float32")
                key_input = {"text": spoken_line, "synthesis": self.engine}
                if original != spoken_line:
                    key_input["textNormalizationVersion"] = self.rules["version"]
                key = hashlib.sha256(json.dumps(key_input, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()
                sf.write(self.cache / f"{key}.wav", samples, 24000, subtype="FLOAT")
                start = .6 + elapsed / 24000
                end = start + frames / 24000
                captions.append({"text": original, "startSeconds": round(start, 6),
                                 "endSeconds": round(end + .15, 6)})
                elapsed += frames + (4800 if index == 0 else 0)
            shots.append({"id": scene_id, "durationSeconds": seconds, "narration": text})
            voices.append({"id": scene_id, "file": f"{scene_id}.mp3", "fromSeconds": .6,
                           "sceneDurationSeconds": seconds, "durationSeconds": elapsed / 24000 + .04,
                           "pcmDurationSeconds": elapsed / 24000, "sampleRate": 24000,
                           "pauseBetweenLinesSeconds": .2, "normalization": {"gain": .5},
                           "spokenTextNormalizationVersion": self.rules["version"], "captions": captions})
        self.storyboard = {"shots": shots}
        json_file(self.storyboard_file, self.storyboard)
        self.manifest = {"status": "passed", "engine": self.engine, "spokenTextNormalization": self.rules,
                         "storyboardSha256": master.file_hash(self.storyboard_file), "scenes": voices}
        self.save_manifest()

    def tearDown(self):
        # TemporaryDirectory owns this newly created test tree only.
        self.temporary.cleanup()

    def save_manifest(self):
        json_file(self.manifest_file, self.manifest)

    def plan(self):
        return master.load_plan(self.root, self.edition, total_seconds=8)

    def test_read_only_plan_has_no_master_claim_or_output(self):
        before = {str(file): master.file_hash(file) for file in self.root.rglob("*") if file.is_file()}
        summary = master.plan_summary(self.plan())
        after = {str(file): master.file_hash(file) for file in self.root.rglob("*") if file.is_file()}
        self.assertEqual(before, after)
        self.assertEqual(summary["status"], "plan_ready")
        self.assertFalse(summary["masterVerified"])
        self.assertTrue(summary["resampled"])
        self.assertFalse((self.root / "out" / "ai-weekly-master").exists())

    def test_missing_cache_fails_without_tts_fallback(self):
        next(self.cache.glob("*.wav")).unlink()
        with self.assertRaisesRegex(master.MasterError, "Missing original FLOAT"):
            self.plan()

    def test_pcm16_cache_is_rejected(self):
        file = next(self.cache.glob("*.wav"))
        samples, rate = sf.read(file)
        sf.write(file, samples, rate, subtype="PCM_16")
        with self.assertRaisesRegex(master.MasterError, "FLOAT"):
            self.plan()

    def test_nonfinite_cache_is_rejected(self):
        file = next(self.cache.glob("*.wav"))
        samples, rate = sf.read(file)
        samples[0] = np.nan
        sf.write(file, samples, rate, subtype="FLOAT")
        with self.assertRaisesRegex(master.MasterError, "non-finite"):
            self.plan()

    def test_invalid_original_gain_is_rejected(self):
        self.manifest["scenes"][0]["normalization"]["gain"] = -1
        self.save_manifest()
        with self.assertRaisesRegex(master.MasterError, "normalization gain"):
            self.plan()

    def test_caption_timing_and_scene_overrun_are_rejected(self):
        self.manifest["scenes"][0]["captions"][-1]["endSeconds"] += 3
        self.save_manifest()
        with self.assertRaisesRegex(master.MasterError, "timing|outside|slot"):
            self.plan()

    def test_source_duration_mismatch_is_rejected(self):
        self.manifest["scenes"][0]["pcmDurationSeconds"] += .1
        self.save_manifest()
        with self.assertRaisesRegex(master.MasterError, "PCM duration"):
            self.plan()

    def test_actual_long_pcm_cannot_overrun_scene_slot(self):
        plan = self.plan()
        first = self.root / plan["scenes"][0]["lines"][0]["metadata"]["file"]
        sf.write(first, .24 * np.sin(2 * np.pi * 350 * np.arange(24000) / 24000),
                 24000, subtype="FLOAT")
        voice = self.manifest["scenes"][0]
        voice["pcmDurationSeconds"] = 1 + .2 + .14
        voice["captions"][0].update({"startSeconds": .6, "endSeconds": 1.75})
        voice["captions"][1].update({"startSeconds": 1.8, "endSeconds": 2.09})
        self.save_manifest()
        with self.assertRaisesRegex(master.MasterError, "outside scene slot"):
            self.plan()

    def test_non_frame_aligned_scene_is_rejected(self):
        self.storyboard["shots"][0]["durationSeconds"] = 2.0001
        self.manifest["scenes"][0]["sceneDurationSeconds"] = 2.0001
        json_file(self.storyboard_file, self.storyboard)
        self.manifest["storyboardSha256"] = master.file_hash(self.storyboard_file)
        self.save_manifest()
        with self.assertRaisesRegex(master.MasterError, "frame-aligned"):
            self.plan()

    def test_timeline_total_must_be_exact(self):
        with self.assertRaisesRegex(master.MasterError, "Timeline must total"):
            master.load_plan(self.root, self.edition, total_seconds=9)

    def test_changed_storyboard_is_rejected(self):
        self.storyboard["shots"][0]["narration"][0] += " changed"
        json_file(self.storyboard_file, self.storyboard)
        with self.assertRaisesRegex(master.MasterError, "Stale|Captions"):
            self.plan()

    def test_changed_input_after_plan_fails_before_publication(self):
        plan = self.plan()
        file = self.root / plan["inputs"][2]["file"]
        samples, rate = sf.read(file)
        sf.write(file, samples * .9, rate, subtype="FLOAT")
        with self.assertRaisesRegex(master.MasterError, "Input changed"):
            master.build_master(plan)
        self.assertFalse((self.root / "out" / "ai-weekly-master" / "master-48k24.wav").exists())

    def test_clipping_is_rejected(self):
        plan = self.plan()
        plan["scenes"][0]["normalizationGain"] = 100
        with self.assertRaisesRegex(master.MasterError, "clip"):
            master.build_master(plan)

    def test_master_exact_samples_bit_depth_decode_and_scene_energy(self):
        plan = self.plan()
        result = master.build_master(plan)
        file = Path(result["file"])
        info = sf.info(file)
        self.assertEqual((info.frames, info.samplerate, info.channels, info.subtype),
                         (8 * 48000, 48000, 2, "PCM_24"))
        decoded, _ = sf.read(file, dtype="float64", always_2d=True)
        self.assertTrue(np.array_equal(decoded[:, 0], decoded[:, 1]))
        self.assertLess(np.max(np.abs(decoded)), 1)
        report = json.loads(Path(result["manifest"]).read_text(encoding="utf-8"))
        self.assertEqual(report["verification"]["clippedSamplesPerChannel"], [0, 0])
        self.assertEqual(len(report["verification"]["scenes"]), 3)
        self.assertTrue(all(scene["rmsDbfs"] > -100 for scene in report["verification"]["scenes"]))
        self.assertEqual(report["sha256"], master.file_hash(file))
        self.assertEqual(report["pcm24DataSha256"], master.pcm_payload_hash(file))
        self.assertFalse(report["nativeHiRes"])
        self.assertFalse(report["atmos"])
        self.assertFalse(report["usedLossyInput"])
        # Rebuild from the same source without relying on an output cache.
        second = master.build_master(self.plan())
        self.assertEqual(result["sha256"], second["sha256"])

    def test_manifest_publication_failure_restores_previous_pair(self):
        original = master.build_master(self.plan())
        output, manifest_file = Path(original["file"]), Path(original["manifest"])
        before = (master.file_hash(output), master.file_hash(manifest_file))
        self.manifest["scenes"][0]["normalization"]["gain"] = .6
        self.save_manifest()
        replacement_plan = self.plan()
        real_replace = Path.replace

        def fail_new_manifest(source, target):
            if source.name.endswith(".tmp.json") and Path(target) == manifest_file:
                raise PermissionError("fixture: manifest is locked")
            return real_replace(source, target)

        with mock.patch.object(Path, "replace", new=fail_new_manifest):
            with self.assertRaisesRegex(PermissionError, "manifest is locked"):
                master.build_master(replacement_plan)
        self.assertEqual(before, (master.file_hash(output), master.file_hash(manifest_file)))
        self.assertFalse(list(output.parent.glob("*.rollback")))
        self.assertFalse(list(output.parent.glob("*.tmp.*")))


class ResamplingTests(unittest.TestCase):
    def test_double_length_dc_and_no_group_delay(self):
        signal = np.ones(2048)
        output = master.resample_2x(signal)
        self.assertEqual(len(output), 4096)
        self.assertLess(np.max(np.abs(output[128:-128] - 1)), 1e-5)
        impulse = np.zeros(2048)
        impulse[1000] = 1
        output = master.resample_2x(impulse)
        self.assertEqual(int(np.argmax(output)), 2000)
        self.assertAlmostEqual(output[2000], 1, places=4)

    def test_reconstruction_rejects_upsampling_image(self):
        source = np.sin(2 * np.pi * 1000 * np.arange(24000) / 24000)
        output = master.resample_2x(source)[4800:43200]
        spectrum = np.abs(np.fft.rfft(output))
        tone = spectrum[800]
        image = spectrum[18400]  # 23 kHz image of the original 1 kHz tone.
        self.assertLess(20 * np.log10(max(image, 1e-20) / tone), -70)

    def test_builder_import_does_not_initialize_model(self):
        self.assertNotIn("sherpa_onnx", sys.modules)
        self.assertNotIn("news_audio_pipeline", sys.modules)


if __name__ == "__main__":
    unittest.main(verbosity=2)
