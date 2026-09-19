/**
 * Verify profile menu dropdown: white SVG icons, correct labels, menu works.
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

  await page.click('button[aria-haspopup="menu"]');
  await sleep(500);

  const items = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="menu"] [role="menuitem"]')).map((el) => {
      const svg = el.querySelector("svg");
      const cs = svg ? getComputedStyle(svg) : null;
      return {
        label: el.textContent.trim(),
        isSvg: !!svg,
        stroke: cs?.stroke ?? null,
      };
    })
  );
  console.log(JSON.stringify(items, null, 1));

  const noPngLeft = await page.evaluate(
    () => document.querySelectorAll('[role="menu"] img').length === 0
  );
  console.log("No PNG images left in menu:", noPngLeft);

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
