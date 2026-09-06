import type { Browser, Page } from "@playwright/test";

export type LatencySample = {
  path: string;
  ms: number;
  ok: boolean;
  status?: number;
  error?: string;
};

export function stressEnv() {
  return {
    iterations: Number(process.env.STRESS_ITERATIONS ?? 24),
    concurrency: Number(process.env.STRESS_CONCURRENCY ?? 8),
    /** Soft budget for p95 navigation time (ms). */
    p95Ms: Number(process.env.STRESS_P95_MS ?? 8_000),
    /** Soft budget for mean navigation time (ms). */
    meanMs: Number(process.env.STRESS_MEAN_MS ?? 4_000),
    /** Max allowed failure rate (0–1). */
    maxFailRate: Number(process.env.STRESS_MAX_FAIL_RATE ?? 0.05),
  };
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  );
  return sortedAsc[idx]!;
}

export function summarize(samples: LatencySample[]) {
  const times = samples.map((s) => s.ms).sort((a, b) => a - b);
  const failures = samples.filter((s) => !s.ok);
  const sum = times.reduce((a, b) => a + b, 0);
  return {
    count: samples.length,
    failures: failures.length,
    failRate: samples.length === 0 ? 0 : failures.length / samples.length,
    min: times[0] ?? 0,
    max: times[times.length - 1] ?? 0,
    mean: samples.length === 0 ? 0 : sum / samples.length,
    p50: percentile(times, 50),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
  };
}

export function formatSummary(label: string, samples: LatencySample[]): string {
  const s = summarize(samples);
  return [
    `[stress] ${label}`,
    `  n=${s.count} fail=${s.failures} (${(s.failRate * 100).toFixed(1)}%)`,
    `  min=${s.min.toFixed(0)}ms mean=${s.mean.toFixed(0)}ms`,
    `  p50=${s.p50.toFixed(0)}ms p95=${s.p95.toFixed(0)}ms p99=${s.p99.toFixed(0)}ms max=${s.max.toFixed(0)}ms`,
  ].join("\n");
}

/** Run `total` async jobs with at most `concurrency` in flight. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]!, i);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => run());
  await Promise.all(runners);
  return results;
}

export async function timedGoto(
  page: Page,
  path: string,
  ready: (page: Page) => Promise<void>,
): Promise<LatencySample> {
  const start = performance.now();
  try {
    const response = await page.goto(path, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await ready(page);
    return {
      path,
      ms: performance.now() - start,
      ok: true,
      status: response?.status(),
    };
  } catch (err) {
    return {
      path,
      ms: performance.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Concurrent browser contexts hammering the same path. */
export async function burstGoto(
  browser: Browser,
  path: string,
  count: number,
  concurrency: number,
  ready: (page: Page) => Promise<void>,
): Promise<LatencySample[]> {
  const indexes = Array.from({ length: count }, (_, i) => i);
  return mapPool(indexes, concurrency, async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      return await timedGoto(page, path, ready);
    } finally {
      await context.close();
    }
  });
}
