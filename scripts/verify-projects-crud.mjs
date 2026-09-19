/**
 * E2E: admin adds a project → appears on /projects; deletes it → disappears.
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

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1200);

  // 1. Sidebar has Projects item
  const hasProjectsNav = await page.evaluate(() =>
    !!Array.from(document.querySelectorAll("aside nav a")).find((a) =>
      a.textContent.includes("Projects")
    )
  );
  console.log("Sidebar Projects item:", hasProjectsNav ? "OK" : "FAIL");

  // 2. Go to manage projects
  await page.click('aside nav a[href="/dashboard/projects"]');
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    if (new URL(page.url()).pathname === "/dashboard/projects") break;
  }
  const listCount = await page.evaluate(() =>
    document.querySelectorAll("form button").length
  );
  console.log("Manage page loaded, delete buttons on list:", listCount);

  // 3. Add a new project
  await page.click('a[href="/dashboard/projects/new"]');
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    if (new URL(page.url()).pathname === "/dashboard/projects/new") break;
  }
  // wait for the form to actually render (dev compile can be slow)
  await page.waitForSelector("#title", { timeout: 60000 });
  await page.type("#title", "E2E Test Project");
  await page.type("#description", "Created by automated verification — should be deleted afterwards.");
  // features + tech textareas
  await page.type("#features", "Test feature one\nTest feature two");
  await page.type("#tech", "React\nNode.js");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  const backOnList = new URL(page.url()).pathname === "/dashboard/projects";
  const created = await page.evaluate(() =>
    !!Array.from(document.querySelectorAll(".truncate")).find((el) =>
      el.textContent.includes("E2E Test Project")
    )
  );
  console.log("Create → back on list:", backOnList, "| new project listed:", created);

  // 4. Public /projects shows it
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle2", timeout: 90000 });
  const publicHasIt = await page.evaluate(() =>
    document.body.textContent.includes("E2E Test Project")
  );
  console.log("Public /projects shows new project:", publicHasIt ? "OK" : "FAIL");

  // 5. Delete it from admin
  await page.goto(`${BASE}/dashboard/projects`, { waitUntil: "networkidle2", timeout: 90000 });
  // find the row containing E2E Test Project and click its delete button
  let deleted = false;
  for (const card of await page.$$(".rounded-2xl.border")) {
    const text = await card.evaluate((el) => el.textContent);
    if (text.includes("E2E Test Project")) {
      const btn = await card.$('button[type="submit"]');
      if (btn) {
        await btn.click();
        deleted = true;
        break;
      }
    }
  }
  await sleep(2500);
  await page.reload({ waitUntil: "networkidle2", timeout: 60000 });
  const stillThere = await page.evaluate(() =>
    document.body.textContent.includes("E2E Test Project")
  );
  console.log("Delete clicked:", deleted, "| gone after reload:", !stillThere ? "OK" : "FAIL");

  // 6. Public page no longer shows it
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle2", timeout: 90000 });
  const publicStillHasIt = await page.evaluate(() =>
    document.body.textContent.includes("E2E Test Project")
  );
  console.log("Public /projects cleaned:", !publicStillHasIt ? "OK" : "FAIL");

  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
