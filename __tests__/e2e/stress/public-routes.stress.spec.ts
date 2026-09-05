import { expect, test } from "@playwright/test";
import {
  burstGoto,
  formatSummary,
  mapPool,
  stressEnv,
  summarize,
  timedGoto,
  type LatencySample,
} from "./helpers";

const env = stressEnv();

test.describe.configure({ mode: "parallel" });

test.describe("Stress — public surfaces", () => {
  test(`sign-in burst ×${env.iterations} (c=${env.concurrency})`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const samples = await burstGoto(
      browser,
      "/sign-in",
      env.iterations,
      env.concurrency,
      async (page) => {
        await expect(page.getByText("NoteVault").first()).toBeVisible({
          timeout: 20_000,
        });
        await expect(page.locator(".clerk-auth-page")).toBeVisible({
          timeout: 20_000,
        });
      },
    );

    assertBudgets("sign-in burst", samples);
  });

  test(`auth-redirect burst ×${env.iterations} (c=${env.concurrency})`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const samples = await burstGoto(
      browser,
      "/",
      env.iterations,
      env.concurrency,
      async (page) => {
        await page.waitForURL(/sign-in/, { timeout: 20_000 });
        await expect(page.locator(".clerk-auth-page")).toBeVisible({
          timeout: 20_000,
        });
      },
    );

    assertBudgets("auth-redirect burst", samples);
  });

  test(`not-authorized burst ×${env.iterations} (c=${env.concurrency})`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const samples = await burstGoto(
      browser,
      "/not-authorized",
      env.iterations,
      env.concurrency,
      async (page) => {
        await expect(
          page.getByRole("heading", { name: "Not authorized" }),
        ).toBeVisible({ timeout: 20_000 });
      },
    );

    assertBudgets("not-authorized burst", samples);
  });

  test(`share invalid-token burst ×${env.iterations} (c=${env.concurrency})`, async ({
    browser,
  }) => {
    test.setTimeout(180_000);

    const samples = await burstGoto(
      browser,
      "/share/invalid-token-for-stress",
      env.iterations,
      env.concurrency,
      async (page) => {
        await expect(
          page.getByRole("heading", {
            name: /Opening shared vault|Not authorized/i,
          }),
        ).toBeVisible({ timeout: 25_000 });
      },
    );

    assertBudgets("share invalid-token burst", samples);
  });

  test("sustained public route rotation", async ({ page }) => {
    test.setTimeout(180_000);

    const routes: Array<{
      path: string;
      ready: () => Promise<void>;
    }> = [
      {
        path: "/sign-in",
        ready: async () => {
          await expect(page.locator(".clerk-auth-page")).toBeVisible({
            timeout: 20_000,
          });
        },
      },
      {
        path: "/sign-up",
        ready: async () => {
          await expect(
            page.getByText("Create your vault account"),
          ).toBeVisible({ timeout: 20_000 });
        },
      },
      {
        path: "/not-authorized",
        ready: async () => {
          await expect(
            page.getByRole("heading", { name: "Not authorized" }),
          ).toBeVisible({ timeout: 20_000 });
        },
      },
      {
        path: "/",
        ready: async () => {
          await page.waitForURL(/sign-in/, { timeout: 20_000 });
        },
      },
    ];

    const samples: LatencySample[] = [];
    const rounds = Math.max(4, Math.ceil(env.iterations / routes.length));

    for (let r = 0; r < rounds; r++) {
      for (const route of routes) {
        samples.push(await timedGoto(page, route.path, async () => route.ready()));
      }
    }

    assertBudgets("sustained route rotation", samples);
  });

  test(`mixed concurrent contexts ×${env.concurrency}`, async ({ browser }) => {
    test.setTimeout(180_000);

    const paths = [
      "/sign-in",
      "/sign-up",
      "/not-authorized",
      "/",
      "/share/stress-mixed-token",
    ] as const;

    const jobs = Array.from({ length: env.concurrency * 3 }, (_, i) => ({
      path: paths[i % paths.length]!,
      i,
    }));

    const samples = await mapPool(jobs, env.concurrency, async ({ path }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        return await timedGoto(page, path, async (p) => {
          if (path === "/sign-in" || path === "/sign-up") {
            await expect(p.getByText("NoteVault").first()).toBeVisible({
              timeout: 20_000,
            });
            return;
          }
          if (path === "/not-authorized") {
            await expect(
              p.getByRole("heading", { name: "Not authorized" }),
            ).toBeVisible({ timeout: 20_000 });
            return;
          }
          if (path === "/") {
            await p.waitForURL(/sign-in/, { timeout: 20_000 });
            return;
          }
          await expect(
            p.getByRole("heading", {
              name: /Opening shared vault|Not authorized/i,
            }),
          ).toBeVisible({ timeout: 25_000 });
        });
      } finally {
        await context.close();
      }
    });

    assertBudgets("mixed concurrent contexts", samples);
  });
});

function assertBudgets(label: string, samples: LatencySample[]) {
  const report = formatSummary(label, samples);
  console.log(report);
  test.info().annotations.push({ type: "stress", description: report });

  const stats = summarize(samples);
  expect(stats.count, `${label}: no samples`).toBeGreaterThan(0);
  expect(
    stats.failRate,
    `${label}: fail rate ${(stats.failRate * 100).toFixed(1)}% > ${(env.maxFailRate * 100).toFixed(0)}%`,
  ).toBeLessThanOrEqual(env.maxFailRate);
  expect(
    stats.p95,
    `${label}: p95 ${stats.p95.toFixed(0)}ms > budget ${env.p95Ms}ms`,
  ).toBeLessThanOrEqual(env.p95Ms);
  expect(
    stats.mean,
    `${label}: mean ${stats.mean.toFixed(0)}ms > budget ${env.meanMs}ms`,
  ).toBeLessThanOrEqual(env.meanMs);
}
