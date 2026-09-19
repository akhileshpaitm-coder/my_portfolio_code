/**
 * Verify: icons from /assets/icon render in sidebar, header menu, quick links.
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
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });

  // Direct asset check
  for (const name of ["dashboard", "profile", "settings"]) {
    const res = await page.goto(`${BASE}/assets/icon/${name}.png`, { timeout: 30000 });
    console.log(`GET /assets/icon/${name}.png →`, res.status());
  }

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);

  const icons = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img")).map((img) => ({
      src: (img.currentSrc || img.src).split("/").slice(-2).join("/"),
      loaded: img.complete && img.naturalWidth > 0,
      w: Math.round(img.getBoundingClientRect().width),
    }))
  );
  console.log("\nImages on /dashboard:", JSON.stringify(icons, null, 1));

  const menuIcons = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-haspopup="menu"]');
    btn?.click();
    return new Promise((res) =>
      setTimeout(() => {
        const imgs = Array.from(document.querySelectorAll('[role="menu"] img')).map((img) => ({
          src: (img.currentSrc || img.src).split("/").slice(-2).join("/"),
          loaded: img.complete && img.naturalWidth > 0,
        }));
        res(imgs);
      }, 400)
    );
  });
  console.log("Icons in profile menu:", JSON.stringify(menuIcons));

  console.log("\nFailed requests:", failed.length ? failed : "none");
  await browser.close();
};

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(1);
});
