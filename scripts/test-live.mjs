import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const base = "https://claudiobzrr.github.io/open-pdf-studio/";
const out = join(tmpdir(), "openpdf-live");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "en-US", colorScheme: "light" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(String(error)));
const result = {};

try {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.locator("h1").waitFor({ timeout: 30000 });
  result.landingStatus = (await page.request.get(base)).status();
  result.landingTitle = await page.title();
  result.landingH1 = await page.locator("h1").innerText();
  result.manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  result.manifestStatus = (await page.request.get(new URL(result.manifestHref, base).href)).status();
  await page.screenshot({ path: join(out, "landing-live.png"), fullPage: true });

  await page.locator('.nav-actions a[href="./pt/"]').click();
  await page.waitForLoadState("domcontentloaded");
  result.ptUrl = page.url();
  result.ptH1 = await page.locator("h1").innerText();

  await page.locator('.nav-actions a.button.primary').click();
  await page.waitForLoadState("domcontentloaded");
  result.appUrl = page.url();
  await page.getByRole("button", { name: /Open sample PDF/i }).click();
  await page.locator(".page-canvas").waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  result.canvas = await page.locator(".page-canvas").evaluate((item) => ({ width: item.width, height: item.height }));
  result.sw = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, active: Boolean(registration.active) };
  });
  await page.screenshot({ path: join(out, "app-live.png") });

  await page.waitForTimeout(2500);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Open sample PDF/i }).click();
  await page.locator(".page-canvas").waitFor({ timeout: 30000 });
  result.offlineCanvas = await page.locator(".page-canvas").evaluate((item) => ({ width: item.width, height: item.height }));
  await context.setOffline(false);
  result.errors = errors;
} catch (error) {
  result.failure = String(error?.stack ?? error);
  result.errors = errors;
  await page.screenshot({ path: join(out, "failure.png") }).catch(() => undefined);
} finally {
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));
