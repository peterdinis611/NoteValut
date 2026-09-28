import { expect, test } from "@playwright/test";

test.describe("Auth marketing shells", () => {
  test("sign-in has primary CTA region and no app chrome leak", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
    await expect(page.getByText("NoteVault").first()).toBeVisible();
    // Authenticated vault chrome should not mount for guests
    await expect(page.getByRole("button", { name: /quick capture/i })).toHaveCount(0);
    await expect(page.locator(".sidebar-link-create")).toHaveCount(0);
  });

  test("sign-up mirrors branding and clerk mount", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
    await expect(page.getByText(/NoteVault|Create account|Open a vault/i).first()).toBeVisible();
  });
});

test.describe("Not authorized", () => {
  test("shows recovery link home", async ({ page }) => {
    await page.goto("/not-authorized");
    const home = page.getByRole("link", { name: /back to vault/i });
    await expect(home).toBeVisible();
    await expect(home).toHaveAttribute("href", "/");
  });

  test("share with nonsense token still paints a known heading", async ({ page }) => {
    await page.goto("/share/e2e-missing-share-token-zzz");
    await expect(
      page.getByRole("heading", {
        name: /Opening shared vault|Not authorized|Something went wrong/i,
      }),
    ).toBeVisible({ timeout: 25_000 });
  });
});
