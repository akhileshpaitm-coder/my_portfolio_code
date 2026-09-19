/**
 * Verify icon+text logo: presence, loaded image, text color (gradient applied).
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
  const failed = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(0, 100)}`);
  });

  const check = () =>
    page.evaluate(() => {
      const img = document.querySelector('img[src*="logo-icon"]');
      const span = img?.parentElement?.querySelector("span");
      const imgOK = img && img.complete && img.naturalWidth > 0;
      const r = img ? img.getBoundingClientRect() : null;
      const color = span ? getComputedStyle(span).color : null;
      const fill = span ? getComputedStyle(span).webkitTextFillColor : null;
      return {
        iconLoaded: !!imgOK,
        iconSize: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : null,
        text: span?.textContent ?? null,
        textFill: fill, // transparent means gradient-text applied
        color,
      };
    });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 90000 });
  console.log("Homepage navbar:", JSON.stringify(await check()));

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  console.log("Login page:", JSON.stringify(await check()));

  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  console.log("Dashboard sidebar:", JSON.stringify(await check()));

  // Footer (homepage again)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(800);
  const footers = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img[src*="logo-icon"]'));
    return imgs.map((img) => {
      const span = img.parentElement.querySelector("span");
      return {
        loaded: img.complete && img.naturalWidth > 0,
        size: Math.round(img.getBoundingClientRect().height),
        text: span?.textContent?.slice(0, 20) ?? null,
      };
    });
  });
  console.log("Homepage (navbar+footer):", JSON.stringify(footers));

  console.log("Failed requests:", failed.length ? failed : "none");
  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
