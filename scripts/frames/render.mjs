// Renders "The Anatomy of a Product" into WebP frames for the site.
//
//   node scripts/frames/render.mjs                         both sequences, all frames
//   node scripts/frames/render.mjs --seq portrait          one sequence
//   node scripts/frames/render.mjs --only 0,300,600 --out /tmp/preview
//
// The scene (scene.js) reads its timeline from app/_lib/chapters.js, so the
// frames always line up with the text panels. Needs three (dev dependency)
// and Playwright's Chromium; WebGL runs on SwiftShader, no GPU required.

import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { FRAME_COUNT, SEQUENCES } from "../../app/_lib/chapters.js";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, [])
);

const ROOT = resolve(import.meta.dirname, "../..");
const seqs = args.seq ? [args.seq] : Object.keys(SEQUENCES);
const frames = +args.frames || FRAME_COUNT;
const particles = +args.particles || 45000;
const quality = +args.q || 0.65;
const workers = +args.workers || 3;
const only = typeof args.only === "string" ? args.only.split(",").map(Number) : null;

const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };
const server = createServer(async (req, res) => {
  try {
    const path = join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!path.startsWith(ROOT)) throw new Error("outside root");
    const body = await readFile(path);
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const launch = { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] };
if (process.env.PLAYWRIGHT_BROWSERS_PATH === "/opt/pw-browsers") launch.executablePath = "/opt/pw-browsers/chromium";
const browser = await chromium.launch(launch);

for (const name of seqs) {
  const { width, height } = SEQUENCES[name];
  const outDir = args.out ? join(args.out, name) : join(ROOT, "public", SEQUENCES[name].dir);
  await mkdir(outDir, { recursive: true });
  const list = only || Array.from({ length: frames }, (_, i) => i);
  const queue = [...list];
  const started = Date.now();
  let done = 0;
  let bytes = 0;

  await Promise.all(
    Array.from({ length: Math.min(workers, list.length) }, async () => {
      const page = await browser.newPage({ viewport: { width, height } });
      page.on("pageerror", (e) => console.error("pageerror:", e.message));
      await page.goto(`${base}/scripts/frames/scene.html?w=${width}&h=${height}&frames=${frames}&particles=${particles}&q=${quality}`);
      await page.waitForFunction(() => window.sceneReady, null, { timeout: 120000 });
      while (queue.length) {
        const f = queue.shift();
        const url = await page.evaluate((f) => window.renderFrame(f), f);
        const buf = Buffer.from(url.split(",")[1], "base64");
        bytes += buf.length;
        await writeFile(join(outDir, `${String(f + 1).padStart(4, "0")}.webp`), buf);
        if (++done % 50 === 0 || done === list.length) {
          const s = (Date.now() - started) / 1000;
          console.log(`${name}: ${done}/${list.length}  ${(bytes / done / 1024).toFixed(1)} KB avg  ${(s / done).toFixed(2)} s/frame`);
        }
      }
      await page.close();
    })
  );
}

await browser.close();
server.close();
