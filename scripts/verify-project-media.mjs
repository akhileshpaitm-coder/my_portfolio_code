/**
 * E2E: admin adds a project WITH demo URL + uploaded screenshot + video URL,
 * verifies the public card shows screenshot + links, then deletes it.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 1×1 PNG for upload testing */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
const tmpPng = path.join(process.cwd(), "scripts", ".e2e-test-shot.png");
fs.writeFileSync(tmpPng, PNG);

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
  await sleep(1500);

  // New project form
  await page.goto(`${BASE}/dashboard/projects/new`, { waitUntil: "networkidle2", timeout: 90000 });
  await page.waitForSelector("#title", { timeout: 60000 });
  await page.type("#title", "E2E Media Project");
  await page.type("#description", "Automated verification of optional demo media fields.");
  await page.type("#features", "Feature A\nFeature B");
  await page.type("#tech", "React\nNode.js");

  // Demo URL
  await page.type("#demo_url", "https://example.com/demo");

  // Screenshot upload
  const shotInput = await page.$('input[type="file"][accept*="image"]');
  await shotInput.uploadFile(tmpPng);
  let uploaded = false;
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    uploaded = await page.evaluate(
      () => document.querySelector("#screenshot_url")?.value.includes("/uploads/projects/shots/") ?? false
    );
    if (uploaded) break;
  }
  console.log("Screenshot uploaded:", uploaded ? "OK" : "FAIL");

  // Video URL (not uploading a real video file — URL field is one of the two options)
  await page.type("#video_url", "https://youtube.com/watch?v=e2e-test");

  // Submit
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await sleep(1500);
  const backOnList = new URL(page.url()).pathname === "/dashboard/projects";
  const listed = await page.evaluate(() =>
    !!Array.from(document.querySelectorAll(".truncate")).find((el) => el.textContent.includes("E2E Media Project"))
  );
  console.log("Created → back on list:", backOnList, "| listed:", listed ? "OK" : "FAIL");

  // Admin list badges
  const badges = await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll(".rounded-2xl.border")).find((el) =>
      el.textContent.includes("E2E Media Project")
    );
    if (!row) return null;
    return {
      demo: row.textContent.includes("Demo URL"),
      shot: row.textContent.includes("Screenshot"),
      video: row.textContent.includes("Video"),
    };
  });
  console.log("List badges (Demo/Screenshot/Video):", JSON.stringify(badges));

  // Public page: screenshot img + Live Demo link + Watch video link
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle2", timeout: 90000 });
  const pub = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("section .grid > div")).find((el) =>
      el.textContent.includes("E2E Media Project")
    );
    if (!card) return null;
    const img = card.querySelector('img[alt*="screenshot"]');
    const links = Array.from(card.querySelectorAll("a")).map((a) => a.href);
    return {
      img: !!img && img.src.includes("/uploads/projects/shots/"),
      demo: links.includes("https://example.com/demo"),
      video: links.some((h) => h.includes("youtube.com")),
    };
  });
  console.log("Public card img/demo/video:", JSON.stringify(pub));

  // Cleanup: delete from admin
  await page.goto(`${BASE}/dashboard/projects`, { waitUntil: "networkidle2", timeout: 90000 });
  let deleted = false;
  for (const card of await page.$$(".rounded-2xl.border")) {
    const text = await card.evaluate((el) => el.textContent);
    if (text.includes("E2E Media Project")) {
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
  const stillThere = await page.evaluate(() => document.body.textContent.includes("E2E Media Project"));
  console.log("Deleted:", deleted, "| gone:", !stillThere ? "OK" : "FAIL");

  await browser.close();
  fs.unlinkSync(tmpPng);
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
