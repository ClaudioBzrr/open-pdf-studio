import { chromium } from "playwright-core";
import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PDFDocument } from "@cantoo/pdf-lib";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = join(tmpdir(), "openpdf-ui-test");
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
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".page-canvas");
    return canvas instanceof HTMLCanvasElement && canvas.width > 100;
  }, { timeout: 30000 });
  await page.waitForTimeout(1200);
  results.documentName = await page.locator(".document-name").innerText();
  results.documentMeta = await page.locator(".document-meta").innerText();
  results.pageCanvas = await page.locator(".page-canvas").evaluate((canvas) => ({
    width: canvas.width,
    height: canvas.height,
  }));
  await page.screenshot({ path: join(outDir, "viewer.png"), fullPage: false });

  // Annotate: highlight drag.
  await page.locator('.rail-button[title="Anotar"]').click();
  await page.locator(".tool-button").filter({ hasText: "Marca-texto" }).click();
  const overlay = await page.locator(".page-overlay").boundingBox();
  if (!overlay) throw new Error("Page overlay not found");
  await page.mouse.move(overlay.x + 180, overlay.y + 280);
  await page.mouse.down();
  await page.mouse.move(overlay.x + 430, overlay.y + 320, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  results.annotationItems = await page.locator(".annotation-list li").count();
  await page.screenshot({ path: join(outDir, "annotated.png"), fullPage: false });

  const annotatedDownloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: /Baixar PDF com anotações/ }).click();
  const annotatedDownload = await annotatedDownloadPromise;
  const annotatedPath = join(outDir, annotatedDownload.suggestedFilename());
  await annotatedDownload.saveAs(annotatedPath);
  results.annotatedPdf = { path: annotatedPath, bytes: (await stat(annotatedPath)).size };

  // Search.
  await page.locator('.icon-button[title="Buscar no documento (Ctrl+F)"]').click();
  await page.locator(".search-form input").fill("OpenPDF");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await page.locator(".search-result").first().waitFor({ timeout: 30000 });
  results.searchResults = await page.locator(".search-result").count();
  await page.locator(".search-result").first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(outDir, "search.png"), fullPage: false });

  // Forms.
  await page.locator('.rail-button[title="Formulários"]').click();
  await page.locator(".form-fields").waitFor({ timeout: 20000 });
  results.formFieldCount = await page.locator(".form-fields input, .form-fields select, .form-fields textarea").count();
  const nameInput = page.locator(".form-fields input").first();
  await nameInput.fill("Maria da Silva");
  const emailInput = page.locator(".form-fields input").nth(1);
  await emailInput.fill("maria@example.com");
  const formDownloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: /Baixar preenchido/ }).click();
  const formDownload = await formDownloadPromise;
  const formPath = join(outDir, formDownload.suggestedFilename());
  await formDownload.saveAs(formPath);
  const formBytes = await readFile(formPath);
  const formDoc = await PDFDocument.load(formBytes);
  results.formValues = {
    nome: formDoc.getForm().getTextField("nome").getText(),
    email: formDoc.getForm().getTextField("email").getText(),
    bytes: formBytes.length,
  };

  // Protect.
  await page.locator('.rail-button[title="Proteger"]').click();
  const passwordInputs = page.locator('.panel-content input[type="password"]');
  await passwordInputs.nth(0).fill("senha-teste-123");
  await passwordInputs.nth(1).fill("senha-teste-123");
  const protectDownloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: /Proteger e baixar/ }).click();
  const protectDownload = await protectDownloadPromise;
  const protectPath = join(outDir, protectDownload.suggestedFilename());
  await protectDownload.saveAs(protectPath);
  const protectBytes = await readFile(protectPath);
  let protectedLoaded = false;
  try {
    const protectedDoc = await PDFDocument.load(protectBytes, { password: "senha-teste-123" });
    protectedLoaded = protectedDoc.getPageCount() === 6;
  } catch {
    protectedLoaded = false;
  }
  results.protectedPdf = { path: protectPath, bytes: protectBytes.length, loadedWithPassword: protectedLoaded };

  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
  await page.screenshot({ path: join(outDir, "final.png"), fullPage: false });
} catch (error) {
  results.failure = String(error?.stack ?? error);
  results.consoleErrors = consoleErrors;
  results.pageErrors = pageErrors;
  await page.screenshot({ path: join(outDir, "failure.png"), fullPage: false }).catch(() => undefined);
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
