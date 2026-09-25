"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/app/_lib/gsap";
import { CHAPTERS, FADE, FRAME_COUNT, SEQUENCES, framePath } from "@/app/_lib/chapters";
import { FrameSequence } from "@/app/_lib/frame-sequence";
import { SiteHeader } from "@/app/_components/layout/SiteHeader";
import { Loader } from "@/app/_components/home/Loader";
import { ProductScene } from "@/app/_components/home/ProductScene";
import { Outro } from "@/app/_components/home/Outro";

const BACKGROUND = "#0b0b0d";
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Scroll engine: Lenis smooths the wheel, ScrollTrigger reports progress
// through the pinned section, and one ticker loop eases toward that
// progress, draws the (cross-faded) frame and places every panel.
export function ProductExperience() {
  const sceneRef = useRef(null);
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const panelRefs = useRef([]);
  const railRefs = useRef([]);
  const progressRef = useRef(null);
  const frameRef = useRef(null);
  const streamRef = useRef(null);
  const loaderRef = useRef(null);
  const barRef = useRef(null);
  const pctRef = useRef(null);
  const yearRef = useRef(null);
  const lenisRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    yearRef.current.textContent = new Date().getFullYear();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });

    const state = { target: 0, current: 0, drawn: -1, dirty: true, active: -2 };
    let sequence = null;
    let orientation = null;

    // Slow or data-saving connections load every other frame; the
    // cross-fade keeps it smooth either way.
    const conn = navigator.connection;
    const stride = conn && (conn.saveData || /2g|3g/.test(conn.effectiveType || "")) ? 2 : 1;

    function startSequence() {
      const next = window.innerHeight > window.innerWidth ? "portrait" : "landscape";
      if (next === orientation) return;
      orientation = next;
      sequence?.cancel();
      const { dir } = SEQUENCES[next];
      let first = true;
      sequence = new FrameSequence({
        count: FRAME_COUNT,
        stride,
        src: (i) => framePath(dir, i + 1),
        onProgress: (p) => {
          state.dirty = true;
          const pct = Math.round(p * 100);
          if (first) {
            barRef.current.style.width = `${Math.min(100, pct * 4)}%`;
            pctRef.current.textContent = Math.min(100, pct * 4);
          }
          streamRef.current.textContent = p < 1 ? `streaming ${pct}%` : "";
        },
        onReady: () => {
          first = false;
          barRef.current.style.width = "100%";
          pctRef.current.textContent = "100";
          loaderRef.current.dataset.done = "true";
          state.dirty = true;
        },
      });
      sequence.load();
    }

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      state.dirty = true;
    }

    /* ---------- scroll ---------------------------------------------- */
    let lenis = null;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      lenisRef.current = lenis;
    }
    const lenisRaf = (time) => lenis?.raf(time * 1000);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);

    triggerRef.current = ScrollTrigger.create({
      trigger: sceneRef.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => (state.target = self.progress),
    });

    /* ---------- per-frame update ------------------------------------- */
    function place(p) {
      // hero leaves as soon as scrolling starts
      const heroOut = smooth(0.004, 0.035, p);
      heroRef.current.style.opacity = 1 - heroOut;
      heroRef.current.style.transform = `translateY(calc(-50% - ${heroOut * 40}px))`;
      heroRef.current.style.visibility = heroOut >= 1 ? "hidden" : "visible";

      let active = -1;
      CHAPTERS.forEach((c, i) => {
        const [s, e] = c.hold;
        const inAmt = smooth(s - FADE, s + FADE * 0.2, p);
        const outAmt = e >= 1 ? 0 : smooth(e - FADE * 0.2, e + FADE, p);
        const o = inAmt * (1 - outAmt);
        const el = panelRefs.current[i];
        el.style.opacity = o;
        el.style.visibility = o > 0.001 ? "visible" : "hidden";
        const y = reduced ? 0 : (1 - inAmt) * 28 - outAmt * 28;
        el.style.transform = window.innerWidth >= 640 ? `translateY(calc(-50% + ${y}px))` : `translateY(${y}px)`;
        if (p >= s - FADE) active = i;
      });
      if (active !== state.active) {
        state.active = active;
        railRefs.current.forEach((b, i) => b && (b.dataset.active = String(i === active)));
      }
      progressRef.current.style.transform = `scaleX(${p})`;
    }

    function tick() {
      const diff = state.target - state.current;
      state.current = reduced || Math.abs(diff) < 0.00005 ? state.target : state.current + diff * 0.14;
      const position = state.current * (FRAME_COUNT - 1);
      if (sequence && (state.dirty || Math.abs(position - state.drawn) > 0.002)) {
        if (sequence.draw(ctx, position, BACKGROUND)) {
          state.drawn = position;
          state.dirty = false;
        }
        frameRef.current.textContent = String(Math.round(position) + 1).padStart(4, "0");
      }
      place(state.current);
    }
    gsap.ticker.add(tick);

    let resizeRaf;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        sizeCanvas();
        startSequence();
      });
    };
    window.addEventListener("resize", onResize);

    sizeCanvas();
    startSequence();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRaf);
      gsap.ticker.remove(tick);
      gsap.ticker.remove(lenisRaf);
      triggerRef.current?.kill();
      lenis?.destroy();
      lenisRef.current = null;
      sequence?.cancel();
    };
  }, []);

  // Rail click: scroll to the middle of that chapter's hold window.
  function jumpTo(i) {
    const t = triggerRef.current;
    if (!t) return;
    const [s, e] = CHAPTERS[i].hold;
    const y = t.start + (t.end - t.start) * ((s + Math.min(e, 0.995)) / 2);
    if (lenisRef.current) lenisRef.current.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y });
  }

  return (
    <>
      <Loader loaderRef={loaderRef} barRef={barRef} pctRef={pctRef} />
      <SiteHeader />
      <main id="top">
        <ProductScene
          sceneRef={sceneRef}
          canvasRef={canvasRef}
          heroRef={heroRef}
          panelRefs={panelRefs}
          railRefs={railRefs}
          progressRef={progressRef}
          frameRef={frameRef}
          streamRef={streamRef}
          onJump={jumpTo}
        />
        <Outro yearRef={yearRef} />
      </main>
    </>
  );
}
