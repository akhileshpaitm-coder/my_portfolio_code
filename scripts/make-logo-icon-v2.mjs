/**
 * logo-icon.png v2 — crop the icon glyph at the natural whitespace gap
 * between the icon and the wordmark (no more mid-letter cut-off).
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

    // Per-column opaque pixel count
    const colCount = new Array(W).fill(0);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (d[(y * W + x) * 4 + 3] > 24) colCount[x]++;
      }
    }

    // Find whitespace runs (columns with ~no content) between x=120..1100
    const runs = [];
    let start = -1;
    for (let x = 120; x < Math.min(W, 1100); x++) {
      const empty = colCount[x] <= 2;
      if (empty && start === -1) start = x;
      if ((!empty || x === Math.min(W, 1100) - 1) && start !== -1) {
        runs.push({ from: start, to: x - 1, width: x - start });
        start = -1;
      }
    }
    runs.sort((a, b) => b.width - a.width);
    const gap = runs[0] && runs[0].width >= 20 ? runs[0] : { from: Math.floor(W * 0.28), to: Math.floor(W * 0.28) };

    // bbox of icon region (x < gap.from)
    let minX = W, minY = H, maxX = 0, maxY = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < gap.from; x++) {
        if (d[(y * W + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(gap.from - 1, maxX + pad);
    maxY = Math.min(H - 1, maxY + pad);
    const cw = maxX - minX + 1, ch = maxY - minY + 1;

    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d").drawImage(c, minX, minY, cw, ch, 0, 0, cw, ch);
    return {
      url: out.toDataURL("image/png"),
      gap: { from: gap.from, width: gap.width },
      allRuns: runs.slice(0, 4),
      iconSize: `${cw}x${ch}`,
      rightMarginContent: gap.from - 1 - maxX,
    };
  });

  fs.writeFileSync(OUT, Buffer.from(result.url.split(",")[1], "base64"));
  console.log(
    `Wrote ${OUT}\n  icon: ${result.iconSize} | gap at x=${result.gap.from} (width ${result.gap.width}px)\n  top gaps: ${JSON.stringify(result.allRuns)}\n  padding to cut: ${result.rightMarginContent}px`
  );
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
