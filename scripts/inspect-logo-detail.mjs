/**
 * Detailed logo inspection: sample a grid of pixel colors to map the design.
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
  await page.goto("http://localhost:3000/assets/site_images/logo.png", { timeout: 30000 });

  const detail = await page.evaluate(async () => {
    const img = document.querySelector("img");
    await img.decode().catch(() => {});
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const W = canvas.width, H = canvas.height;

    // Sample a coarse grid: for each cell report dominant visible color
    const cols = 12, rows = 4;
    const grid = [];
    for (let gy = 0; gy < rows; gy++) {
      const row = [];
      for (let gx = 0; gx < cols; gx++) {
        const x0 = Math.floor((gx * W) / cols), x1 = Math.floor(((gx + 1) * W) / cols);
        const y0 = Math.floor((gy * H) / rows), y1 = Math.floor(((gy + 1) * H) / rows);
        let r = 0, g = 0, b = 0, n = 0;
        for (let y = y0; y < y1; y += 4) {
          for (let x = x0; x < x1; x += 4) {
            const i = (y * W + x) * 4;
            if (d[i + 3] > 60) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
          }
        }
        row.push(n > 20 ? `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})` : "·");
      }
      grid.push(row.join(" | "));
    }

    // Brightest pixel overall
    let best = 0, bestRGB = null;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 60) {
        const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        if (lum > best) { best = lum; bestRGB = [d[i], d[i + 1], d[i + 2]]; }
      }
    }
    return { grid: grid, brightestPixel: { lum: Math.round(best), rgb: bestRGB } };
  });

  console.log(detail.grid.join("\n"));
  console.log("Brightest pixel:", JSON.stringify(detail.brightestPixel));
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
