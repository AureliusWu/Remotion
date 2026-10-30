"""Verify delivered narration bytes and subtitle fidelity against the approved script."""
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import math

VIDEO = Path(__file__).resolve().parents[2]
ASSETS = VIDEO / "public" / "ai-history"


def sha256(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def main():
    storyboard_path = VIDEO / "effects" / "ai-history" / "storyboard.json"
    plan = json.loads(storyboard_path.read_text(encoding="utf-8-sig"))
    manifest_path = ASSETS / "voiceover-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["status"] == "passed", "Generation is not complete"
    assert [shot["id"] for shot in plan["shots"]] == [scene["id"] for scene in manifest["scenes"]], "Missing or reordered scenes"
    results = []
    captions_total = 0
    for shot, scene in zip(plan["shots"], manifest["scenes"]):
        path = ASSETS / scene["file"]
        assert sha256(path) == scene["sha256"], f"Changed audio bytes: {scene['id']}"
        assert scene["text"] == "".join(shot["narration"]), f"Narration mismatch: {scene['id']}"
        assert [cue["text"] for cue in scene["captions"]] == shot["narration"], f"Caption mismatch: {scene['id']}"
        assert scene["speakerId"] == 3 and scene["speed"] == 1.0
        assert scene["fullDecodePassed"] and scene["audioMeasurement"]["fullDecodePassed"]
        assert all(math.isfinite(scene["audioMeasurement"][key]) for key in ["peakDbfs", "rmsDbfs"])
        assert -70 < scene["audioMeasurement"]["rmsDbfs"] and scene["audioMeasurement"]["peakDbfs"] < 0
        previous_end = 0
        for cue in scene["captions"]:
            assert previous_end <= cue["startSeconds"] < cue["endSeconds"], f"Overlapping caption: {scene['id']}"
            assert cue["endSeconds"] <= scene["durationSeconds"] + 0.2, f"Caption exceeds narration: {scene['id']}"
            assert "\ufffd" not in cue["text"], "Replacement character in subtitle"
            previous_end = cue["endSeconds"]
            captions_total += 1
        results.append({"id": scene["id"], "durationSeconds": scene["durationSeconds"], "sha256": scene["sha256"], "status": "passed"})
    current_model = VIDEO / "out" / "ai-history-tts" / "kokoro-int8-multi-lang-v1_1" / "model.int8.onnx"
    assert sha256(current_model) == manifest["model"]["modelSha256"], "Different local model"
    report = {
        "checkedAt": datetime.now(timezone.utc).isoformat(), "status": "passed",
        "sceneCount": len(results), "captionCount": captions_total,
        "totalAudioSeconds": sum(scene["durationSeconds"] for scene in manifest["scenes"]),
        "minimumSceneSeconds": min(scene["durationSeconds"] for scene in manifest["scenes"]),
        "maximumSceneSeconds": max(scene["durationSeconds"] for scene in manifest["scenes"]),
        "highestPeakDbfs": max(scene["audioMeasurement"]["peakDbfs"] for scene in manifest["scenes"]),
        "rmsRangeDbfs": [min(scene["audioMeasurement"]["rmsDbfs"] for scene in manifest["scenes"]), max(scene["audioMeasurement"]["rmsDbfs"] for scene in manifest["scenes"])],
        "totalMp3Bytes": sum(scene["bytes"] for scene in manifest["scenes"]),
        "storyboardFileHashMatches": sha256(storyboard_path) == manifest["storyboardSha256"],
        "narrationMatchesApprovedStoryboard": True,
        "voiceoverManifestSha256": sha256(manifest_path), "modelSha256": manifest["model"]["modelSha256"],
        "scenes": results,
    }
    output = VIDEO / "out" / "ai-history-tts" / "final-audit.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "scenes"}, ensure_ascii=False), flush=True)
    print(f"Saved {output}")


if __name__ == "__main__":
    main()
