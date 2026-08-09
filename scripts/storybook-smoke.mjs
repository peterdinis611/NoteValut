/**
 * Smoke-test every Storybook story in Chromium.
 * Reports runtime errors / crash screens.
 */
import { chromium } from "playwright";

const BASE = process.env.STORYBOOK_URL ?? "http://localhost:6006";

async function main() {
  const index = await fetch(`${BASE}/index.json`).then((r) => r.json());
  const stories = Object.values(index.entries).filter((e) => e.type === "story");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const failures = [];
  const pageErrors = [];

  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      text.includes("Failed to load resource") ||
      text.includes("net::") ||
      text.includes("favicon")
    ) {
      return;
    }
    pageErrors.push(text);
  });

  for (const story of stories) {
    pageErrors.length = 0;
    const url = `${BASE}/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await page.waitForTimeout(800);

      const bodyText = await page.locator("body").innerText().catch(() => "");
      const hasSbError = await page
        .locator(".sb-errordisplay, #error-message, [data-is-storybook-error]")
        .count();
      const reactCrash =
        /Minified React error|Cannot read propert|is not a function|is not defined|Objects are not valid as a React child/i.test(
          bodyText,
        ) ||
        pageErrors.some((e) =>
          /Cannot read propert|is not a function|is not defined|Objects are not valid as a React child|TypeError|ReferenceError/i.test(
            e,
          ),
        );

      if (hasSbError > 0 || reactCrash) {
        failures.push({
          id: story.id,
          reason: pageErrors[0] || bodyText.slice(0, 240) || "storybook error overlay",
        });
      }
    } catch (err) {
      failures.push({
        id: story.id,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await browser.close();

  console.log(`Checked ${stories.length} stories`);
  if (!failures.length) {
    console.log("All stories rendered without detected runtime crashes.");
    process.exit(0);
  }
  console.log(`\n${failures.length} failing stories:\n`);
  for (const f of failures) {
    console.log(`- ${f.id}\n  ${f.reason.replace(/\n/g, " ").slice(0, 300)}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
