export const ratePerMinute = 2;
export const factorial = (n: number): number =>
  n < 2 ? 1 : n * factorial(n - 1);
export const poissonMass = (k: number, mean: number) =>
  (Math.exp(-mean) * mean ** k) / factorial(k);
export const survival = (minutes: number, rate = ratePerMinute) =>
  Math.exp(-rate * minutes);

// Deterministic inverse-CDF simulation. Times are minutes, never measurements.
export const simulateArrivals = (
  seed: number,
  horizon: number,
  rate = ratePerMinute,
) => {
  let state = seed >>> 0;
  const events: number[] = [];
  let time = 0;
  while (time < horizon) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const uniform = (state + 0.5) / 4294967296;
    time += -Math.log(1 - uniform) / rate;
    if (time <= horizon) events.push(time);
  }
  return events;
};
export const sampleArrivals = simulateArrivals(731, 3);
