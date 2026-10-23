import { chromium } from "playwright-core";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: chrome, headless: true });

for (const colorScheme of ["light", "dark"]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/app/", { waitUntil: "networkidle" });
  await page.screenshot({ path: `C:/Users/supor/AppData/Local/Temp/openpdf-theme-${colorScheme}-welcome.png` });
  await page.getByRole("button", { name: /Abrir PDF de exemplo/ }).click();
  await page.locator(".page-canvas").waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `C:/Users/supor/AppData/Local/Temp/openpdf-theme-${colorScheme}-viewer.png` });
  await context.close();
}

await browser.close();
console.log("screenshots done");
