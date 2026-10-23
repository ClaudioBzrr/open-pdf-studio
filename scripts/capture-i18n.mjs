import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const out = join(tmpdir(), "openpdf-i18n");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "en-US", colorScheme: "light" });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:5173/app/", { waitUntil: "networkidle" });
await page.screenshot({ path: join(out, "welcome.png") });
await page.getByRole("button", { name: /Open sample PDF/ }).click();
await page.locator(".page-canvas").waitFor({ timeout: 30000 });
await page.waitForTimeout(1000);
const tabs = ["Annotate", "Pages", "Forms", "Edit", "Protect", "OCR", "Compare", "Privacy", "View"];
for (const tab of tabs) {
  await page.locator(`.rail-button[title="${tab}"]`).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(out, `${tab.toLowerCase()}.png`) });
}
console.log(JSON.stringify({ errors, lang: await page.locator("html").getAttribute("lang") }, null, 2));
await browser.close();
