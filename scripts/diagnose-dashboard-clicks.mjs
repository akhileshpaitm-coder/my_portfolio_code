/**
 * Diagnostic: log in, load /dashboard, then determine why clicks don't work.
 * Uses puppeteer-core with the locally installed Chrome.
 */
import puppeteer from "puppeteer-core";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => {
      try { return require("fs").existsSync(p); } catch { return false; }
    }) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const consoleMsgs = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleMsgs.push(`${msg.type()}: ${msg.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (err) => consoleMsgs.push("PAGEERROR: " + String(err).slice(0, 500)));

  // 1. Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 60000 });
  await page.type("#email", "admin@akhileshprajapati.com");
  await page.type("#password", "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(2000);
  console.log("URL after login:", page.url());

  if (!page.url().includes("/dashboard")) {
    console.log("Login did not reach dashboard. Console:", consoleMsgs.slice(0, 5));
    await browser.close();
    process.exit(1);
  }

  // 2. Diagnostics on the dashboard
  const diag = await page.evaluate(() => {
    const out = {};

    // (a) hit-test: what element is on top at key click points?
    const pts = [
      ["profile-menu-btn", 0.94, 0.035],
      ["sidebar", 0.12, 0.35],
      ["content", 0.5, 0.6],
    ];
    out.hitTest = pts.map(([name, fx, fy]) => {
      const el = document.elementFromPoint(innerWidth * fx, innerHeight * fy);
      return {
        at: name,
        tag: el?.tagName ?? null,
        cls: el ? String(el.className).slice(0, 100) : null,
      };
    });

    // (b) find suspicious full-viewport layers
    out.layers = [];
    for (const el of document.querySelectorAll("body *")) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const coversViewport =
        r.width >= innerWidth * 0.97 && r.height >= innerHeight * 0.97;
      const intercepts =
        cs.pointerEvents !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity || "1") > 0.02;
      if ((cs.position === "fixed" || cs.position === "absolute") && coversViewport && intercepts) {
        out.layers.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 120),
          zIndex: cs.zIndex,
          pointerEvents: cs.pointerEvents,
          childCount: el.children.length,
        });
      }
    }
    out.layers = out.layers.slice(0, 10);

    // (c) what covers the profile button specifically?
    const btn = document.querySelector('button[aria-haspopup="menu"]');
    if (btn) {
      const r = btn.getBoundingClientRect();
      const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      out.profileBtn = {
        found: true,
        coveredByOther: topEl !== btn && !btn.contains(topEl),
        coverTag: topEl?.tagName ?? null,
        coverCls: topEl ? String(topEl.className).slice(0, 100) : null,
      };
    } else {
      out.profileBtn = { found: false };
    }

    // (d) body/html level blockers
    out.bodyOverflow = getComputedStyle(document.body).overflow;
    out.htmlOverflow = getComputedStyle(document.documentElement).overflow;
    out.bodyPointerEvents = getComputedStyle(document.body).pointerEvents;

    return out;
  });
  console.log(JSON.stringify(diag, null, 2));

  // 3. Functional click test 1: open the profile menu
  const menuOpened = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-haspopup="menu"]');
    if (!btn) return "no button found";
    btn.click();
    return new Promise((res) => setTimeout(() => res(!!document.querySelector('[role="menu"]')), 500));
  });
  console.log("Profile menu opened via .click():", menuOpened);

  // 4. Functional click test 2: real mouse click on a sidebar link
  const sidebarLink = await page.$('aside nav a[href="/dashboard/profile"]');
  if (sidebarLink) {
    await sidebarLink.click();
    await sleep(1500);
    console.log("After real mouse click on sidebar Profile link, URL:", page.url());
  } else {
    console.log("Sidebar Profile link not found");
  }

  // 5. Functional click test 3: real mouse click on the profile menu button
  const profileBtn = await page.$('button[aria-haspopup="menu"]');
  if (profileBtn) {
    await profileBtn.click();
    await sleep(500);
    const menuVisible = await page.evaluate(() => !!document.querySelector('[role="menu"]'));
    console.log("Profile menu opens via real mouse click:", menuVisible);
  }

  console.log("\nConsole errors/warnings captured:", consoleMsgs.length);
  consoleMsgs.slice(0, 10).forEach((m) => console.log("  ", m));

  await browser.close();
};

main().catch((e) => {
  console.error("SCRIPT ERROR:", e.message);
  process.exit(1);
});
