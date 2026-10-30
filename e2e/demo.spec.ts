import { expect, test } from "@playwright/test";

test.describe("demo vault", () => {
  test("loads seeded shelf without sign-in", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByText("Demo shelf")).toBeVisible();
    await expect(page.getByRole("button", { name: "Lab" })).toBeVisible();
  });

  test("opens Lab with Day brief widget", async ({ page }) => {
    await page.goto("/demo");
    await page.getByRole("button", { name: "Lab" }).click();

    await expect(
      page.getByRole("heading", { name: "Lab", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Day brief" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reveal day" }),
    ).toBeVisible();
  });
});
