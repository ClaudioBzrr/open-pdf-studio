import { chromium } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outDir = join(tmpdir(), "openpdf-final-test");
await mkdir(outDir, { recursive: true });
const redactedPath = join(tmpdir(), "openpdf-tools-test", "exemplo-openpdf-redigido.pdf");

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

  // Compare.
  await page.locator('.rail-button[title="Comparar"]').click();
  await page.locator('.panel-content input[type="file"]').setInputFiles(redactedPath);
  await page.locator(".panel-content .button.primary").click();
  await page.locator(".compare-card").first().waitFor({ timeout: 120000 });
  results.compareCards = await page.locator(".compare-card").count();
  results.compareSummary = await page.locator(".compare-summary").innerText();
  await page.screenshot({ path: join(outDir, "compare.png") });

  // Signature (typed) on page 5.
  const pageInput = page.locator(".page-jump input");
  await pageInput.fill("5");
  await pageInput.press("Enter");
  await page.waitForTimeout(900);
  await page.locator('.rail-button[title="Editar"]').click();
  await page.getByRole("button", { name: /Digitar/ }).click();
  await page.locator('.panel-content input[placeholder="Seu nome"]').fill("Maria Silva");
  await page.getByRole("button", { name: /Usar assinatura/ }).click();
  const overlay = await page.locator(".page-overlay").boundingBox();
  if (!overlay) throw new Error("Overlay not found");
  await page.mouse.click(overlay.x + 120, overlay.y + 680);
  await page.waitForTimeout(500);
  results.signatureImages = await page.locator(".page-overlay image").count();
  await page.screenshot({ path: join(outDir, "signature.png") });

  const signedDownloadPromise = page.waitForEvent("download", { timeout: 60000 });
  await page.locator('.button.primary.topbar-button').click();
  const signedDownload = await signedDownloadPromise;
  const signedPath = join(outDir, signedDownload.suggestedFilename());
  await signedDownload.saveAs(signedPath);
  results.signedPdf = { path: signedPath, bytes: (await readFile(signedPath)).length };

  // Delete page 2.
  await page.locator('.rail-button[title="Páginas"]').click();
  await page.locator(".page-check").nth(1).click();
  await page.getByRole("button", { name: /Excluir/ }).click();
  await page.waitForTimeout(2000);
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
