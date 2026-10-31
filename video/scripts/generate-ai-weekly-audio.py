"""Offline AI Weekly narration; only writes to the ai-weekly edition."""
import sys

sys.dont_write_bytecode = True
from news_audio_pipeline import run_cli  # noqa: E402


if __name__ == "__main__":
    run_cli("ai-weekly")
