import { chromium } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = join(tmpdir(), "openpdf-extra-test");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR", acceptDownloads: true });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));

const results = {};

try {
  await page.goto("http://127.0.0.1:5173/app/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Abrir PDF de exemplo/ }).click();
  await page.locator(".page-canvas").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1000);

  // Highlight, then move it with the select tool.
  await page.locator('.rail-button[title="Anotar"]').click();
  await page.locator(".tool-button").filter({ hasText: "Marca-texto" }).click();
  const overlay = await page.locator(".page-overlay").boundingBox();
  if (!overlay) throw new Error("Overlay missing");
  await page.mouse.move(overlay.x + 200, overlay.y + 500);
  await page.mouse.down();
  await page.mouse.move(overlay.x + 400, overlay.y + 540, { steps: 8 });
  await page.mouse.up();
  const before = await page.locator(".annotation-list li").innerText();
  await page.locator(".tool-button").filter({ hasText: "Selecionar" }).click();
  await page.locator('.page-overlay rect[fill="#facc15"]').last().click();
  await page.mouse.move(overlay.x + 300, overlay.y + 520);
  await page.mouse.down();
  await page.mouse.move(overlay.x + 360, overlay.y + 620, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const after = await page.locator(".annotation-list li").innerText();
  results.moveAnnotation = { before, after };
  await page.screenshot({ path: join(outDir, "moved.png") });

  // OCR and searchable PDF.
  await page.locator('.rail-button[title="OCR"]').click();
  await page.getByRole("button", { name: /Executar OCR/ }).click();
  await page.locator(".ocr-output").waitFor({ state: "visible", timeout: 180000 });
  const searchablePromise = page.waitForEvent("download", { timeout: 60000 });
  await page.getByRole("button", { name: /Baixar PDF pesquisável/ }).click();
  const searchable = await searchablePromise;
  const searchablePath = join(outDir, searchable.suggestedFilename());
  await searchable.saveAs(searchablePath);
  const bytes = await readFile(searchablePath);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), disableWorker: true }).promise;
  const textContent = await (await pdf.getPage(1)).getTextContent();
  const text = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
  results.searchablePdf = {
    bytes: bytes.length,
    textLength: text.length,
    hasOpenPdf: /openpdf/i.test(text),
    sample: text.slice(0, 140),
  };
  await pdf.destroy();

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
