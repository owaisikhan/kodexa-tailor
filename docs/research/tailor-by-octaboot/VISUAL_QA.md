# Visual QA: original vs clone

Both rendered in the same Chromium (Playwright), original served from a
byte-for-byte local copy of its files, clone from `npm run build && npm start`,
same Google Fonts on both. States sampled at 10 scroll fractions after the
loader finished.

| Check | 1440x900 | 390x844 |
|---|---|---|
| Document height | 8681 = 8681 | 7439 = 7439 |
| Scene height | 7650 = 7650 | 6414 = 6414 |
| Outro height | 1031 = 1031 | 1024 = 1024 |
| Visible panel, position and size at each fraction | 10/10 identical | 10/10 identical |
| Movement counter, progress width, header state | 10/10 identical | 10/10 identical |
| Fonts loaded | identical set | identical set |
| Mean pixel difference (0 to 255) | 0.00 to 0.24 | 0.00 to 0.49 |
| Pixels differing by more than 24 | at most 0.15% | at most 0.49% |
| Console errors | none | none |

The remaining pixel difference is the animated grain overlay, which moves on
its own timer and is never in the same position in two screenshots.

Known, intentional differences:
- Fonts come from `next/font` (self-hosted at build time) instead of the
  Google Fonts stylesheet; same families, weights and styles.
- `cursor: pointer` on buttons (house rule; the original has no buttons).
