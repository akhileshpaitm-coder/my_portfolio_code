/**
 * Verify: logo.png renders on homepage navbar, login page, dashboard sidebar.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const logoInfo = (page) =>
  page.evaluate(() => {
    const img = document.querySelector('img[src*="logo"], img[src*="site_images"]');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return {
      src: (img.currentSrc || img.src).split("/").slice(-2).join("/"),
      loaded: img.complete && img.naturalWidth > 0,
      rendered: `${Math.round(r.width)}x${Math.round(r.height)}`,
    };
  });

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  const failed = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(0, 100)}`);
  });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
  console.log("Homepage navbar/footer:", JSON.stringify(await logoInfo(page)));

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 30000 });
  console.log("Login page:", JSON.stringify(await logoInfo(page)));

  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  console.log("Dashboard sidebar:", JSON.stringify(await logoInfo(page)));

  console.log("Failed requests:", failed.length ? failed : "none");
  await browser.close();
};

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(1);
});
