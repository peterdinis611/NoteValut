import { expect, test } from "@playwright/test";

test.describe("Auth gate", () => {
  test("home shows marketing landing with CTAs for guests", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("marketing-landing")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Open your vault" })).toBeVisible();
    await expect(page.getByTestId("landing-cta")).toBeVisible();
    await page.getByRole("link", { name: "Open your vault" }).click();
    await page.waitForURL(/sign-up/, { timeout: 20_000 });
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
  });
});
