// Composes the Facebook reel (1080x1920) and feed post (1080x1350) from the
// captured site frames. render.mjs calls window.setFrame(n) for the reel, or
// loads ?mode=post and screenshots once.

const FPS = 30;
const DESKTOP_FRAMES = 240;
const PHONE_FRAMES = 240;
const mode = new URLSearchParams(location.search).get("mode") || "reel";

const $ = (id) => document.getElementById(id);
const monitor = $("monitor");
const phone = $("phone");
const floor = $("floor");
const mImg = $("mImg");
const pImg = $("pImg");
const captions = $("captions");

const pad = (n) => String(n).padStart(4, "0");
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

// Device centre (x, y), scale and opacity for each layout.
const LAYOUTS = {
  intro: { m: [540, 760, 0.9, 1], p: [800, 1060, 0.6, 1] },
  desktop: { m: [540, 820, 1.0, 1], p: [1360, 1000, 0.6, 0] },
  phone: { m: [-260, 760, 0.8, 0], p: [540, 820, 1.28, 1] },
  end: { m: [520, 640, 0.86, 1], p: [800, 910, 0.58, 1] },
  post: { m: [520, 660, 0.9, 1], p: [818, 800, 0.6, 1] },
};

// Scenes: [start s, layout, caption]
const SCENES = [
  [0, "intro", { eyebrow: "New website", headline: "The Anatomy<br><em>of a Suit</em>" }],
  [2, "desktop", { eyebrow: "On desktop", headline: "Scroll the making<br><em>of a suit</em>" }],
  [10, "phone", { eyebrow: "On your phone", headline: "Every stitch,<br><em>in your pocket</em>" }],
  [18, "end", { eyebrow: "Kodexa Tailor", headline: "Tailoring<br><em>for the few.</em>", cta: "Book a private fitting" }],
];
// Cuts land on downbeats of the 120 BPM score (one bar = 2 s).
export const DURATION = 22;
const MOVE = 0.8;

function place(el, [x, y, s, o], w, h) {
  el.style.transform = `translate(${Math.round(x - w / 2)}px, ${Math.round(y - h / 2)}px) scale(${s})`;
  el.style.opacity = o;
}

function layoutAt(t) {
  let k = 0;
  for (let i = 0; i < SCENES.length; i++) if (t >= SCENES[i][0]) k = i;
  const cur = LAYOUTS[SCENES[k][1]];
  const prev = k > 0 ? LAYOUTS[SCENES[k - 1][1]] : cur;
  const e = ease(clamp01((t - SCENES[k][0]) / MOVE));
  const mix = (a, b) => a.map((v, i) => lerp(v, b[i], e));
  const m = mix(prev.m, cur.m);
  const p = mix(prev.p, cur.p);
  return { k, m, p };
}

function captionHTML(c, cls = "") {
  return `<div class="caption ${c.cta ? "has-cta " : ""}${cls}"><p class="eyebrow">${c.eyebrow}</p><h1 class="headline">${c.headline}</h1>${
    c.cta ? `<div class="cta">${c.cta}</div><p class="foot-note">Bespoke · Made by hand</p>` : ""
  }</div>`;
}

function renderCaptions(t, k) {
  const html = SCENES.map(([start, , c], i) => {
    const end = i + 1 < SCENES.length ? SCENES[i + 1][0] : Infinity;
    const inAmt = ease(clamp01((t - start - 0.25) / 0.6));
    const outAmt = ease(clamp01((t - (end - 0.35)) / 0.35));
    const o = i === 0 ? Math.min(clamp01(t / 0.6), 1 - outAmt) : inAmt * (1 - outAmt);
    if (o <= 0.001) return "";
    return captionHTML(c).replace('class="caption ', `style="opacity:${o};transform:translateY(${(1 - inAmt) * 24 - outAmt * 16}px)" class="caption `);
  });
  captions.innerHTML = html.join("");
  document.querySelector(".brand").style.opacity = clamp01(t / 0.8);
  return k;
}

async function setSrc(img, src) {
  if (img.dataset.src === src) return;
  img.dataset.src = src;
  img.src = src;
  await img.decode().catch(() => {});
}

window.setFrame = async (n) => {
  const t = n / FPS;
  const { k, m, p } = layoutAt(t);
  place(monitor, m, 996, 750);
  place(phone, p, 424, 880);
  floor.style.top = `${m[1] + 330 * m[2]}px`;
  floor.style.opacity = m[3] * 0.9 + p[3] * 0.1;
  renderCaptions(t, k);

  let mSrc = "/cap/desktop-hero.jpg";
  let pSrc = "/cap/phone-hero.jpg";
  if (t >= SCENES[1][0]) mSrc = `/cap/desktop/${pad(Math.min(DESKTOP_FRAMES - 1, Math.floor((t - SCENES[1][0]) * FPS)))}.jpg`;
  if (t >= SCENES[2][0]) pSrc = `/cap/phone/${pad(Math.min(PHONE_FRAMES - 1, Math.floor((t - SCENES[2][0]) * FPS)))}.jpg`;
  if (t >= SCENES[3][0]) {
    mSrc = "/cap/desktop-outro.jpg";
    pSrc = "/cap/phone-outro.jpg";
  }
  await Promise.all([setSrc(mImg, mSrc), setSrc(pImg, pSrc)]);
  return true;
};

window.frameCount = Math.round(DURATION * FPS);

if (mode === "post") {
  document.body.classList.add("post");
  place(monitor, LAYOUTS.post.m, 996, 750);
  place(phone, LAYOUTS.post.p, 424, 880);
  floor.style.top = `${660 + 330 * 0.9}px`;
  captions.innerHTML =
    captionHTML({ eyebrow: "Now live", headline: "The Anatomy <em>of a Suit</em>" }, "post-top") +
    captionHTML({ eyebrow: "Scroll the making of a suit", headline: "", cta: "Book a private fitting" }, "post-bottom");
  document.querySelector(".post-bottom .headline").remove();
  const q = new URLSearchParams(location.search);
  await Promise.all([setSrc(mImg, `/cap/desktop/${q.get("d") || "0080"}.jpg`), setSrc(pImg, `/cap/phone/${q.get("p") || "0140"}.jpg`)]);
}
await document.fonts.ready;
window.stageReady = true;
