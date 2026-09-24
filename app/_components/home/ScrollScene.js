import { PANELS } from "@/app/_lib/scene-data";

// The pinned scene: a canvas scrubbed through 535 frames, cinematic overlays,
// the hero title and seven editorial panels alternating left and right.
// Section is 850vh tall (760vh under 900px); #sticky is pinned by GSAP.
export function ScrollScene({ canvasRef, progressRef, movementRef }) {
  return (
    <section className="scene" id="scene" aria-label="The making of an Octaboot suit">
      <div className="sticky" id="sticky">
        <canvas id="frames" className="frames-canvas" ref={canvasRef} />

        <div className="grade grade--vignette" />
        <div className="grade grade--top" />
        <div className="grade grade--bottom" />
        <div className="grain" />

        <div className="panel panel--hero" data-panel="hero">
          <p className="eyebrow">Octaboot · Bespoke Since MCMXC8</p>
          <h1 className="hero-title">
            The Anatomy
            <br />
            <em>of a Suit</em>
          </h1>
          <div className="scroll-cue">
            <span />
            Scroll
          </div>
        </div>

        {PANELS.map((panel, i) => (
          <article key={panel.kicker} className={`panel panel--${panel.side}`} data-panel={i + 1}>
            <span className="panel__index">{String(i + 1).padStart(2, "0")}</span>
            <p className="panel__kicker">{panel.kicker}</p>
            <h2 className="panel__title">
              {panel.title[0]}
              <br />
              {panel.title[1]}
            </h2>
            {panel.body && <p className="panel__body">{panel.body}</p>}
            <p className="panel__spec">
              <i>{panel.spec[0]}</i> {panel.spec[1]}
            </p>
          </article>
        ))}

        <div className="progress">
          <span id="progressFill" ref={progressRef} />
        </div>
        <div className="scene-count">
          <span id="movementNo" ref={movementRef}>00</span>
          <i>/ 07</i>
        </div>
      </div>
    </section>
  );
}
