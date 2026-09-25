// Loads and draws an image sequence onto a canvas.
//
// - Progressive: frames arrive in passes (every 16th, then 8th, 4th, 2nd,
//   then all), so the whole scroll range is usable after the first pass and
//   detail fills in behind it.
// - Smooth: draw(position) takes a fractional frame and cross-fades the two
//   nearest loaded frames, so motion stays continuous between frames and
//   while later passes are still loading.

const PASSES = [16, 8, 4, 2, 1];

export class FrameSequence {
  constructor({ count, src, stride = 1, onProgress, onReady }) {
    this.count = count;
    this.src = src;
    this.stride = stride;
    this.images = new Array(count);
    this.loaded = new Uint8Array(count);
    this.onProgress = onProgress;
    this.onReady = onReady;
    this.cancelled = false;
  }

  // Load order: pass by pass, skipping frames already queued.
  order() {
    const seen = new Uint8Array(this.count);
    const list = [];
    for (const step of PASSES) {
      const s = Math.max(step, this.stride);
      for (let i = 0; i < this.count; i += s) if (!seen[i]) { seen[i] = 1; list.push(i); }
      if (!seen[this.count - 1]) { seen[this.count - 1] = 1; list.push(this.count - 1); }
    }
    return list;
  }

  load(concurrency = 6) {
    const queue = this.order();
    const firstPass = Math.ceil(this.count / Math.max(PASSES[0], this.stride)) + 1;
    const total = queue.length;
    let done = 0;
    let ready = false;

    const next = () => {
      if (this.cancelled || !queue.length) return;
      const i = queue.shift();
      const img = new Image();
      img.decoding = "async";
      img.onload = img.onerror = () => {
        if (this.cancelled) return;
        if (img.naturalWidth) {
          this.images[i] = img;
          this.loaded[i] = 1;
        }
        done++;
        this.onProgress?.(done / total);
        if (!ready && done >= Math.min(firstPass, total)) {
          ready = true;
          this.onReady?.();
        }
        next();
      };
      img.src = this.src(i);
    };
    for (let k = 0; k < concurrency; k++) next();
  }

  cancel() {
    this.cancelled = true;
  }

  nearest(i, dir) {
    for (let k = i; k >= 0 && k < this.count; k += dir) if (this.loaded[k]) return k;
    return -1;
  }

  // position: fractional frame index, 0 to count - 1
  draw(ctx, position, background) {
    const { width: cw, height: ch } = ctx.canvas;
    const base = Math.floor(position);
    let a = this.nearest(base, -1);
    let b = this.nearest(Math.min(this.count - 1, base + 1), 1);
    if (a < 0) a = b;
    if (b < 0) b = a;
    if (a < 0) return false;

    ctx.globalAlpha = 1;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, cw, ch);
    this.cover(ctx, this.images[a], cw, ch);
    const mix = b > a ? (position - a) / (b - a) : 0;
    if (mix > 0.01) {
      ctx.globalAlpha = mix;
      this.cover(ctx, this.images[b], cw, ch);
      ctx.globalAlpha = 1;
    }
    return true;
  }

  cover(ctx, img, cw, ch) {
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }
}
