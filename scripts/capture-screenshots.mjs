import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const out = "public/screenshots";
const appUrl = process.env.SCREENSHOT_URL ?? "http://127.0.0.1:5173/app/";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });

for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "en-US",
    colorScheme: scheme,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(out, `welcome-${scheme}.png`) });
  await page.getByRole("button", { name: /Sample PDF/i }).click();
  await page.locator(".page-canvas").waitFor({ timeout: 30000 });
  await page.locator(".textLayer span").first().waitFor({ timeout: 20000 }).catch(() => undefined);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: join(out, `viewer-${scheme}.png`) });
  await context.close();
}

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "en-US",
  colorScheme: "light",
  deviceScaleFactor: 2,
  isMobile: true,
});
const mobilePage = await mobile.newPage();
await mobilePage.goto(appUrl, { waitUntil: "networkidle" });
await mobilePage.screenshot({ path: join(out, "mobile-welcome.png"), fullPage: false });
await mobilePage.getByRole("button", { name: /Sample PDF/i }).click();
await mobilePage.locator(".page-canvas").waitFor({ timeout: 30000 });
await mobilePage.waitForTimeout(1000);
await mobilePage.screenshot({ path: join(out, "mobile-viewer.png"), fullPage: false });
await mobile.close();

await browser.close();
console.log("screenshots captured");
