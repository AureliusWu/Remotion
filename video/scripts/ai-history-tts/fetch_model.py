"""Download the official sherpa-onnx Kokoro archive into ignored task storage."""
from pathlib import Path
import hashlib
import tarfile
import urllib.request

VIDEO = Path(__file__).resolve().parents[2]
CACHE = VIDEO / "out" / "ai-history-tts"
NAME = "kokoro-int8-multi-lang-v1_1.tar.bz2"
URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{NAME}"
SHA256 = "259c9c8bc906d6078e4e0570421885dabb68b539c2f970fcbb890a58eeaf3e9c"


def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    archive = CACHE / NAME
    if not archive.exists() or digest(archive) != SHA256:
        partial = archive.with_suffix(archive.suffix + ".part")
        with urllib.request.urlopen(URL, timeout=90) as source, partial.open("wb") as target:
            total = 0
            while chunk := source.read(4 * 1024 * 1024):
                target.write(chunk)
                total += len(chunk)
                print(f"Downloaded {total / 1024 / 1024:.1f} MiB", flush=True)
        if digest(partial) != SHA256:
            raise RuntimeError("Official model archive SHA-256 mismatch")
        partial.replace(archive)
    model_root = CACHE / NAME.removesuffix(".tar.bz2")
    if not model_root.exists():
        with tarfile.open(archive, "r:bz2") as bundle:
            bundle.extractall(CACHE, filter="data")
    print(f"Archive verified: sha256:{SHA256}")
    print(f"Model directory: {model_root}")


if __name__ == "__main__":
    main()
