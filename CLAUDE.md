# kodexa-tailor

Built with the kodexa-builder skill (v1.3.0). Load it for any new feature or
design work, and log preferences, corrections and reversals to
`.claude/kodexa-learnings.md` as they happen.

## What this is

**Kodexa · The Anatomy of a Product**: a one-page, scroll-driven portfolio
piece for Kodexa. A pinned canvas scrubs through 1200 frames of a particle
scene (dust, a spark, a wireframe, a design, code, a laptop and phone, a
growth chart, a pressed button) while seven chapter panels tell the story of
how Kodexa builds software.

Everything is original: the frames are generated in code
(`scripts/frames/`), the copy and the logo were written for Kodexa.

- **Type:** 3d-website + marketing-site (portfolio, not a client product)
- **Branch history:** `claude/laughing-darwin-wiy7si` holds the earlier 1:1
  study of another site. This branch (`kodexa-original`) shares none of its
  frames, copy, logo, CSS or engine code.
- **Public face:** Hamid Javed is the only person named, as founder.
- **Palette exceptions:** none. Ember (#e8743b) on graphite (#0b0b0d).

## Stack

- Next.js 16 App Router, React 19, plain JavaScript, `@/*` alias
- Tailwind v4, tokens in `app/_styles/globals.css` `@theme`
- GSAP ScrollTrigger (progress only, no pinning: the scene uses CSS sticky),
  Lenis for smooth wheel scrolling, one `gsap.ticker` loop draws everything
- Fonts: Instrument Serif (display), Geist (text), Geist Mono (labels)
- Frames: three.js particle scene rendered headless by Playwright (SwiftShader)

## How the scroll works

- `app/_lib/chapters.js` is the single source of truth: `FRAME_COUNT`,
  both sequences, hero and chapter copy, and each chapter's `hold` window.
  The frame renderer reads the same file, so shapes and panels cannot drift.
- `app/_lib/frame-sequence.js` loads frames in passes (every 16th, 8th, 4th,
  2nd, then all) so the whole story is usable after about 75 frames, and draws
  a **fractional** frame by cross-fading the two nearest loaded frames.
- `ProductExperience.js`: ScrollTrigger reports progress, the ticker eases
  toward it (0.14 per frame), draws, and sets panel opacity/transform.
- Portrait viewports load `/frames/portrait` (720x1280, framed for phones with
  the subject above the text); landscape loads `/frames/landscape` (1280x720,
  subject opposite the panel). Save-Data or 2g/3g loads every other frame.
- Reduced motion: no Lenis, no easing lag, panels fade without moving.

## Regenerating frames

```bash
node scripts/frames/render.mjs                        # both sequences, ~10 min
node scripts/frames/render.mjs --only 0,600 --out /tmp/preview   # preview
```

Change a shape in `scripts/frames/scene.js`, timing in `chapters.js`, then
re-render. Options: `--seq`, `--frames`, `--particles` (45000), `--q` (0.65).

## Commands

- `npm run dev`, `npm run build`, `npm start`, `npm run lint`
- `npm run check -- --base http://localhost:3000` against `npm run build && npm start`

## Placeholders before sharing widely

`app/_lib/siteConfig.js`: WhatsApp number and email are placeholders.
