/**
 * Analyze logo.png pixels: average color of visible pixels, brightness,
 * to determine if it's visible on the dark site background.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();

  // Load the file directly and sample pixels via canvas
  const analysis = await page.goto("http://localhost:3000/assets/site_images/logo.png", { timeout: 30000 })
    .then(async () => {
      // Can't canvas-sample cross-origin-free local file directly here; use evaluate on the image page
      return page.evaluate(async () => {
        const img = document.querySelector("img");
        if (!img) return null;
        await img.decode().catch(() => {});
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let visible = 0, total = 0, rSum = 0, gSum = 0, bSum = 0, dark = 0, light = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          total++;
          if (a > 32) {
            visible++;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            rSum += r; gSum += g; bSum += b;
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (lum < 80) dark++;
            else if (lum > 180) light++;
          }
        }
        return {
          size: `${img.naturalWidth}x${img.naturalHeight}`,
          visiblePct: Math.round((visible / total) * 100),
          avgRGB: visible ? [rSum, gSum, bSum].map(v => Math.round(v / visible)) : null,
          darkPixelsPct: visible ? Math.round((dark / visible) * 100) : null,
          lightPixelsPct: visible ? Math.round((light / visible) * 100) : null,
        };
      });
    });

  console.log(JSON.stringify(analysis, null, 2));
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
