import { expect, test } from "@playwright/test";
import {
  cssVar,
  FOLIO,
  FOLIO_HOUSE_MIGRATION_KEY,
  forestSettingsPayload,
  hexToRgb,
  PHOSPHOR_ACCENT,
  SETTINGS_STORAGE_KEY,
} from "./helpers/folio";

test.describe("Folio theme", () => {
  test("landing uses paper, ink, and brew orange", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("marketing-landing")).toBeVisible({ timeout: 20_000 });

    await expect(page.getByRole("heading", { name: /Your Daily Pages/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open your vault" })).toBeVisible();

    expect(await cssVar(page, "--background")).toBe(FOLIO.background);
    expect(await cssVar(page, "--accent")).toBe(FOLIO.accent);
    expect(await cssVar(page, "--foreground")).toBe(FOLIO.foreground);
    expect(await cssVar(page, "--lilac")).toBe(FOLIO.lilac);
    expect(await cssVar(page, "--accent")).not.toBe(PHOSPHOR_ACCENT);

    const landing = page.getByTestId("marketing-landing");
    await expect(landing).toHaveCSS("background-color", hexToRgb(FOLIO.background));
    await expect(landing).toHaveCSS("color", hexToRgb(FOLIO.foreground));
  });

  test("sign-in desk uses Folio tokens, not Phosphor lime", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Your Daily/i })).toBeVisible();

    expect(await cssVar(page, "--background")).toBe(FOLIO.background);
    expect(await cssVar(page, "--accent")).toBe(FOLIO.accent);
    expect(await cssVar(page, "--accent")).not.toBe(PHOSPHOR_ACCENT);

    await expect(page.locator("body")).toHaveCSS("background-color", hexToRgb(FOLIO.background));
  });

  test("not-authorized status page stays on Folio paper", async ({ page }) => {
    await page.goto("/not-authorized");
    await expect(page.getByRole("heading", { name: "Not authorized" })).toBeVisible();
    expect(await cssVar(page, "--background")).toBe(FOLIO.background);
    expect(await cssVar(page, "--accent")).toBe(FOLIO.accent);
    await expect(page.locator("body")).toHaveCSS("background-color", hexToRgb(FOLIO.background));
  });

  test("migrates a stored Phosphor vault onto Folio once", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator(".clerk-auth-page")).toBeVisible();

    await page.evaluate(
      ({ settingsKey, flagKey, payload }) => {
        localStorage.removeItem(flagKey);
        const current = JSON.parse(localStorage.getItem(settingsKey) ?? "{}") as Record<
          string,
          { data?: { themeId?: string } }
        >;
        const row = Object.values(current)[0];
        if (row?.data) {
          row.data.themeId = "forest";
          localStorage.setItem(settingsKey, JSON.stringify(current));
        } else {
          localStorage.setItem(settingsKey, payload);
        }
      },
      {
        settingsKey: SETTINGS_STORAGE_KEY,
        flagKey: FOLIO_HOUSE_MIGRATION_KEY,
        payload: forestSettingsPayload(),
      },
    );

    await page.reload();
    await expect(page.locator(".clerk-auth-page")).toBeVisible();

    await expect.poll(async () => cssVar(page, "--accent")).toBe(FOLIO.accent);
    expect(await cssVar(page, "--background")).toBe(FOLIO.background);

    const migrated = await page.evaluate(
      ({ settingsKey, flagKey }) => {
        const parsed = JSON.parse(localStorage.getItem(settingsKey) ?? "{}") as Record<
          string,
          { data?: { themeId?: string } }
        >;
        return {
          flag: localStorage.getItem(flagKey),
          themeId: Object.values(parsed)[0]?.data?.themeId,
        };
      },
      { settingsKey: SETTINGS_STORAGE_KEY, flagKey: FOLIO_HOUSE_MIGRATION_KEY },
    );
    expect(migrated.flag).toBe("1");
    expect(migrated.themeId).toBe("default");
  });
});
