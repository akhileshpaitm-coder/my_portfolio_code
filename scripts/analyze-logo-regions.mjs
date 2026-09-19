/**
 * Row-band analysis of the ORIGINAL logo: find the baked dark background /
 * tagline strip, and what color the tagline text is.
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

  const report = await page.evaluate(async () => {
    const img = document.querySelector("img");
    await img.decode().catch(() => {});
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const W = c.width, H = c.height;

    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Per 5%-height band over the right 65% (name + tagline area):
    const bands = [];
    for (let band = 0; band < 20; band++) {
      const y0 = Math.floor((band * H) / 20), y1 = Math.floor(((band + 1) * H) / 20);
      let opaque = 0, darkNavy = 0, bright = 0, mid = 0;
      let br = 0, bg = 0, bb = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = Math.floor(W * 0.35); x < W; x += 2) {
          const i = (y * W + x) * 4;
          if (d[i + 3] < 32) continue;
          opaque++;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const L = lum(r, g, b);
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          if (L < 60 && chroma < 60) darkNavy++;
          else if (L > 140) { bright++; br += r; bg += g; bb += b; }
          else mid++;
        }
      }
      bands.push({
        band: `${Math.round((band / 20) * 100)}%`,
        opaque,
        darkNavyPct: opaque ? Math.round((darkNavy / opaque) * 100) : 0,
        midPct: opaque ? Math.round((mid / opaque) * 100) : 0,
        brightPct: opaque ? Math.round((bright / opaque) * 100) : 0,
        brightAvgRGB: bright > 30 ? [br, bg, bb].map((v) => Math.round(v / bright)) : null,
      });
    }
    return bands;
  });

  console.table ? console.table(report) : console.log(JSON.stringify(report, null, 1));
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
