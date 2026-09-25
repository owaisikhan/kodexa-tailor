# kodexa-tailor

Built with the kodexa-builder skill (v1.3.0). Load it for any new feature or
design work, and log preferences, corrections and reversals to
`.claude/kodexa-learnings.md` as they happen.

## What this is

A 1:1 clone of https://tailor-by-octaboot.vercel.app/, rebranded as
"KODEXA, The Anatomy of a Suit": a single-page, scroll-driven site where a pinned canvas scrubs
through 535 WebP frames (a particle figure becoming a shirt, waistcoat, jacket,
full suit, a colour procession and a cuff macro) while seven editorial panels
fade in and out on one GSAP timeline.

- **Type:** site-clone (with the 3d-website scroll rules)
- **Goal set by the owner:** "the clone should 100 percent match the original".
  Match first, customise later.
- **Identity:** rebranded from Octaboot to Kodexa (name, wordmark and logo
  mark, `public/assets/img/kodexa.svg`) on 2026-09-25. The owner stated they
  own the original tailor-by-octaboot site; frames and copy are theirs and kept.

## Stack

- Next.js 16 App Router, React 19, plain JavaScript, `@/*` alias (`jsconfig.json`)
- GSAP 3.12.5 + ScrollTrigger (pinned to the original's version)
- Fonts via `next/font/google`: Cormorant Garamond, Jost
- Styles: `app/_styles/globals.css` is the original stylesheet verbatim, with
  Tailwind theme + utilities imported but **no preflight** (it would change
  heading metrics). Prefer editing the existing classes over adding utilities.

## Layout

```
app/
  layout.js                      fonts, metadata, <html data-scroll-behavior="smooth">
  page.js                        renders SuitExperience
  _components/home/
    SuitExperience.js            client: preload, canvas render, GSAP timeline, header hide
    ScrollScene.js  Loader.js  Outro.js
  _components/layout/SiteHeader.js
  _lib/gsap.js                   single plugin registration point
  _lib/scene-data.js             FRAME_COUNT, CUES, FADE, panel + footer content
  _styles/globals.css
public/assets/frames/frame_00001..00535.webp   1280x720, about 13 MB total
public/assets/img/kodexa.svg   Kodexa mark (white K, gold particle dots)
docs/research/tailor-by-octaboot/              analysis of the original
scripts/checks/                                npm run check (Playwright)
```

## Commands

- `npm run dev`, `npm run build`, `npm start`, `npm run lint`
- `npm run check -- --base http://localhost:3000` against `npm run build && npm start`

## Rules

- Timing lives in `CUES` and `FADE` in `app/_lib/scene-data.js`. The panel
  fade windows are tuned to frame milestones; changing frames means re-tuning cues.
- Palette exceptions: none (the palette is the original's gold on near-black).
- No em or en dashes anywhere (swapped for "·" on 2026-09-25).
