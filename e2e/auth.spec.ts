import { expect, test } from "@playwright/test";

test.describe("auth pages", () => {
  test("login form renders email and password", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("login shows validation when empty", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();

    await page.locator("form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
    });

    await expect(
      page.getByText("Email and password are required."),
    ).toBeVisible();
  });

  test("signup page is reachable", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
