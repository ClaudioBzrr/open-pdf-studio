import { chromium } from "playwright-core";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = join(tmpdir(), "openpdf-tools-test");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "pt-BR", acceptDownloads: true });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("dialog", (dialog) => dialog.accept());

const results = {};

try {
  await page.goto("http://127.0.0.1:5173/app/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Abrir PDF de exemplo/ }).click();
  await page.locator(".page-canvas").waitFor({ state: "visible", timeout: 30000 });
  await page.waitForTimeout(1000);

  // OCR current page.
  await page.locator('.rail-button[title="OCR"]').click();
  await page.getByRole("button", { name: /Executar OCR/ }).click();
  await page.locator(".ocr-output").waitFor({ state: "visible", timeout: 180000 });
  const ocrText = await page.locator(".ocr-output").inputValue();
  results.ocr = { characters: ocrText.length, sample: ocrText.slice(0, 160).replace(/\s+/g, " ") };
  await page.screenshot({ path: join(outDir, "ocr.png") });

  // Go to page 6 and redact the sensitive block.
  const pageInput = page.locator(".page-jump input");
  await pageInput.fill("6");
  await pageInput.press("Enter");
  await page.waitForTimeout(900);
  await page.locator('.rail-button[title="Editar"]').click();
  await page.getByRole("button", { name: "Redigir", exact: true }).click();
  await page.getByRole("button", { name: /Marcar área de redação/ }).click();
  const overlay = await page.locator(".page-overlay").boundingBox();
  if (!overlay) throw new Error("Overlay not found on page 6");
  await page.mouse.move(overlay.x + 70, overlay.y + 470);
  await page.mouse.down();
  await page.mouse.move(overlay.x + 520, overlay.y + 690, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  results.redactionMarked = await page.locator(".panel-content").innerText().then((text) => text.includes("1 área(s) marcada(s)"));
  await page.screenshot({ path: join(outDir, "redaction-marked.png") });

  const redactDownloadPromise = page.waitForEvent("download", { timeout: 120000 });
  await page.getByRole("button", { name: /Aplicar redação e baixar/ }).click();
  const redactDownload = await redactDownloadPromise;
  const redactPath = join(outDir, redactDownload.suggestedFilename());
  await redactDownload.saveAs(redactPath);
  const redactBytes = await readFile(redactPath);
  results.redactedPdf = { path: redactPath, bytes: redactBytes.length };
  try {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(redactBytes), disableWorker: true }).promise;
    const textContent = await (await doc.getPage(6)).getTextContent();
    const text = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    results.redactedPdf.page6Text = text.trim();
    results.redactedPdf.secretRemoved = !text.includes("CPF") && !text.includes("OPENPDF-DEMO");
    await doc.destroy();
  } catch (error) {
    results.redactedPdf.textCheckError = String(error?.message ?? error);
  }

  // Compression.
  await page.getByRole("button", { name: "Comprimir", exact: true }).click();
  const compressDownloadPromise = page.waitForEvent("download", { timeout: 120000 });
  await page.getByRole("button", { name: /Comprimir e baixar/ }).click();
  const compressDownload = await compressDownloadPromise;
  const compressPath = join(outDir, compressDownload.suggestedFilename());
  await compressDownload.saveAs(compressPath);
  results.compressedPdf = { path: compressPath, bytes: (await stat(compressPath)).size };

  // Compare with the redacted PDF.
  await page.locator('.rail-button[title="Comparar"]').click();
  await page.locator('.panel-content input[type="file"]').setInputFiles(redactPath);
  await page.locator(".panel-content .button.primary").click();
  await page.locator(".compare-card").first().waitFor({ timeout: 120000 });
  results.compareCards = await page.locator(".compare-card").count();
  await page.screenshot({ path: join(outDir, "compare.png") });

  // Delete page 2.
  await page.locator('.rail-button[title="Páginas"]').click();
  await page.locator(".page-check").nth(1).click();
  await page.getByRole("button", { name: /Excluir/ }).click();
  await page.waitForTimeout(1800);
  results.afterDeleteMeta = await page.locator(".document-meta").innerText();
  await page.screenshot({ path: join(outDir, "pages.png") });

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
