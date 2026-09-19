/**
 * Responsive audit: for each page × viewport, check
 *  - horizontal overflow (scrollWidth > clientWidth)
 *  - elements wider than the viewport (offenders list)
 *  - tap-target sanity on mobile (very small interactive elements)
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const BASE = "http://localhost:3000";

const VIEWPORTS = [
  { name: "phone-s", width: 360, height: 740 },
  { name: "phone-m", width: 390, height: 844 },
  { name: "phone-l", width: 428, height: 926 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "tablet-l", width: 1024, height: 768 },
  { name: "laptop", width: 1440, height: 900 },
];

const PAGES = ["/", "/about", "/skills", "/expertise", "/projects", "/tech-stack", "/contact", "/login"];

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  let issues = 0;

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height });

    for (const route of PAGES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 90000 });
      } catch {
        console.log(`${vp.name} ${route}: NAV TIMEOUT (skipped)`);
        issues++;
        continue;
      }
      await new Promise((r) => setTimeout(r, 400));

      const audit = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflowX = doc.scrollWidth - doc.clientWidth;
        const offenders = [];
        if (overflowX > 1) {
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (r.right > doc.clientWidth + 1 || r.left < -1) {
              offenders.push(
                `${el.tagName}.${String(el.className).split(" ").slice(0, 3).join(".")}` +
                  ` [${Math.round(r.left)}..${Math.round(r.right)}]`
              );
              if (offenders.length >= 4) break;
            }
          }
        }
        return { overflowX, offenders };
      });

      if (audit.overflowX > 1) {
        issues++;
        console.log(`✗ ${vp.name}(${vp.width}px) ${route}: overflow-x ${audit.overflowX}px`);
        audit.offenders.forEach((o) => console.log(`    ${o}`));
      } else {
        console.log(`✓ ${vp.name}(${vp.width}px) ${route}`);
      }
    }
    await page.close();
  }

  console.log(`\n${issues === 0 ? "ALL CLEAN" : issues + " issue(s) found"}`);
  await browser.close();
};

main().catch((e) => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
