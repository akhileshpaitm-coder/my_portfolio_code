/**
 * Deep test: dashboard navigation & clicks at desktop + mobile viewports.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const login = async (page) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  if (!page.url().includes("/dashboard")) throw new Error("login failed, at: " + page.url());
};

/** Click an element and poll until URL changes (up to 30s — dev compiles on demand). */
const clickAndAwaitNav = async (page, selector, expectedPath) => {
  await page.click(selector);
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    if (new URL(page.url()).pathname === expectedPath) return `OK (${(i + 1) * 0.5}s)`;
  }
  return `FAIL — still at ${page.url()}`;
};

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });

  // ─────────── DESKTOP ───────────
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + String(e).slice(0, 300)));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url().slice(0, 120)}`);
  });

  console.log("── DESKTOP (1440×900) ──");
  await login(page);
  console.log("Logged in:", page.url());

  console.log("Sidebar → Profile:", await clickAndAwaitNav(page, 'aside nav a[href="/dashboard/profile"]', "/dashboard/profile"));
  console.log("Sidebar → Settings:", await clickAndAwaitNav(page, 'aside nav a[href="/dashboard/settings"]', "/dashboard/settings"));
  console.log("Sidebar → Dashboard:", await clickAndAwaitNav(page, 'aside nav a[href="/dashboard"]', "/dashboard"));

  // Profile menu → View Profile
  await page.click('button[aria-haspopup="menu"]');
  await sleep(400);
  const menuVisible = await page.evaluate(() => !!document.querySelector('[role="menu"]'));
  console.log("Profile menu opens:", menuVisible);
  console.log("Profile menu → View Profile:", await clickAndAwaitNav(page, '[role="menu"] a[href="/dashboard/profile"]', "/dashboard/profile"));

  // Logout
  await page.click('button[aria-haspopup="menu"]');
  await sleep(400);
  console.log("Logout:", await clickAndAwaitNav(page, '[role="menu"] button[type="submit"]', "/login"));

  // ─────────── MOBILE ───────────
  console.log("\n── MOBILE (390×844) ──");
  const mob = await browser.newPage();
  await mob.setViewport({ width: 390, height: 844 });
  mob.on("pageerror", (e) => errors.push("MOB PAGEERROR: " + String(e).slice(0, 300)));
  await login(mob);

  // Sidebar should be off-canvas; hamburger visible
  const sidebarOffscreen = await mob.evaluate(() => {
    const aside = document.querySelector("aside");
    return aside.getBoundingClientRect().right <= 0;
  });
  console.log("Sidebar hidden on mobile:", sidebarOffscreen);

  // Open drawer via hamburger
  await mob.click('button[aria-label="Open sidebar"]');
  await sleep(600);
  const drawerOpen = await mob.evaluate(() => {
    const aside = document.querySelector("aside");
    const r = aside.getBoundingClientRect();
    return r.left === 0 && getComputedStyle(aside).transform !== "none";
  });
  console.log("Drawer opens via hamburger:", drawerOpen);

  // Tap a link in the drawer
  console.log("Drawer → Profile:", await clickAndAwaitNav(mob, 'aside nav a[href="/dashboard/profile"]', "/dashboard/profile"));

  console.log("\nErrors captured:", errors.length);
  errors.slice(0, 10).forEach((e) => console.log("  ", e));

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
