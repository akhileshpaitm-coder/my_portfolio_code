/**
 * Verify sidebar SVG icons: white stroke color, correct size, navigation intact.
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

  const icons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("aside nav a")).map((a) => {
      const svg = a.querySelector("svg");
      if (!svg) return { label: a.textContent.trim(), svg: false };
      const cs = getComputedStyle(svg);
      const r = svg.getBoundingClientRect();
      return {
        label: a.textContent.trim(),
        svg: true,
        stroke: cs.stroke,
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        color: cs.color,
      };
    });
  });
  console.log(JSON.stringify(icons, null, 1));

  // Navigation still works
  await page.click('aside nav a[href="/dashboard/profile"]');
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    if (new URL(page.url()).pathname === "/dashboard/profile") break;
  }
  console.log("Nav to profile:", new URL(page.url()).pathname === "/dashboard/profile" ? "OK" : "FAIL");

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
