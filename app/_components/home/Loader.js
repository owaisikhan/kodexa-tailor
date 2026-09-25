// Full-screen preloader. Bar width and percentage are written directly by
// SuitExperience as frames arrive (no React re-render per frame).
export function Loader({ loaderRef, fillRef, pctRef }) {
  return (
    <div className="loader" id="loader" aria-hidden="true" ref={loaderRef}>
      <div className="loader__mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/img/kodexa.svg" alt="" />
      </div>
      <div className="loader__bar">
        <span id="loaderFill" ref={fillRef} />
      </div>
      <div className="loader__pct">
        <span id="loaderPct" ref={pctRef}>0</span>
        <i>%</i>
      </div>
      <div className="loader__label">Preparing the atelier</div>
    </div>
  );
}
