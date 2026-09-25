# UI conventions

- Colour tokens by role in `app/_styles/globals.css`: canvas, surface, ink,
  ink-dim (body text, 7.9:1 on canvas), ink-faint (decorative labels only),
  line, ember (actions), ember-soft (emphasis in headings).
- Type: Instrument Serif for headings with the second line in italic
  ember-soft; Geist for body; Geist Mono uppercase with tracking for labels,
  specs and counters.
- Every link and button is at least 44px tall.
- Calls to action go to WhatsApp via `whatsappLink()` and show the WhatsApp
  glyph from `ui/WhatsAppIcon.js`.
- No em or en dashes anywhere; use a colon, comma or middle dot.
