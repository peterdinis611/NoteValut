import { expect, test } from "@playwright/test";

test.describe("password recovery", () => {
  test("login links to forgot-password", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
    await expect(
      page.getByRole("heading", { name: "Forgot password" }),
    ).toBeVisible();
  });

  test("forgot-password form renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: "Forgot password" }),
    ).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
  });

  test("reset-password without token shows request CTA", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByRole("heading", { name: "Choose a new password" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request a new link" }),
    ).toBeVisible();
  });
});
