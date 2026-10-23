import { chromium } from "playwright-core";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://127.0.0.1:5173/app/", { waitUntil: "networkidle" });
const metrics = await page.evaluate(() => {
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width };
  };
  return {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    hero: rect(".hero"),
    title: rect(".hero h1"),
    dropzone: rect(".dropzone"),
    topbar: rect(".topbar"),
    topbarActions: rect(".topbar-actions"),
    welcome: rect(".welcome"),
    featureGrid: rect(".feature-grid"),
  };
});
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
