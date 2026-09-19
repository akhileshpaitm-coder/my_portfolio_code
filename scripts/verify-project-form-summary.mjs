/**
 * Verify project form: empty submit → red rings on required fields,
 * summary listing them, focus jumps to first invalid field.
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

  await page.goto(`${BASE}/dashboard/projects/new`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("#title", { timeout: 60000 });

  // 1. Clear icon (it has a default) so we can test empty required fields
  await page.evaluate(() => {
    const el = document.getElementById("icon");
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });

  // 2. Submit empty form
  await page.click('button[type="submit"]');
  await sleep(800);

  const result = await page.evaluate(() => {
    const invalidIds = ["title", "description", "icon", "color", "sort-order", "features", "tech"]
      .filter((id) => {
        const el = document.getElementById(id);
        return el && el.getAttribute("aria-invalid") === "true";
      });
    const redBorder = (id) => {
      const el = document.getElementById(id);
      return el ? el.className.includes("border-red-500") : false;
    };
    const summary = document.querySelector('[role="alert"] ul');
    const summaryItems = summary ? Array.from(summary.querySelectorAll("li")).map((li) => li.textContent.trim().split(":")[0]) : [];
    const focused = document.activeElement?.id ?? null;
    const stillOnForm = !!document.getElementById("title");
    return { invalidIds, redBorder: redBorder("title"), summaryItems, focused, stillOnForm };
  });

  console.log("Still on form (submit blocked):", result.stillOnForm);
  console.log("Fields marked invalid:", result.invalidIds.join(", "));
  console.log("Title has red border:", result.redBorder);
  console.log("Summary lists:", result.summaryItems.join(", "));
  console.log("Focus moved to first invalid:", result.focused);

  // 3. Fill fields and confirm summary disappears
  await page.type("#title", "Summary Check Project");
  await page.type("#description", "This description is long enough to pass validation.");
  await page.click('button[type="submit"]');
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (new URL(page.url()).pathname === "/dashboard/projects") break;
  }
  console.log("Valid submit navigates:", new URL(page.url()).pathname === "/dashboard/projects" ? "OK" : "FAIL " + page.url());

  // cleanup: delete the test project
  await page.goto(`${BASE}/dashboard/projects`, { waitUntil: "networkidle2", timeout: 90000 });
  for (const card of await page.$$(".rounded-2xl.border")) {
    const text = await card.evaluate((el) => el.textContent);
    if (text.includes("Summary Check Project")) {
      const btn = await card.$('button[type="submit"]');
      if (btn) { await btn.click(); break; }
    }
  }
  await sleep(2000);
  console.log("Cleanup done");

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
