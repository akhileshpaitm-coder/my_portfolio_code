/**
 * Inspect sidebar logo geometry: is the icon clipped / not fully visible?
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);

  const info = await page.evaluate(() => {
    const img = document.querySelector("aside img");
    if (!img) return { found: false };
    const link = img.closest("a");
    const row = link.parentElement;
    const aside = document.querySelector("aside");
    const ir = img.getBoundingClientRect();
    const lr = link.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    const ar = aside.getBoundingClientRect();
    return {
      found: true,
      natural: `${img.naturalWidth}x${img.naturalHeight}`,
      displayed: `${Math.round(ir.width)}x${Math.round(ir.height)}`,
      imgLeft: Math.round(ir.left),
      imgRight: Math.round(ir.right),
      linkWidth: Math.round(lr.width),
      rowLeft: Math.round(rr.left),
      rowRight: Math.round(rr.right),
      asideWidth: Math.round(ar.width),
      asidePadding: getComputedStyle(row).padding,
      imgOverflowsRow: ir.right > rr.right + 1,
      gapToCloseBtn: Math.round(rr.right - ir.right),
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: "scripts/sidebar-logo.png" });
  console.log("screenshot: scripts/sidebar-logo.png");
  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
