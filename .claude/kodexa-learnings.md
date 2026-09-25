# kodexa-builder learnings

This file is how this repo teaches the kodexa-builder skill. Every session
that loads the skill reads it first and appends to it as the user corrects,
reverses or chooses things. Entries promoted into the skill are marked with
the version they landed in. See the skill's `references/self-improvement.md`
for the rules.

- **Project:** kodexa-tailor
- **Type:** 3d-website + marketing-site (portfolio); started as a site-clone
- **Who reads it daily:** visitors on phone and desktop browsing a bespoke tailoring brand
- **Palette exceptions:** none
- **Skill version when started:** 1.3.0

## Summary

| ID | Date | Kind | Lesson (short) | Scope | Status |
|---|---|---|---|---|---|
| L-001 | 2026-09-24 | gotcha | Serve a local copy of the original for visual QA when the sandbox browser rejects the proxy certificate | type: site-clone | logged |
| L-002 | 2026-09-24 | gap | "100 percent match" clone vs anti-slop em dash rule: keep original copy, note it in CLAUDE.md | type: site-clone | logged |
| L-003 | 2026-09-25 | choice | Owner chose to rebuild the cloned site as an original (own frames, copy, logo) instead of renaming the clone | type: site-clone | logged |
| L-004 | 2026-09-25 | rule | "as many frames as possible so the scroll is smoother": more frames plus cross-fade, progressive loading to keep weight sane | type: 3d-website | logged |

## Entries

### L-001 · 2026-09-24 · medium · gotcha
- **Said / saw:** Playwright `page.goto` on the live site failed with `ERR_CERT_AUTHORITY_INVALID`; with fonts blocked the first comparison showed false layout deltas (Times fallback).
- **Context:** visual QA of the tailor-by-octaboot clone in Claude Code on the web.
- **Lesson:** In the cloud sandbox, download the original's files and serve them locally (`python3 -m http.server`) for side-by-side QA, and route Google Fonts requests through curl so both sides render the real fonts. Compare fonts loaded before trusting any layout diff.
- **Scope:** type: site-clone
- **Target in skill:** references/types/site-clone.md, Gotchas
- **Status:** logged

### L-002 · 2026-09-24 · medium · gap
- **Said / saw:** "the clone should 100 percent match to the orginal one"; the original title and footer contain em dashes.
- **Context:** first build of kodexa-tailor.
- **Lesson:** For a 1:1 clone, original copy is kept verbatim (including dashes) and the exception is written into CLAUDE.md; the anti-slop gate applies once copy is rewritten for the new owner.
- **Scope:** type: site-clone
- **Target in skill:** references/types/site-clone.md and references/anti-slop.md
- **Status:** logged

### L-003 · 2026-09-25 · strong · choice
- **Said / saw:** "go with route 1 and the anatomy of a product... write the code in a new branch"
- **Context:** after asking to rename the Octaboot clone to Kodexa with the original frames and copy, the owner chose a fully original rebuild on branch kodexa-original.
- **Lesson:** When a clone is to carry Kodexa's name, rebuild it as an original: keep the technique, generate new frames in code (three.js particles rendered headless with Playwright + SwiftShader, ~0.1 s per frame), write new copy and a new mark. Offer this route up front instead of a rename.
- **Scope:** type: site-clone
- **Target in skill:** references/types/site-clone.md, "After the clone"
- **Status:** logged

### L-004 · 2026-09-25 · strong · rule
- **Said / saw:** "generate as many frames as possible so the scroll should be smoother than the original"
- **Context:** frame sequence for a scroll scene.
- **Lesson:** Smoothness comes from three things together: more frames (1200 vs 535), cross-fading the two nearest frames at a fractional position, and easing toward scroll progress. Keep weight in check with 1280x720 WebP at q 0.65 (about 45 KB a frame), progressive passes (every 16th frame first) and a separate portrait sequence for phones.
- **Scope:** type: 3d-website
- **Target in skill:** references/types/3d-website.md
- **Status:** logged
