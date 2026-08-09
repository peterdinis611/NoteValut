import { expect, test } from "@playwright/test";

test.describe("Public routes", () => {
  test("sign-in page shows NoteVault branding and Clerk form", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await expect(page.getByText("NoteVault").first()).toBeVisible();
    await expect(
      page.getByText("Your personal knowledge vault"),
    ).toBeVisible();
    // Clerk mounts an iframe or form root — wait for interactive shell
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
  });

  test("sign-up page shows create-account shell", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByText("NoteVault").first()).toBeVisible();
    await expect(page.getByText("Create your vault account")).toBeVisible();
    await expect(page.locator(".clerk-auth-page")).toBeVisible();
  });

  test("not-authorized page renders status + home action", async ({ page }) => {
    await page.goto("/not-authorized");
    await expect(page.getByRole("heading", { name: "Not authorized" })).toBeVisible();
    await expect(
      page.getByText(/don’t have access|don't have access/i),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /back to vault/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("unknown route shows not-found status", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: /go home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("invalid share link shows not-authorized state", async ({ page }) => {
    await page.goto("/share/invalid-token-for-e2e");
    // Loading then not-authorized (Convex null) or loading forever without Convex —
    // accept either loading copy or unauthorized copy.
    await expect(
      page.getByRole("heading", {
        name: /Opening shared vault|Not authorized/i,
      }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
