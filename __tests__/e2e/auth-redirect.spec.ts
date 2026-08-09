import { expect, test } from "@playwright/test";

test.describe("Auth gate", () => {
  test("home redirects unauthenticated users to sign-in", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/sign-in/, { timeout: 20_000 });
    await expect(page).toHaveURL(/sign-in/);
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
  });
});
