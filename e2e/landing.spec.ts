import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("shows brand and primary CTAs", async ({ page }) => {
    await page.goto("/");

    const hero = page.getByRole("group", { name: "Primary actions" });
    await expect(page.getByRole("heading", { name: "NoteValut" })).toBeVisible();
    await expect(
      hero.getByRole("link", { name: "Get NoteValut Free" }),
    ).toBeVisible();
    await expect(hero.getByRole("link", { name: "Try the demo" })).toBeVisible();
  });

  test("navigates to signup from hero CTA", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("group", { name: "Primary actions" })
      .getByRole("link", { name: "Get NoteValut Free" })
      .click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("navigates to demo from hero CTA", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("group", { name: "Primary actions" })
      .getByRole("link", { name: "Try the demo" })
      .click();
    await expect(page).toHaveURL(/\/demo/);
    await expect(page.getByText("Demo shelf")).toBeVisible();
  });
});
