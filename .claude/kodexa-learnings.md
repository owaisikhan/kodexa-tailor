# kodexa-builder learnings

This file is how this repo teaches the kodexa-builder skill. Every session
that loads the skill reads it first and appends to it as the user corrects,
reverses or chooses things. Entries promoted into the skill are marked with
the version they landed in. See the skill's `references/self-improvement.md`
for the rules.

- **Project:** kodexa-tailor
- **Type:** site-clone (3d-website scroll rules)
- **Who reads it daily:** visitors on phone and desktop browsing a bespoke tailoring brand
- **Palette exceptions:** none
- **Skill version when started:** 1.3.0

## Summary

| ID | Date | Kind | Lesson (short) | Scope | Status |
|---|---|---|---|---|---|
| L-001 | 2026-09-24 | gotcha | Serve a local copy of the original for visual QA when the sandbox browser rejects the proxy certificate | type: site-clone | logged |
| L-002 | 2026-09-24 | gap | "100 percent match" clone vs anti-slop em dash rule: keep original copy, note it in CLAUDE.md | type: site-clone | logged |

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
