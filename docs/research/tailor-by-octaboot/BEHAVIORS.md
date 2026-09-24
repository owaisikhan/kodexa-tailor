# Behaviours: tailor-by-octaboot.vercel.app

Source: static site (index.html, assets/css/style.css, assets/js/app.js,
GSAP 3.12.5 + ScrollTrigger 3.12.5 from local files, 535 frames).

## 1. Loader
- **Trigger:** page load.
- **Before:** full-screen `#0a0a0b` overlay, logo "breathing" (2.6s loop,
  opacity .35 to .95, 4px lift), 1px gold bar, serif percentage, label
  "Preparing the atelier".
- **During:** all 535 `Image()` objects are created at once; each load or error
  bumps the bar and percentage. Frame 1 paints to the canvas as soon as it lands.
- **Start:** the scroll timeline is built after 60 frames (or all) have loaded.
- **After:** at 100% the loader gets `.is-done` (1s opacity + visibility fade).
- **Clone:** identical, in `SuitExperience.js` (DOM writes via refs, no re-renders).

## 2. The scroll scene (the main animation)
- `#scene` is 850vh tall (760vh under 900px). `#sticky` (100vh) is pinned with
  `pin: "#sticky", pinSpacing: true, start: "top top", end: "bottom bottom"`.
  Pin spacing makes the scroll distance 850vh, so the page is 850vh + outro.
- One master timeline, duration 1.0, `scrub: 0.6` (0.6s catch-up smoothing).
- **Frame scrub:** `state.frame` tweens 0 to 534 linearly across the whole
  timeline; `onUpdate` draws `images[frame | 0]` onto the canvas with a
  cover fit (scale = max(cw/iw, ch/ih), centred), canvas sized to
  viewport x devicePixelRatio (capped at 2), flat `#0a0a0b` fill underneath.
- **Hero title:** starts visible, fades out (`autoAlpha 0, y -30`,
  power2.in) between 0.004 and 0.034 of progress, so it dissolves the
  moment scrolling starts.
- **Panels 01 to 07:** start `autoAlpha 0`, `x` +/-44px (left panels from the
  left, right panels from the right), `y -50%`. Fade in over 0.035
  (power2.out) at the cue's first value, fade out over 0.035 (power2.in) at
  the second value while drifting `-fromX * 0.5`.

| Panel | In | Out | Frame milestone |
|---|---|---|---|
| 01 The Foundation | 0.115 | 0.205 | shirt |
| 02 The Waistcoat | 0.235 | 0.355 | vest and tie |
| 03 The Canvas | 0.385 | 0.535 | jacket |
| 04 The Cut | 0.560 | 0.635 | full suit |
| 05 The Man | 0.660 | 0.765 | worn, cuff |
| 06 The Procession | 0.790 | 0.905 | colour walk |
| 07 The Detail | 0.925 | 0.995 | macro cuff |

- **Progress bar:** 2px bar at the bottom of the pinned view, width = progress
  (gold to gold-soft gradient).
- **Movement counter** (bottom right, hidden under 900px): the highest panel
  number whose cue start minus FADE (0.035) has been passed, zero padded, "/ 07".
- **Overlays (static):** inset vignette, top and bottom black gradients,
  SVG fractal-noise grain at 5% overlay, stepping 6 times over 6s.

## 3. Header
- Fixed, `mix-blend-mode: difference` so it reads over light and dark frames.
- A global ScrollTrigger hides it (`translateY(-140%)`, .5s ease) when
  scrollY > 120 and moving down; any upward scroll brings it back.
- Under 900px only "Book a Fitting" remains; under 520px the wordmark hides.

## 4. Responsive panels (under 900px)
- Panels centre horizontally at `bottom: 11vh`, width min(88vw, 44ch),
  text centred; bottom gradient grows to 56%. GSAP's inline transform
  (x/y) replaces the CSS transform, exactly as on the original.

## 5. Reduced motion
- Grain, scroll cue and loader loops stop; `scroll-behavior` becomes auto.
  Scrubbing stays user-driven.

## 6. Outro
- Radial gradient section with logo, eyebrow, "Tailoring for the few.",
  body copy, outline gold button (fills gold on hover, .5s) and a two-column
  footer grid (one column under 900px). The year is written by script.
