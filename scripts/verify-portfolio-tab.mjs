/**
 * Verify: dashboard "View Portfolio" opens in a new tab.
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
  await sleep(1200);

  const attrs = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll("aside nav a")).find((x) =>
      x.textContent.includes("View Portfolio")
    );
    return a ? { target: a.target, rel: a.rel, href: a.href } : null;
  });
  console.log("Link attrs:", JSON.stringify(attrs));

  const pagesBefore = (await browser.pages()).length;
  await page.click('aside nav a[href="/"]');
  await sleep(2000);
  const pagesAfter = (await browser.pages()).length;
  const newTab = pagesAfter > pagesBefore;
  const originalStillDashboard = new URL(page.url()).pathname === "/dashboard";
  console.log(
    `Click → new tab opened: ${newTab} (pages ${pagesBefore} → ${pagesAfter}), dashboard still open: ${originalStillDashboard}`
  );

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
