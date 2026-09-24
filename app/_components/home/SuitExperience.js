"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/app/_lib/gsap";
import { CUES, FADE, FRAME_COUNT, START_BUFFER, framePath } from "@/app/_lib/scene-data";
import { SiteHeader } from "@/app/_components/layout/SiteHeader";
import { Loader } from "@/app/_components/home/Loader";
import { ScrollScene } from "@/app/_components/home/ScrollScene";
import { Outro } from "@/app/_components/home/Outro";

// Port of the original assets/js/app.js: canvas image-sequence scrubbing
// plus editorial panel choreography on one scroll-scrubbed GSAP timeline.
export function SuitExperience() {
  const headerRef = useRef(null);
  const loaderRef = useRef(null);
  const fillRef = useRef(null);
  const pctRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(null);
  const movementRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    yearRef.current.textContent = new Date().getFullYear();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const images = new Array(FRAME_COUNT);
    const state = { frame: 0 };
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let disposed = false;
    let gctx = null;

    /* ---------- Canvas sizing + cover-fit draw ---------------------- */
    function render() {
      const img = images[state.frame | 0];
      if (!img || !img.complete || !img.naturalWidth) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih); // cover
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) * 0.5;
      const dy = (ch - dh) * 0.5;

      ctx.fillStyle = "#0a0a0b";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
    }

    function sizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      render();
    }

    /* ---------- Header hide on scroll-down --------------------------- */
    const header = headerRef.current;
    let lastY = 0;
    const headerTrigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        if (y > 120 && y > lastY) header.style.transform = "translateY(-140%)";
        else header.style.transform = "translateY(0)";
        lastY = y;
      },
    });

    /* ---------- Build the scroll experience -------------------------- */
    function build() {
      if (disposed) return;
      sizeCanvas();

      gctx = gsap.context(() => {
        const progressFill = progressRef.current;
        const movementNo = movementRef.current;
        const heroPanel = document.querySelector('[data-panel="hero"]');
        const panels = gsap.utils.toArray(".panel:not(.panel--hero)");

        // Master timeline, total duration normalised to 1.0. Positions are
        // scroll fractions mapped to the milestones of the frame sequence.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: "#scene",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            pin: "#sticky",
            pinSpacing: true,
            onUpdate: (self) => {
              const p = self.progress;
              progressFill.style.width = (p * 100).toFixed(2) + "%";
              let no = 0;
              for (let i = 0; i < CUES.length; i++) {
                if (p >= CUES[i][0] - FADE) no = i + 1;
              }
              movementNo.textContent = String(no).padStart(2, "0");
            },
          },
        });

        // 1: the frame scrubber drives the canvas across the whole scroll
        tl.to(state, { frame: FRAME_COUNT - 1, duration: 1, ease: "none", onUpdate: render }, 0);

        // Hero title dissolves the instant scrolling begins
        gsap.set(heroPanel, { autoAlpha: 1 });
        tl.to(heroPanel, { autoAlpha: 0, y: -30, duration: 0.03, ease: "power2.in" }, 0.004);

        // Editorial panels fade in and out across their milestone ranges
        panels.forEach((panel, i) => {
          const [inAt, outAt] = CUES[i];
          const fromX = panel.classList.contains("panel--right") ? 44 : -44;

          gsap.set(panel, { autoAlpha: 0, x: fromX, y: "-50%" });
          tl.to(panel, { autoAlpha: 1, x: 0, duration: FADE, ease: "power2.out" }, inAt);
          tl.to(panel, { autoAlpha: 0, x: -fromX * 0.5, duration: FADE, ease: "power2.in" }, outAt);
        });
      });

      ScrollTrigger.refresh();
    }

    /* ---------- Preload ---------------------------------------------- */
    let loaded = 0;
    let started = false;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        if (disposed) return;
        loaded++;
        const p = loaded / FRAME_COUNT;
        const pct = Math.round(p * 100);
        fillRef.current.style.width = pct + "%";
        pctRef.current.textContent = pct;

        // First frame ready: paint immediately so there is no black flash
        if (i === 0) render();

        // Start the experience once there is a comfortable buffer
        if (!started && (loaded >= START_BUFFER || p === 1)) {
          started = true;
          build();
        }
        if (p === 1) loaderRef.current.classList.add("is-done");
      };
      img.src = framePath(i + 1);
      images[i] = img;
    }

    let resizeRAF;
    const onResize = () => {
      cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(sizeCanvas);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(resizeRAF);
      headerTrigger.kill();
      gctx?.revert();
      images.forEach((img) => {
        if (img) img.onload = img.onerror = null;
      });
    };
  }, []);

  return (
    <>
      <Loader loaderRef={loaderRef} fillRef={fillRef} pctRef={pctRef} />
      <SiteHeader headerRef={headerRef} />
      <main id="top">
        <ScrollScene canvasRef={canvasRef} progressRef={progressRef} movementRef={movementRef} />
        <Outro yearRef={yearRef} />
      </main>
    </>
  );
}
