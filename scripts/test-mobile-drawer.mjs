/**
 * Instrumented mobile drawer test — checks open/close mechanics in detail.
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
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  console.log("Logged in:", page.url());

  const drawerState = () =>
    page.evaluate(() => {
      const aside = document.querySelector("aside");
      if (!aside) return { error: "no aside" };
      const r = aside.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        transform: getComputedStyle(aside).transform.slice(0, 60),
        width: Math.round(r.width),
      };
    });

  console.log("Before:", JSON.stringify(await drawerState()));

  // Real tap on hamburger
  await page.tap('button[aria-label="Open sidebar"]');
  await sleep(800);
  console.log("After tap on hamburger:", JSON.stringify(await drawerState()));

  // Is overlay present?
  const overlay = await page.evaluate(() => {
    const el = document.querySelector(".bg-black\\/60");
    return el ? { tag: el.tagName, rect: el.getBoundingClientRect().width } : null;
  });
  console.log("Overlay element:", JSON.stringify(overlay));

  // Tap sidebar link
  const navResult = await (async () => {
    await page.tap('aside nav a[href="/dashboard/profile"]');
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      if (new URL(page.url()).pathname === "/dashboard/profile") return `OK (${(i + 1) * 0.5}s)`;
    }
    return "FAIL";
  })();
  console.log("Drawer link tap →", navResult);

  // After navigation, drawer should be closed (React remounts, state resets)
  console.log("After nav:", JSON.stringify(await drawerState()));

  // Reopen drawer and close via overlay tap
  await page.tap('button[aria-label="Open sidebar"]');
  await sleep(600);
  console.log("Reopened:", JSON.stringify(await drawerState()));
  await page.mouse.click(360, 400); // right side = overlay area
  await sleep(600);
  console.log("After overlay tap:", JSON.stringify(await drawerState()));

  await browser.close();
};

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(1);
});
