// The story stays in sync: at the middle of every chapter's hold window the
// right panel (and only it) is visible, the canvas is painted with frames,
// the frame counter matches progress and the rail marks the chapter.
// Timings come from app/_lib/chapters.js, the same file the frames use.

import { CHAPTERS, FRAME_COUNT } from "../../app/_lib/chapters.js";

const VIEWS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
];

export default async function scrollScene({ base, browser, ok }) {
  for (const v of VIEWS) {
    const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, isMobile: v.isMobile, hasTouch: v.hasTouch, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector("[role=status]")?.dataset.done === "true", null, { timeout: 90000 });

    const geo = await page.evaluate(() => {
      const s = document.getElementById("process");
      return { top: s.offsetTop, height: s.offsetHeight, vh: innerHeight };
    });

    for (const [i, c] of CHAPTERS.entries()) {
      const p = (c.hold[0] + Math.min(c.hold[1], 0.995)) / 2;
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(geo.top + p * (geo.height - geo.vh)));
      await page.waitForTimeout(500);
      const s = await page.evaluate(() => {
        const c = document.querySelector("#process canvas");
        const ctx = c.getContext("2d");
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let lit = 0;
        for (let k = 0; k < d.length; k += 4 * 97) if (d[k] + d[k + 1] + d[k + 2] > 120) lit++;
        return {
          vis: [...document.querySelectorAll("#process article")].map((a, i) => (getComputedStyle(a).visibility === "visible" && +getComputedStyle(a).opacity > 0.9 ? i : -1)).filter((i) => i >= 0),
          lit,
          frame: +document.querySelector("#process .tabular-nums span").textContent,
        };
      });
      const expectFrame = Math.round(p * (FRAME_COUNT - 1)) + 1;
      ok(`${v.name} ${c.id}: only panel ${i + 1} visible`, JSON.stringify(s.vis) === JSON.stringify([i]), JSON.stringify(s.vis));
      ok(`${v.name} ${c.id}: canvas painted, frame ${expectFrame}`, s.lit > 50 && Math.abs(s.frame - expectFrame) <= 2, `lit ${s.lit}, frame ${s.frame}`);
    }
    ok(`${v.name}: no console errors`, errors.length === 0, errors.slice(0, 2).join("; "));
    await context.close();
  }
}
