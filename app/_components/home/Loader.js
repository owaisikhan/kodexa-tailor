// Shown until the first pass of frames (every 16th) has arrived, which is
// enough to scrub the whole story. The rest streams in behind it.
export function Loader({ loaderRef, barRef, pctRef }) {
  return (
    <div
      ref={loaderRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-canvas transition-[opacity,visibility] duration-700 ease-out-quint data-[done=true]:invisible data-[done=true]:opacity-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="size-1.5 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-ember" />
        <span className="font-mono text-xs tracking-[0.2em] text-ink-dim uppercase">Assembling particles</span>
      </div>
      <div className="h-px w-56 overflow-hidden bg-line">
        <div ref={barRef} className="h-full w-0 bg-ember transition-[width] duration-200" />
      </div>
      <p className="font-mono text-sm text-ink tabular-nums">
        <span ref={pctRef}>0</span>
        <span className="text-ink-faint">%</span>
      </p>
    </div>
  );
}
