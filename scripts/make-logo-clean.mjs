/**
 * Build logo-clean.png from the ORIGINAL logo:
 * 1. Strip the baked dark-navy fill (→ real transparency, no box on any bg)
 * 2. Keep gradient artwork (name + icon) untouched
 * 3. Brighten the dim tagline so it reads on dark backgrounds
 * 4. Crop transparent margins
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const OUT = "public/assets/site_images/logo-clean.png";

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

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

    const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
    let removed = 0, edges = 0, boosted = 0;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const L = lum(r, g, b);
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);

      if (L < 60 && chroma < 60) {
        // Baked dark-navy fill → fully transparent
        d[i + 3] = 0;
        removed++;
      } else if (L < 110 && chroma < 70) {
        // Anti-aliased edge of the old box → mostly transparent (prevents halo)
        d[i + 3] = Math.round(d[i + 3] * 0.35);
        edges++;
      } else if (L < 150 && chroma < 110) {
        // Dim tagline text → brighten to a readable slate
        const f = 2.1;
        d[i] = Math.min(255, Math.round(r * f + 40));
        d[i + 1] = Math.min(255, Math.round(g * f + 40));
        d[i + 2] = Math.min(255, Math.round(b * f + 55));
        boosted++;
      }
    }
    ctx.putImageData(new ImageData(d, W, H), 0, 0);

    // Crop to content bbox (alpha > 8) with padding
    let minX = W, minY = H, maxX = 0, maxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const pad = 12;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(W - 1, maxX + pad);
    maxY = Math.min(H - 1, maxY + pad);
    const cw = maxX - minX + 1, ch = maxY - minY + 1;

    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d").drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);

    return {
      url: out.toDataURL("image/png"),
      removed, edges, boosted,
      crop: { from: `${W}x${H}`, to: `${cw}x${ch}` },
    };
  });

  fs.writeFileSync(OUT, Buffer.from(result.url.split(",")[1], "base64"));
  console.log(
    `Wrote ${OUT}\n  crop: ${result.crop.from} → ${result.crop.to}\n  removed(transparent): ${result.remapped ?? result.removed}px, edge-faded: ${result.edges}px, tagline-brightened: ${result.boosted}px`
  );
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
