import { CHAPTERS, HERO, FRAME_COUNT } from "@/app/_lib/chapters";

// The pinned story: canvas (drawn by ProductExperience), overlays, the hero,
// seven chapter panels, a chapter rail and a frame counter. Opacity and
// transforms of the panels are written every frame from scroll progress.
export function ProductScene({ sceneRef, canvasRef, heroRef, panelRefs, railRefs, progressRef, frameRef, streamRef, onJump }) {
  return (
    <section ref={sceneRef} id="process" className="relative h-[900vh] max-sm:h-[780vh]" aria-label="The anatomy of a product, in seven stages">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />

        {/* framing: soft vignette and a darker floor for legible text */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(11_11_13/0.75)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-canvas/80 to-transparent max-sm:h-3/5 max-sm:from-canvas" />

        <div ref={heroRef} className="absolute inset-x-4 top-1/2 text-center will-change-transform" style={{ transform: "translateY(-50%)" }}>
          {/* soft shade so the copy reads over the dust */}
          <div className="pointer-events-none absolute -inset-x-4 -inset-y-16 -z-10 bg-[radial-gradient(ellipse_closest-side,rgb(11_11_13/0.7),transparent)]" aria-hidden="true" />
          <p className="eyebrow">{HERO.eyebrow}</p>
          <h1 className="mt-5 font-display text-[clamp(3.2rem,11vw,9rem)] leading-[0.92] tracking-[-0.02em] text-ink">
            {HERO.title[0]}
            <br />
            <em className="text-ember-soft">{HERO.title[1]}</em>
          </h1>
          <p className="mx-auto mt-6 max-w-[42ch] text-[clamp(0.95rem,1.2vw,1.1rem)] leading-relaxed text-ink-dim">{HERO.sub}</p>
          <div className="mt-10 flex flex-col items-center gap-3" aria-hidden="true">
            <span className="relative h-12 w-px overflow-hidden bg-line">
              <span className="absolute inset-0 animate-[cue_1.8s_ease-in-out_infinite] bg-ember" />
            </span>
            <span className="font-mono text-[0.68rem] tracking-[0.3em] text-ink-faint uppercase">Scroll</span>
          </div>
        </div>

        {CHAPTERS.map((c, i) => (
          <article
            key={c.id}
            ref={(el) => (panelRefs.current[i] = el)}
            className={`invisible absolute w-[min(26rem,34vw)] opacity-0 will-change-[opacity,transform] max-sm:inset-x-4 max-sm:bottom-[max(4.5rem,9svh)] max-sm:w-auto sm:top-1/2 ${
              c.side === "left" ? "sm:left-[clamp(1.5rem,6vw,7rem)]" : "sm:right-[clamp(1.5rem,6vw,7rem)] xl:right-[clamp(5rem,8vw,9rem)]"
            }`}
          >
            <p className="font-mono text-xs tracking-[0.16em] text-ink-dim uppercase">
              <span className="text-ember">{String(i + 1).padStart(2, "0")}</span>
              <span className="mx-2 text-ink-faint">/</span>
              {c.kicker}
            </p>
            <h2 className="mt-4 font-display text-[clamp(2.5rem,4.6vw,4.4rem)] leading-[0.95] tracking-[-0.015em] text-ink">
              {c.title[0]}
              <br />
              <em className="text-ember-soft">{c.title[1]}</em>
            </h2>
            <p className="mt-5 max-w-[38ch] text-[0.98rem] leading-relaxed text-ink-dim max-sm:text-[0.92rem]">{c.body}</p>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 border-t border-line pt-4 font-mono text-[0.72rem] tracking-[0.06em] uppercase">
              {c.spec.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-faint">{k}</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}

        {/* chapter rail (desktop): jump to any stage */}
        <nav className="absolute top-1/2 right-4 hidden -translate-y-1/2 flex-col items-end gap-1 xl:flex" aria-label="Chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              ref={(el) => (railRefs.current[i] = el)}
              type="button"
              onClick={() => onJump(i)}
              aria-label={`Go to ${c.kicker}`}
              className="group flex min-h-7 items-center gap-3 font-mono text-[0.66rem] tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-ink data-[active=true]:text-ink"
            >
              <span className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{c.kicker}</span>
              <span className="h-px w-4 bg-current transition-[width] group-data-[active=true]:w-8 group-data-[active=true]:bg-ember" />
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-4 font-mono text-[0.68rem] tracking-[0.12em] text-ink-faint tabular-nums sm:left-8">
          FRAME <span ref={frameRef} className="text-ink-dim">0001</span> / {String(FRAME_COUNT).padStart(4, "0")}
          <span ref={streamRef} className="ml-3 text-ember/80" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-line">
          <div ref={progressRef} className="h-full origin-left scale-x-0 bg-linear-to-r from-ember to-ember-soft" />
        </div>
      </div>
    </section>
  );
}
