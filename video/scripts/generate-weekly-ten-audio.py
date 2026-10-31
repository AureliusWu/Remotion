"""Weekly Ten's compatible CLI, backed by the edition-scoped audio pipeline."""
import sys

sys.dont_write_bytecode = True
from news_audio_pipeline import run_cli  # noqa: E402


if __name__ == "__main__":
    run_cli("weekly-ten", expected_news_count=10)
