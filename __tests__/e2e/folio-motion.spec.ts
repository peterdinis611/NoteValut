import { expect, test } from "@playwright/test";

test.describe("Folio motion (anime.js)", () => {
  test("landing plays anime.js and does not load Framer Motion", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (req) => urls.push(req.url()));

    await page.goto("/");
    const root = page.getByTestId("marketing-landing");
    await expect(root).toBeVisible({ timeout: 20_000 });
    await expect(root).toHaveClass(/nv-land-motion/, { timeout: 8_000 });

    const resources = await page.evaluate(() =>
      performance.getEntriesByType("resource").map((e) => e.name),
    );
    const all = [...urls, ...resources].join("\n");
    expect(all).not.toMatch(/framer-motion/i);
    expect(all).not.toMatch(/\/motion\/react/i);
  });

  test("landing respects reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const root = page.getByTestId("marketing-landing");
    await expect(root).toBeVisible({ timeout: 20_000 });
    await expect(root).not.toHaveClass(/nv-land-motion/);
  });

  test("sign-in gate plays Folio page motion", async ({ page }) => {
    await page.goto("/sign-in");
    const shell = page.locator(".clerk-auth-page");
    await expect(shell).toBeVisible();
    await expect(shell).toHaveClass(/nv-folio-motion/, { timeout: 8_000 });
  });

  test("not-authorized status plays Folio page motion", async ({ page }) => {
    await page.goto("/not-authorized");
    await expect(page.getByRole("heading", { name: "Not authorized" })).toBeVisible();
    await expect(page.locator(".status-page")).toHaveClass(/nv-folio-motion/, { timeout: 8_000 });
  });
});
