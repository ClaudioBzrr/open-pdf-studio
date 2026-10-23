import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "en-US" });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(String(error)));
const base = "http://127.0.0.1:4174/open-pdf-studio/";
await page.goto(`${base}app/`, { waitUntil: "networkidle" });
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await page.waitForTimeout(2500);
await context.setOffline(true);
await page.reload({ waitUntil: "domcontentloaded" });
await page.getByRole("button", { name: /Open sample PDF/i }).click();
await page.locator(".page-canvas").waitFor({ timeout: 30000 });
const canvas = await page.locator(".page-canvas").evaluate((item) => ({ width: item.width, height: item.height }));
const doc = await page.locator(".document-name").innerText();
console.log(JSON.stringify({ canvas, doc, errors }, null, 2));
await browser.close();
