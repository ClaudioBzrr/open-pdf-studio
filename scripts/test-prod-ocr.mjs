import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR" });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Abrir PDF de exemplo/ }).click();
await page.locator(".page-canvas").waitFor({ timeout: 30000 });
await page.locator('.rail-button[title="OCR"]').click();
await page.getByRole("button", { name: /Executar OCR/ }).click();
await page.locator(".ocr-output").waitFor({ timeout: 180000 });
const text = await page.locator(".ocr-output").inputValue();
console.log(JSON.stringify({ characters: text.length, sample: text.slice(0, 120), errors }, null, 2));
await browser.close();
