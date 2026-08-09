import { expect, test } from "@playwright/test";

/**
 * Opt-in Storybook smoke — run with:
 *   npm run storybook   # terminal 1
 *   npm run test:e2e:storybook
 *
 * Or CI: build static Storybook and serve it, then set STORYBOOK_URL.
 */
const STORY_IDS = [
  "components-lottiestatus--loading",
  "components-lottiestatus--error",
  "components-uitooltip--default",
  "editor-formattoolbar--default",
  "app-routes-notfound--default",
  "app-colors--palette",
];

test.describe("Storybook smoke", () => {
  test.beforeEach(async ({ baseURL }) => {
    test.skip(
      !baseURL?.includes("6006") && !process.env.STORYBOOK_URL,
      "Start Storybook (port 6006) or set STORYBOOK_URL",
    );
  });

  test("index lists stories", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/index.json`);
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as { entries: Record<string, { type?: string }> };
    const stories = Object.values(json.entries).filter((e) => e.type === "story");
    expect(stories.length).toBeGreaterThan(10);
  });

  for (const id of STORY_IDS) {
    test(`renders ${id}`, async ({ page, baseURL }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(`${baseURL}/iframe.html?id=${id}&viewMode=story`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(500);

      const overlay = page.locator(".sb-errordisplay");
      await expect(overlay).toHaveCount(0);
      expect(
        errors.filter((e) =>
          /Cannot read propert|is not a function|TypeError|ReferenceError/i.test(e),
        ),
      ).toEqual([]);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});
