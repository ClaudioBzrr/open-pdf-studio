import { chromium } from "playwright-core";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));

const result = {};
try {
  await page.goto("http://127.0.0.1:5173/app/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Abrir PDF de exemplo/ }).click();
  await page.locator(".page-canvas").waitFor({ state: "visible", timeout: 30000 });
  await page.locator(".textLayer span").first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  result.textSpans = await page.locator(".textLayer span").count();

  const title = page.locator(".textLayer span").filter({ hasText: "OpenPDF" }).first();
  const box = await title.boundingBox();
  if (!box) throw new Error("Title span not found");
  await page.mouse.move(box.x + 5, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  result.selection = await page.evaluate(() => window.getSelection()?.toString() ?? "");

  await page.locator('.rail-button[title="Anotar"]').click();
  await page.locator(".tool-button").filter({ hasText: "Marca-texto" }).click();
  const overlay = await page.locator(".page-overlay").boundingBox();
  await page.mouse.move(overlay.x + 180, overlay.y + 600);
  await page.mouse.down();
  await page.mouse.move(overlay.x + 430, overlay.y + 640, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  result.annotations = await page.locator(".annotation-list li").count();
  await page.screenshot({ path: "C:\\Users\\supor\\AppData\\Local\\Temp\\openpdf-textlayer.png" });
  result.errors = errors;
} catch (error) {
  result.failure = String(error?.stack ?? error);
  result.errors = errors;
} finally {
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));
