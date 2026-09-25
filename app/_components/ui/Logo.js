// The Kodexa mark: a K drawn as two strokes whose arms end in particles,
// inside a rounded frame. currentColor for the frame and stem, ember dots.
export function Logo({ className = "size-7", title }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <path d="M11 8.5v15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11.8 16.2 19.2 9.6M11.8 15.8l7.4 6.6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22.4" cy="8.4" r="1.9" fill="var(--color-ember)" />
      <circle cx="22.4" cy="23.6" r="1.9" fill="var(--color-ember)" />
    </svg>
  );
}
