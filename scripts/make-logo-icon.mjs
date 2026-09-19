/**
 * Crop the icon (left portion) from the ORIGINAL logo → logo-icon.png.
 * Scans the content bbox of the left 30% of the image (the icon glyph),
 * adds padding, and writes a tightly-cropped transparent PNG.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const OUT = "public/assets/site_images/logo-icon.png";

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/assets/site_images/logo.png", { timeout: 30000 });

  const result = await page.evaluate(async () => {
    const img = document.querySelector("img");
    await img.decode().catch(() => {});
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const W = c.width, H = c.height;

    // bbox of visible pixels within the left 30% (the icon)
    const xLimit = Math.floor(W * 0.3);
    let minX = W, minY = H, maxX = 0, maxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < xLimit; x++) {
        if (d[(y * W + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(W - 1, maxX + pad);
    maxY = Math.min(H - 1, maxY + pad);
    const cw = maxX - minX + 1, ch = maxY - minY + 1;

    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d").drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
    return { url: out.toDataURL("image/png"), from: `${W}x${H}`, size: `${cw}x${ch}` };
  });

  fs.writeFileSync(OUT, Buffer.from(result.url.split(",")[1], "base64"));
  console.log(`Wrote ${OUT} — icon cropped at ${result.size} (from ${result.from})`);
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
