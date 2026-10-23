import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const base = "http://127.0.0.1:4174/open-pdf-studio/";
const out = join(tmpdir(), "openpdf-pages-test");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "en-US", colorScheme: "light" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(String(error)));
const result = {};

try {
  await page.goto(base, { waitUntil: "networkidle" });
  result.enTitle = await page.title();
  result.enH1 = await page.locator("h1").innerText();
  result.jsonLd = await page.locator('script[type="application/ld+json"]').count();
  result.manifest = await page.locator('link[rel="manifest"]').getAttribute("href");
  result.screenshots = await page.evaluate(async () => {
    const urls = ["./screenshots/viewer-light.webp", "./screenshots/viewer-dark.webp", "./og-image.png", "./icons/pwa-192.png"];
    const results = [];
    for (const url of urls) {
      const response = await fetch(url);
      results.push({ url, status: response.status, type: response.headers.get("content-type") });
    }
    return results;
  });
  await page.screenshot({ path: join(out, "landing-en.png"), fullPage: true });

  const themeBefore = await page.locator("html").getAttribute("data-theme");
  await page.locator("[data-theme-toggle]").first().click();
  const themeAfter = await page.locator("html").getAttribute("data-theme");
  result.themeToggle = { before: themeBefore, after: themeAfter };

  await page.getByRole("link", { name: "PT", exact: true }).click();
  await page.waitForLoadState("networkidle");
  result.ptUrl = page.url();
  result.ptH1 = await page.locator("h1").innerText();
  await page.screenshot({ path: join(out, "landing-pt.png"), fullPage: true });

  await page.locator(".nav-actions a.button.primary").click();
  await page.waitForLoadState("networkidle");
  result.appUrl = page.url();
  await page.getByRole("button", { name: /Open sample PDF/i }).click();
  await page.locator(".page-canvas").waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  result.pageCanvas = await page.locator(".page-canvas").evaluate((canvas) => ({ width: canvas.width, height: canvas.height }));
  result.appTitle = await page.title();

  await page.locator(".language-button").click();
  result.afterLanguage = await page.locator(".rail-button[title='Anotar']").innerText();
  await page.locator(".language-button").click();

  result.sw = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, active: Boolean(registration.active) };
  });
  await page.waitForTimeout(2000);
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".page-canvas").waitFor({ timeout: 30000 }).catch(() => undefined);
  result.offlineAppLoaded = await page.locator(".app").count();
  result.offlineTitle = await page.title();
  await page.screenshot({ path: join(out, "offline.png") });
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
