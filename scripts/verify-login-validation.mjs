/**
 * Verify login client-side validation:
 * 1. empty submit → both field errors, no navigation
 * 2. bad email format → email error
 * 3. short password → password error
 * 4. valid input → navigates to /dashboard
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
  await page.setViewport({ width: 390, height: 844 });

  const getErrors = () =>
    page.evaluate(() => ({
      email: document.getElementById("email-error")?.textContent?.trim() ?? null,
      password: document.getElementById("password-error")?.textContent?.trim() ?? null,
    }));

  // React-safe field reset (native setter + input event so state updates)
  const clearAndType = async (sel, text) => {
    await page.evaluate((selector) => {
      const el = document.getElementById(selector.slice(1));
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(el, "");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, sel);
    await page.click(sel);
    await page.type(sel, text);
  };

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2", timeout: 90000 });

  // 1. Empty submit → blocked, both errors shown
  await page.click('button[type="submit"]');
  await sleep(600);
  let e = await getErrors();
  const stayedOnLogin = new URL(page.url()).pathname === "/login";
  console.log("1. Empty submit → blocked:", stayedOnLogin, "| email:", e.email, "| password:", e.password);

  // 2. Bad email format
  await page.type("#email", "not-an-email");
  await page.type("#password", "somepassword");
  await page.click('button[type="submit"]');
  await sleep(600);
  e = await getErrors();
  console.log("2. Bad email → blocked:", new URL(page.url()).pathname === "/login", "| email:", e.email);

  // 3. Short password (with valid email)
  await clearAndType("#email", "admin@akhileshprajapati.com");
  await clearAndType("#password", "abc");
  await page.click('button[type="submit"]');
  await sleep(600);
  e = await getErrors();
  console.log("3. Short password → blocked:", new URL(page.url()).pathname === "/login", "| password:", e.password);

  // 4. Valid credentials → navigates to dashboard
  await clearAndType("#password", "admin123");
  const btnState = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    return { text: btn.textContent.trim(), disabled: btn.disabled };
  });
  console.log("   button before click:", JSON.stringify(btnState));
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(2500);
  const err4 = await getErrors();
  const alertText = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent ?? null);
  console.log("4. Valid login →", page.url().includes("/dashboard") ? "OK /dashboard" : "FAIL " + page.url(), JSON.stringify({ err4, alertText }));

  await browser.close();
};

main().catch((err) => { console.error("SCRIPT ERROR:", err.message); process.exit(1); });
