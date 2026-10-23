import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = join(tmpdir(), "openpdf-prod-test");
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
const consoleErrors = [];
const pageErrors = [];
const requests = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("request", (request) => requests.push(request.url()));

const results = {};
try {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Abrir PDF de exemplo/ }).click();
  await page.locator(".page-canvas").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1200);
  results.document = await page.locator(".document-name").innerText();
  results.swRegistered = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration);
  });
  results.externalRequests = requests.filter((url) => !url.startsWith("http://127.0.0.1:4173/") && !url.startsWith("blob:") && !url.startsWith("data:"));
  results.localAssetCount = requests.filter((url) => url.startsWith("http://127.0.0.1:4173/")).length;
  await page.screenshot({ path: join(outDir, "prod-viewer.png") });
  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
} catch (error) {
  results.failure = String(error?.stack ?? error);
  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
  await page.screenshot({ path: join(outDir, "failure.png") }).catch(() => undefined);
} finally {
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
