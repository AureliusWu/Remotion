"""Compare bounded CPU configurations without installing another backend."""
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import json
import time
import sys
sys.dont_write_bytecode = True
from make_samples import make_engine

TEXT = "人工智能的发展，不只是更大的模型，也包括数据、算力和人的选择。"


def test_threads(threads):
    started = time.perf_counter()
    engine = make_engine(threads)
    loaded = time.perf_counter()
    audio = engine.generate(TEXT, sid=3, speed=1.0)
    stopped = time.perf_counter()
    seconds = len(audio.samples) / audio.sample_rate
    return {"threads": threads, "loadSeconds": loaded-started, "synthesisSeconds": stopped-loaded, "audioSeconds": seconds, "realTimeFactor": (stopped-loaded)/seconds}


def main():
    results = []
    for threads in [2, 4, 6]:
        result = test_threads(threads)
        results.append(result)
        print(json.dumps(result), flush=True)
    started = time.perf_counter()
    with ProcessPoolExecutor(max_workers=2) as pool:
        concurrent = list(pool.map(test_threads, [2, 2]))
    elapsed = time.perf_counter()-started
    result = {"configuration":"2 processes x 2 threads", "wallSecondsIncludingLoads":elapsed,"totalAudioSeconds":sum(item["audioSeconds"] for item in concurrent),"aggregateRealTimeFactor":elapsed/sum(item["audioSeconds"] for item in concurrent),"workers":concurrent}
    print(json.dumps(result), flush=True)
    results.append(result)
    (Path(__file__).resolve().parents[2]/"out/ai-history-tts/benchmark.json").write_text(json.dumps(results,indent=2)+"\n",encoding="utf-8")


if __name__ == "__main__":
    main()
