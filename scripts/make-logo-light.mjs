/**
 * Generate logo-light.png: remap near-black navy letterforms to a light
 * color so the logo is visible on the dark site background. Gradient
 * accents (max channel >= 70) are preserved as-is.
 */
import puppeteer from "puppeteer-core";
import fs from "fs";

const CHROME_PATHS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
];
const SRC = "public/assets/site_images/logo.png";
const OUT = "public/assets/site_images/logo-light.png";

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATHS.find((p) => fs.existsSync(p)) ?? CHROME_PATHS[0],
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();

  const b64 = await page
    .goto("http://localhost:3000/assets/site_images/logo.png", { timeout: 30000 })
    .then(() =>
      page.evaluate(async () => {
        const img = document.querySelector("img");
        await img.decode().catch(() => {});
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let remapped = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] === 0) continue;
          const r = d[i], g = d[i + 1], b = d[i + 2];
          // Near-black navy letterforms: very low max channel → invert to light
          if (Math.max(r, g, b) < 70) {
            d[i] = 255 - r;
            d[i + 1] = 255 - g;
            d[i + 2] = 255 - b;
            remapped++;
          }
        }
        ctx.putImageData(new ImageData(d, canvas.width, canvas.height), 0, 0);
        const url = canvas.toDataURL("image/png");
        return { url, remapped, total: d.length / 4 };
      })
    );

  fs.writeFileSync(OUT, Buffer.from(b64.url.split(",")[1], "base64"));
  console.log(`Wrote ${OUT} — remapped ${b64.remapped}/${b64.total} px (${Math.round((b64.remapped / b64.total) * 100)}%)`);
  await browser.close();
};

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
