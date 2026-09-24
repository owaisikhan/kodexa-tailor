// Fixed header, mix-blend-mode: difference. Hidden on scroll down past
// 120px, shown on scroll up (transform written by SuitExperience).
export function SiteHeader({ headerRef }) {
  return (
    <header className="site-header" id="header" ref={headerRef}>
      <a className="brand" href="#top" aria-label="Octaboot home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand__mark" src="/assets/img/octaboot.png" alt="" />
        <span className="brand__word">OCTABOOT</span>
      </a>
      <nav className="nav">
        <a href="#atelier">Atelier</a>
        <a href="#collection">Collection</a>
        <a className="nav__cta" href="#book">
          Book a Fitting
        </a>
      </nav>
    </header>
  );
}
