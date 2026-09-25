// Renders the Facebook reel (MP4, 1080x1920, 30 fps) and feed post
// (1080x1350) from frames captured by capture.mjs.
//   python3 scripts/marketing/music.py /tmp/reel/score.wav
//   node scripts/marketing/render.mjs --cap /tmp/reel/cap --fonts /tmp/reel/fonts --out /tmp/reel/out --audio /tmp/reel/score.wav
// Needs ffmpeg on PATH or FFMPEG=/path/to/ffmpeg.

import { createServer } from "node:http";
import { mkdir, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, [])
);
const HERE = import.meta.dirname;
const ROOT = resolve(HERE, "../..");
const CAP = resolve(args.cap || "/tmp/reel/cap");
const FONTS = resolve(args.fonts || "/tmp/reel/fonts");
const OUT = resolve(args.out || "/tmp/reel/out");
const FFMPEG = process.env.FFMPEG || "ffmpeg";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const route = (p) => {
  if (p.startsWith("/cap/")) return join(CAP, p.slice(5));
  if (p.startsWith("/fonts/")) return join(FONTS, p.slice(7));
  if (p === "/logo.svg") return join(ROOT, "public/assets/img/kodexa.svg");
  return join(HERE, p);
};
const server = createServer(async (req, res) => {
  try {
    const path = route(decodeURIComponent(new URL(req.url, "http://x").pathname));
    const body = await readFile(path);
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const launch = {};
if (process.env.PLAYWRIGHT_BROWSERS_PATH === "/opt/pw-browsers") launch.executablePath = "/opt/pw-browsers/chromium";
const browser = await chromium.launch(launch);
await mkdir(OUT, { recursive: true });

// Feed post
if (!args["reel-only"]) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(`${base}/stage.html?mode=post`);
  await page.waitForFunction(() => window.stageReady);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, "kodexa-tailor-post.png"), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  await page.screenshot({ path: join(OUT, "kodexa-tailor-post.jpg"), type: "jpeg", quality: 94, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  await page.close();
  console.log("post: done");
}

// Reel
if (!args["post-only"]) {
  const frames = join(OUT, "reel-frames");
  await rm(frames, { recursive: true, force: true });
  await mkdir(frames, { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`${base}/stage.html?mode=reel`);
  await page.waitForFunction(() => window.stageReady);
  const total = await page.evaluate(() => window.frameCount);
  const only = typeof args.only === "string" ? args.only.split(",").map(Number) : null;
  for (const n of only || Array.from({ length: total }, (_, i) => i)) {
    await page.evaluate((n) => window.setFrame(n), n);
    await page.screenshot({ path: join(frames, `${String(n).padStart(4, "0")}.jpg`), type: "jpeg", quality: 95 });
    if (n % 100 === 0) console.log(`reel: ${n}/${total}`);
  }
  await page.close();
  if (!only) {
    const r = spawnSync(FFMPEG, ["-y", "-loglevel", "error", "-framerate", "30", "-i", join(frames, "%04d.jpg"),
      ...(args.audio ? ["-i", resolve(args.audio)] : ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000"]), "-shortest",
      "-c:v", "libx264", "-profile:v", "high", "-crf", "18", "-preset", "slow", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", join(OUT, "kodexa-tailor-reel.mp4")], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("ffmpeg failed");
    console.log("reel: done");
  }
}

await browser.close();
server.close();
