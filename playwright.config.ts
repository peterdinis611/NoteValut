import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3010);
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright e2e — specs live under `__tests__/e2e`.
 * App tests hit Next on :3010 (avoids clashing with `npm run dev` on :3000).
 * Storybook smoke: `npm run test:e2e:storybook` (Storybook must be running).
 */
export default defineConfig({
  testDir: "__tests__/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /storybook-smoke\.spec\.ts/,
    },
    {
      name: "storybook",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.STORYBOOK_URL ?? "http://127.0.0.1:6006",
      },
      testMatch: /storybook-smoke\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next dev --webpack -H localhost -p ${PORT}`,
    url: `http://localhost:${PORT}/not-authorized`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
