// The scroll scene matches the original at fixed scroll fractions: the right
// panel is visible, the movement counter reads right, the canvas is painted
// (not the flat #0a0a0b fill) and the header hides on scroll down.
// Expected values were measured on tailor-by-octaboot.vercel.app at 1440x900.

const EXPECT = [
  [0, "00", "hero"],
  [0.08, "01", null],
  [0.17, "01", "1"],
  [0.3, "02", "2"],
  [0.46, "03", "3"],
  [0.6, "04", "4"],
  [0.72, "05", "5"],
  [0.85, "06", "6"],
  [0.96, "07", "7"],
];

export default async function scrollScene({ base, browser, ok }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.getElementById("loader").classList.contains("is-done"), null, { timeout: 90000 });

  const sceneH = await page.evaluate(() => document.getElementById("scene").offsetHeight);
  ok("scene is 850vh at 1440x900", sceneH === 7650, `got ${sceneH}`);

  for (const [f, no, panel] of EXPECT) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(f * (sceneH - 900)));
    await page.waitForTimeout(1200);
    const s = await page.evaluate(() => {
      const c = document.getElementById("frames");
      const px = c.getContext("2d").getImageData(c.width / 2, c.height / 2, 1, 1).data;
      return {
        no: document.getElementById("movementNo").textContent,
        vis: [...document.querySelectorAll(".panel")].filter((p) => getComputedStyle(p).visibility === "visible").map((p) => p.dataset.panel),
        painted: px[0] + px[1] + px[2] > 3 * 11,
        header: document.getElementById("header").style.transform,
      };
    });
    const want = panel ? [panel] : [];
    ok(`at ${f}: movement ${no}, panel ${panel ?? "none"}`, s.no === no && JSON.stringify(s.vis) === JSON.stringify(want), JSON.stringify(s));
    if (f === 0.3) ok("canvas is painted mid-scroll", s.painted);
    if (f === 0.3) ok("header hidden after scrolling down", s.header === "translateY(-140%)", s.header);
  }
  ok("no console errors", errors.length === 0, errors.slice(0, 2).join("; "));
  await page.close();
}
