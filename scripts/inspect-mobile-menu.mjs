/**
 * Inspect mobile menu when open: position, size, stacking, visibility.
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
  await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle2", timeout: 90000 });

  await page.tap('button[aria-label="Open menu"]');
  await sleep(600);

  const info = await page.evaluate(() => {
    const panel = document.querySelector('nav [role="menu"]');
    if (!panel) return { found: false };

    const r = panel.getBoundingClientRect();
    const cs = getComputedStyle(panel);
    const nav = panel.closest("nav");
    const navZ = nav ? getComputedStyle(nav).zIndex : null;

    // Does the panel extend beyond the right edge of the screen?
    const offscreenRight = r.right > window.innerWidth + 1;
    const offscreenLeft = r.left < -1;

    // Overlap check: is anything covering the first menu link?
    const firstLink = panel.querySelector("a");
    const lr = firstLink.getBoundingClientRect();
    const topEl = document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2);

    return {
      found: true,
      rect: { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      offscreenRight, offscreenLeft,
      position: cs.position,
      zIndex: cs.zIndex,
      navZ,
      display: cs.display,
      firstLinkCovers: topEl !== firstLink && !firstLink.contains(topEl),
      topEl: topEl ? topEl.tagName + "." + String(topEl.className).split(" ").slice(0,2).join(".") : null,
      linkCount: panel.querySelectorAll("a").length,
      text: Array.from(panel.querySelectorAll("a")).map(a => a.textContent.trim()),
    };
  });

  console.log(JSON.stringify(info, null, 2));

  // Screenshot for reference
  await page.screenshot({ path: "scripts/mobile-menu.png" });
  console.log("screenshot: scripts/mobile-menu.png");

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
