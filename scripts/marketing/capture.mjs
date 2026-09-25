// Records the site scrolling, frame by frame, for the social reel and post.
//   node scripts/marketing/capture.mjs --base http://localhost:3100 --out /tmp/reel/cap
// Writes <out>/desktop/NNNN.jpg (1440x900) and <out>/phone/NNNN.jpg (390x844 @2x),
// plus hero and outro stills for each device.

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]]);
    return acc;
  }, [])
);
const BASE = args.base || "http://localhost:3000";
const OUT = args.out || "/tmp/reel/cap";

const DEVICES = [
  { name: "desktop", viewport: { width: 1440, height: 900 }, scale: 1, frames: 240 },
  { name: "phone", viewport: { width: 390, height: 844 }, scale: 2, frames: 240, mobile: true },
];

const FRAME_MS = 1000 / 30;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const launch = {};
if (process.env.PLAYWRIGHT_BROWSERS_PATH === "/opt/pw-browsers") launch.executablePath = "/opt/pw-browsers/chromium";
const browser = await chromium.launch(launch);

for (const d of DEVICES) {
  const dir = join(OUT, d.name);
  await mkdir(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.scale, isMobile: !!d.mobile, hasTouch: !!d.mobile });
  const page = await ctx.newPage();
  // Page time only moves when we advance it, exactly one video frame per
  // step, so GSAP's scrubbed easing is identical from frame to frame (a
  // real-time capture stutters because screenshots take uneven time).
  await page.clock.install();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.getElementById("loader")?.classList.contains("is-done"), null, { timeout: 120000 });
  await page.clock.runFor(1500);
  await page.waitForTimeout(1200); // the loader's CSS fade runs on real time
  const shot = (file) => page.screenshot({ path: join(OUT, file), type: "jpeg", quality: 92 });
  await shot(`${d.name}-hero.jpg`);

  const g = await page.evaluate(() => {
    const s = document.getElementById("scene");
    return { top: s.offsetTop, range: s.offsetHeight - innerHeight };
  });
  // a gentle lead-in so the first frames show the hero title
  for (let f = 0; f < d.frames; f++) {
    const t = ease(f / (d.frames - 1));
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(g.top + t * g.range * 0.995));
    await page.clock.runFor(FRAME_MS);
    await shot(join(d.name, `${String(f).padStart(4, "0")}.jpg`));
  }
  await page.evaluate(() => window.scrollTo(0, document.getElementById("book").offsetTop - 40));
  await page.clock.runFor(1500);
  await page.waitForTimeout(600);
  await shot(`${d.name}-outro.jpg`);
  console.log(`${d.name}: ${d.frames} frames`);
  await ctx.close();
}
await browser.close();
