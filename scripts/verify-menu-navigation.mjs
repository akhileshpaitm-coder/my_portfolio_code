/**
 * Verify: navbar menu opens dedicated pages (desktop) and hamburger menu
 * works (mobile) on homepage + subpages.
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

  // ─── Desktop ───
  const page = await browser.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 90000 });

  const navTest = async (label, expected) => {
    await page.click(`nav a[href="${expected}"]`);
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      if (new URL(page.url()).pathname === expected) {
        console.log(`Desktop ${label}: OK → ${expected}`);
        return true;
      }
    }
    console.log(`Desktop ${label}: FAIL — still at ${page.url()}`);
    return false;
  };

  await navTest("About", "/about");
  await navTest("Skills", "/skills");
  await navTest("Expertise", "/expertise");
  await navTest("Projects", "/projects");
  await navTest("Tech Stack", "/tech-stack");
  await navTest("Contact", "/contact");
  // Back home via logo
  await page.click('nav a[href="/"]');
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    if (new URL(page.url()).pathname === "/") break;
  }
  console.log("Logo → home:", new URL(page.url()).pathname === "/" ? "OK" : "FAIL");

  // ─── Mobile ───
  const mob = await browser.newPage();
  await mob.setViewport({ width: 390, height: 844 });
  await mob.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 });

  const hasHamburger = await mob.$('button[aria-label="Open menu"]');
  console.log("\nMobile hamburger visible:", !!hasHamburger);

  await mob.click('button[aria-label="Open menu"]');
  await sleep(500);
  const menuOpen = await mob.evaluate(() => !!document.querySelector('nav [role="menu"] a[href="/about"]'));
  console.log("Mobile menu opens:", menuOpen);

  await mob.click('nav [role="menu"] a[href="/projects"]');
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    if (new URL(mob.url()).pathname === "/projects") break;
  }
  console.log("Mobile menu → Projects:", new URL(mob.url()).pathname === "/projects" ? "OK" : "FAIL — " + mob.url());

  // Menu closed after navigation?
  await mob.click('button[aria-label="Open menu"]').catch(() => {});
  await sleep(400);
  const menuState = await mob.evaluate(() => !!document.querySelector('nav [role="menu"] a[href="/about"]'));
  console.log("Menu toggle works on subpage:", menuState ? "opens" : "check");

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
