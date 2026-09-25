// "The Anatomy of a Product": particle scene rendered to frames by render.mjs.
// Runs in the browser (headless Chromium). Every shape is built in code from
// primitives below, so every frame is original to Kodexa.
//
// The timeline comes from app/_lib/chapters.js: while scroll progress is inside
// a chapter's `hold` window its shape is fully formed (with a slow drift);
// between holds, particles morph from one shape to the next.

import * as THREE from "three";
import { HERO, CHAPTERS } from "/app/_lib/chapters.js";

const params = new URLSearchParams(location.search);
const WIDTH = +params.get("w") || 1600;
const HEIGHT = +params.get("h") || 900;
const FRAMES = +params.get("frames") || 1200;
const P = +params.get("particles") || 45000;
const QUALITY = +params.get("q") || 0.65;
const PORTRAIT = HEIGHT > WIDTH;

/* ---------- palette ------------------------------------------------ */
const hex = (h) => {
  const c = new THREE.Color(h);
  return [c.r, c.g, c.b];
};
const INK = hex("#efebe3");
const DIM = hex("#8d8a84");
const FAINT = hex("#4a4946");
const EMBER = hex("#e8743b");
const EMBER_SOFT = hex("#f2a878");
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* ---------- deterministic randomness ------------------------------- */
const hash = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const r1 = (i) => hash(i * 3 + 0.1);
const r2 = (i) => hash(i * 3 + 1.7);
const r3 = (i) => hash(i * 3 + 2.3);
// R2 low-discrepancy sequence: even fills without clumps
const R2 = (j) => [(0.5 + j * 0.7548776662) % 1, (0.5 + j * 0.569840291) % 1];

/* ---------- 2D samplers (return [x, y]) ---------------------------- */
function polyline(points, closed = false) {
  const pts = closed ? [...points, points[0]] : points;
  const segs = [];
  let total = 0;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, ay] = pts[k];
    const [bx, by] = pts[k + 1];
    const len = Math.hypot(bx - ax, by - ay);
    segs.push({ ax, ay, bx, by, len, start: total });
    total += len;
  }
  return (j, n, i) => {
    const d = ((j + 0.5 * r1(i)) / n) * total;
    let s = segs[segs.length - 1];
    for (const seg of segs) if (d <= seg.start + seg.len) { s = seg; break; }
    const t = s.len ? (d - s.start) / s.len : 0;
    const jit = (r2(i) - 0.5) * 0.012;
    const nx = s.len ? -(s.by - s.ay) / s.len : 0;
    const ny = s.len ? (s.bx - s.ax) / s.len : 0;
    return [s.ax + (s.bx - s.ax) * t + nx * jit, s.ay + (s.by - s.ay) * t + ny * jit];
  };
}

function roundRectPoints(cx, cy, w, h, r, seg = 6) {
  const pts = [];
  const corners = [
    [cx + w / 2 - r, cy + h / 2 - r, 0],
    [cx - w / 2 + r, cy + h / 2 - r, Math.PI / 2],
    [cx - w / 2 + r, cy - h / 2 + r, Math.PI],
    [cx + w / 2 - r, cy - h / 2 + r, (3 * Math.PI) / 2],
  ];
  for (const [x, y, a0] of corners)
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (k / seg) * (Math.PI / 2);
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
  return pts;
}

const rectOutline = (cx, cy, w, h, r = 0) =>
  polyline(r ? roundRectPoints(cx, cy, w, h, r) : [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], true);

const line = (x1, y1, x2, y2) => polyline([[x1, y1], [x2, y2]]);

const circleOutline = (cx, cy, r) =>
  polyline(Array.from({ length: 48 }, (_, k) => [cx + Math.cos((k / 48) * Math.PI * 2) * r, cy + Math.sin((k / 48) * Math.PI * 2) * r]), true);

function fillRect(cx, cy, w, h, r = 0) {
  return (j) => {
    const [u, v] = R2(j);
    let x = (u - 0.5) * w;
    let y = (v - 0.5) * h;
    if (r) {
      // pull points outside a rounded corner back onto the arc
      const qx = Math.abs(x) - (w / 2 - r);
      const qy = Math.abs(y) - (h / 2 - r);
      if (qx > 0 && qy > 0) {
        const d = Math.hypot(qx, qy);
        if (d > r) {
          x = Math.sign(x) * (w / 2 - r + (qx / d) * r * 0.98);
          y = Math.sign(y) * (h / 2 - r + (qy / d) * r * 0.98);
        }
      }
    }
    return [cx + x, cy + y];
  };
}

function fillDisc(cx, cy, r) {
  return (j) => {
    const [u, v] = R2(j);
    const rr = r * Math.sqrt(u);
    return [cx + Math.cos(v * Math.PI * 2) * rr, cy + Math.sin(v * Math.PI * 2) * rr];
  };
}

function fillTriangle(a, b, c) {
  return (j) => {
    let [u, v] = R2(j);
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    return [a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v];
  };
}

// several samplers as one part, split by weight
function multi(list) {
  const total = list.reduce((s, [w]) => s + w, 0);
  return (j, n, i) => {
    let acc = 0;
    const u = (j + 0.5) / n;
    for (const [w, fn] of list) {
      const share = w / total;
      if (u <= acc + share || fn === list[list.length - 1][1]) {
        const nn = Math.max(1, Math.round(n * share));
        const jj = Math.min(nn - 1, Math.floor(((u - acc) / share) * nn));
        return fn(jj, nn, i);
      }
      acc += share;
    }
    return [0, 0];
  };
}

/* ---------- 3D placement ------------------------------------------- */
// Lift a 2D sampler onto a plane: origin + x * U + y * V
const onPlane = (fn, o = [0, 0, 0], U = [1, 0, 0], V = [0, 1, 0], s = 1) => (j, n, i) => {
  const [x, y] = fn(j, n, i);
  return [o[0] + (U[0] * x + V[0] * y) * s, o[1] + (U[1] * x + V[1] * y) * s, o[2] + (U[2] * x + V[2] * y) * s];
};
const flat = (fn, z = 0) => onPlane(fn, [0, 0, z]);

function sphereSurface(r, c = [0, 0, 0]) {
  return (j, n) => {
    const y = 1 - (2 * (j + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y);
    const th = j * 2.399963229728653;
    return [c[0] + Math.cos(th) * rad * r, c[1] + y * r, c[2] + Math.sin(th) * rad * r];
  };
}

function ball(r, c = [0, 0, 0]) {
  return (j, n, i) => {
    const u = r1(i), v = r2(i), w = r3(i);
    const th = u * Math.PI * 2;
    const ph = Math.acos(2 * v - 1);
    const rr = r * Math.cbrt(w);
    return [c[0] + rr * Math.sin(ph) * Math.cos(th), c[1] + rr * Math.cos(ph), c[2] + rr * Math.sin(ph) * Math.sin(th)];
  };
}

function ring(r, tiltX, tiltZ, c = [0, 0, 0]) {
  return (j, n, i) => {
    const a = ((j + r1(i) * 0.5) / n) * Math.PI * 2;
    let x = Math.cos(a) * r, y = 0, z = Math.sin(a) * r;
    // tilt around X then Z
    [y, z] = [y * Math.cos(tiltX) - z * Math.sin(tiltX), y * Math.sin(tiltX) + z * Math.cos(tiltX)];
    [x, y] = [x * Math.cos(tiltZ) - y * Math.sin(tiltZ), x * Math.sin(tiltZ) + y * Math.cos(tiltZ)];
    return [c[0] + x, c[1] + y, c[2] + z];
  };
}

function boxSurface(cx, cy, cz, w, h, d) {
  const faces = [
    [w * h, (u, v) => [cx + (u - 0.5) * w, cy + (v - 0.5) * h, cz + d / 2]],
    [w * h, (u, v) => [cx + (u - 0.5) * w, cy + (v - 0.5) * h, cz - d / 2]],
    [d * h, (u, v) => [cx + w / 2, cy + (v - 0.5) * h, cz + (u - 0.5) * d]],
    [d * h, (u, v) => [cx - w / 2, cy + (v - 0.5) * h, cz + (u - 0.5) * d]],
    [w * d, (u, v) => [cx + (u - 0.5) * w, cy + h / 2, cz + (v - 0.5) * d]],
  ];
  const total = faces.reduce((s, [a]) => s + a, 0);
  return (j, n, i) => {
    let pick = r1(i) * total;
    let f = faces[0][1];
    for (const [a, fn] of faces) { if (pick <= a) { f = fn; break; } pick -= a; }
    const [u, v] = R2(j);
    return f(u, v);
  };
}

function dust(rMin, rMax, flatten = 0.55, zShift = -2) {
  return (j, n, i) => {
    const th = r1(i) * Math.PI * 2;
    const ph = Math.acos(2 * r2(i) - 1);
    const rr = rMin + (rMax - rMin) * Math.pow(r3(i), 0.7);
    return [rr * Math.sin(ph) * Math.cos(th), rr * Math.cos(ph) * flatten, rr * Math.sin(ph) * Math.sin(th) + zShift];
  };
}

/* ---------- shape assembly ----------------------------------------- */
// A part: { w: weight, at: (j, n, i) => [x,y,z], color, size, alpha }
function makeShape(parts) {
  const pos = new Float32Array(P * 3);
  const col = new Float32Array(P * 3);
  const size = new Float32Array(P);
  const alpha = new Float32Array(P);
  const total = parts.reduce((s, p) => s + p.w, 0);
  let idx = 0;
  parts.forEach((part, k) => {
    const n = k === parts.length - 1 ? P - idx : Math.round((P * part.w) / total);
    for (let j = 0; j < n && idx < P; j++, idx++) {
      const [x, y, z] = part.at(j, n, idx);
      pos[idx * 3] = x;
      pos[idx * 3 + 1] = y;
      pos[idx * 3 + 2] = z;
      const c = typeof part.color === "function" ? part.color(x, y, z, idx) : part.color;
      col[idx * 3] = c[0];
      col[idx * 3 + 1] = c[1];
      col[idx * 3 + 2] = c[2];
      size[idx] = part.size * (0.75 + 0.5 * hash(idx + 0.37));
      alpha[idx] = typeof part.alpha === "function" ? part.alpha(x, y, z, idx) : part.alpha ?? 1;
    }
  });
  return { pos, col, size, alpha };
}

const ambient = (w = 8) => ({ w, at: dust(5, 11), color: (x, y, z, i) => (r1(i) > 0.93 ? EMBER : DIM), size: 0.03, alpha: 0.28 });

/* ---------- the web page layout (wireframe / design / code) -------- */
// A 6.4 x 4 browser window centred on the origin.
const WIN = { w: 6.4, h: 4 };
const L = {
  frame: rectOutline(0, 0, WIN.w, WIN.h, 0.14),
  topbar: line(-3.2, 1.62, 3.2, 1.62),
  dots: multi([[1, circleOutline(-2.95, 1.81, 0.045)], [1, circleOutline(-2.8, 1.81, 0.045)], [1, circleOutline(-2.65, 1.81, 0.045)]]),
  url: rectOutline(0, 1.81, 2.6, 0.17, 0.08),
  logo: rectOutline(-2.6, 1.33, 0.5, 0.16),
  nav: multi([0.9, 1.4, 1.9, 2.4].map((x) => [1, line(x, 1.33, x + 0.34, 1.33)])),
  titles: [[-1.55, 0.78, 2.6], [-1.75, 0.46, 2.2], [-2.05, 0.14, 1.6]],
  subs: [[-1.65, -0.18, 2.4], [-1.9, -0.32, 1.9]],
  button: [-2.2, -0.7, 1.3, 0.32],
  image: [1.55, 0.25, 2.75, 1.95],
  cards: [-2.07, 0, 2.07].map((x) => [x, -1.38, 1.9, 0.8]),
};

function wireframeParts() {
  const [ix, iy, iw, ih] = L.image;
  const [bx, by, bw, bh] = L.button;
  return [
    { w: 9, at: flat(L.frame), color: INK, size: 0.032, alpha: 0.9 },
    { w: 3, at: flat(L.topbar), color: DIM, size: 0.028, alpha: 0.8 },
    { w: 1, at: flat(L.dots), color: EMBER, size: 0.03, alpha: 0.9 },
    { w: 2.4, at: flat(L.url), color: DIM, size: 0.026, alpha: 0.7 },
    { w: 1.2, at: flat(L.logo), color: INK, size: 0.028, alpha: 0.9 },
    { w: 1.4, at: flat(L.nav), color: DIM, size: 0.026, alpha: 0.8 },
    { w: 7, at: flat(multi(L.titles.map(([x, y, w]) => [w, rectOutline(x, y, w, 0.2)]))), color: INK, size: 0.028, alpha: 0.85 },
    { w: 2.2, at: flat(multi(L.subs.map(([x, y, w]) => [w, line(x - w / 2, y, x + w / 2, y)]))), color: DIM, size: 0.026, alpha: 0.75 },
    { w: 2.6, at: flat(rectOutline(bx, by, bw, bh, 0.16)), color: EMBER, size: 0.03, alpha: 0.95 },
    {
      w: 9,
      at: flat(multi([[3, rectOutline(ix, iy, iw, ih)], [1.6, line(ix - iw / 2, iy - ih / 2, ix + iw / 2, iy + ih / 2)], [1.6, line(ix - iw / 2, iy + ih / 2, ix + iw / 2, iy - ih / 2)]])),
      color: INK,
      size: 0.028,
      alpha: 0.8,
    },
    { w: 9, at: flat(multi(L.cards.map(([x, y, w, h]) => [1, rectOutline(x, y, w, h, 0.06)]))), color: DIM, size: 0.028, alpha: 0.85 },
    {
      w: 10,
      at: (j, n, i) => {
        // dot grid behind the page
        const cols = 49, rows = 33;
        const cell = j % (cols * rows);
        return [((cell % cols) - (cols - 1) / 2) * 0.25 + (r1(i) - 0.5) * 0.01, (Math.floor(cell / cols) - (rows - 1) / 2) * 0.25, -0.6];
      },
      color: FAINT,
      size: 0.024,
      alpha: 0.5,
    },
    ambient(6),
  ];
}

function designParts(place = flat, scale = 1) {
  const [ix, iy, iw, ih] = L.image;
  const [bx, by, bw, bh] = L.button;
  const S = (w) => w * scale;
  return [
    { w: S(9), at: place(L.frame), color: DIM, size: 0.03, alpha: 0.7 },
    { w: S(3), at: place(L.topbar), color: FAINT, size: 0.028, alpha: 0.8 },
    { w: S(1), at: place(L.dots), color: EMBER, size: 0.03, alpha: 0.9 },
    { w: S(2.4), at: place(fillRect(0, 1.81, 2.6, 0.17, 0.08)), color: FAINT, size: 0.026, alpha: 0.5 },
    { w: S(1.2), at: place(fillRect(-2.6, 1.33, 0.5, 0.16)), color: EMBER, size: 0.028, alpha: 0.8 },
    { w: S(1.4), at: place(L.nav), color: DIM, size: 0.026, alpha: 0.8 },
    { w: S(9), at: place(multi(L.titles.map(([x, y, w]) => [w, fillRect(x, y, w, 0.2)]))), color: INK, size: 0.028, alpha: 0.75 },
    { w: S(2.2), at: place(multi(L.subs.map(([x, y, w]) => [w, fillRect(x, y, w, 0.06)]))), color: DIM, size: 0.024, alpha: 0.6 },
    { w: S(3.4), at: place(fillRect(bx, by, bw, bh, 0.16)), color: EMBER, size: 0.03, alpha: 0.7 },
    {
      w: S(12),
      at: place(multi([[5, fillRect(ix, iy, iw, ih, 0.08)], [1.2, fillDisc(ix + 0.55, iy + 0.35, 0.36)]])),
      color: (x, y) => {
        const t = Math.min(1, Math.max(0, (y - (iy - ih / 2)) / ih));
        return mixC(EMBER, FAINT, t * 0.9);
      },
      size: 0.028,
      alpha: (x, y) => 0.5 + 0.45 * Math.max(0, 1 - Math.hypot(x - ix - 0.55, y - iy - 0.35) * 1.4),
    },
    {
      w: S(9),
      at: place(multi(L.cards.flatMap(([x, y, w, h]) => [[3, fillRect(x, y, w, h, 0.06)], [0.5, fillRect(x - 0.3, y + 0.18, w * 0.55, 0.08)]]))),
      color: (x, y) => (Math.abs(y - (L.cards[0][1] + 0.18)) < 0.05 ? INK : FAINT),
      size: 0.026,
      alpha: 0.6,
    },
  ];
}

function codeParts() {
  // An editor in the same window: tabs, gutter and 19 lines of "code".
  const tokens = [];
  const lineY = (k) => 1.1 - k * 0.15;
  const kinds = [EMBER, EMBER_SOFT, INK, DIM];
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const indents = [0, 1, 1, 2, 2, 2, 1, 2, 3, 3, 2, 1, 0, 0, 1, 1, 2, 1, 0];
  indents.forEach((ind, k) => {
    let x = -2.55 + ind * 0.32;
    const count = 2 + Math.floor(rnd() * 5);
    for (let t = 0; t < count && x < 2.9; t++) {
      const w = 0.12 + rnd() * 0.55;
      tokens.push([x + w / 2, lineY(k), w, t === 0 && rnd() > 0.4 ? 0 : 1 + Math.floor(rnd() * 3)]);
      x += w + 0.08;
    }
  });
  const byKind = (kind) => multi(tokens.filter((t) => t[3] === kind).map(([x, y, w]) => [w, fillRect(x, y, w, 0.07)]));
  return [
    { w: 9, at: flat(L.frame), color: DIM, size: 0.03, alpha: 0.8 },
    { w: 3, at: flat(L.topbar), color: FAINT, size: 0.028, alpha: 0.8 },
    { w: 1, at: flat(L.dots), color: EMBER, size: 0.03, alpha: 0.9 },
    { w: 3, at: flat(multi([[1, rectOutline(-2.4, 1.4, 1.1, 0.24)], [1, rectOutline(-1.25, 1.4, 1.1, 0.24)], [1, rectOutline(-0.1, 1.4, 1.1, 0.24)]])), color: DIM, size: 0.026, alpha: 0.7 },
    { w: 2.5, at: flat(multi(indents.map((_, k) => [1, fillRect(-2.95, lineY(k), 0.12, 0.05)]))), color: FAINT, size: 0.024, alpha: 0.8 },
    { w: 1.2, at: flat(line(-2.78, 1.2, -2.78, -1.85)), color: FAINT, size: 0.022, alpha: 0.7 },
    { w: 6, at: flat(byKind(0)), color: EMBER, size: 0.026, alpha: 0.75 },
    { w: 5, at: flat(byKind(1)), color: EMBER_SOFT, size: 0.026, alpha: 0.6 },
    { w: 10, at: flat(byKind(2)), color: INK, size: 0.026, alpha: 0.6 },
    { w: 6, at: flat(byKind(3)), color: DIM, size: 0.026, alpha: 0.6 },
    { w: 0.8, at: flat(fillRect(tokens[40][0] + tokens[40][2] / 2 + 0.06, tokens[40][1], 0.025, 0.16)), color: EMBER, size: 0.03, alpha: 1 },
    { w: 9, at: dust(3.5, 6, 0.8, -3), color: (x, y, z, i) => kinds[i % 4], size: 0.028, alpha: 0.22 },
    ambient(6),
  ];
}

/* ---------- the eight shapes ---------------------------------------- */
function heroShape() {
  return makeShape([
    {
      w: 70,
      at: (j, n, i) => {
        // a wide, shallow drift of dust with a loose spiral in it
        // an edge-on spiral disc of dust, thicker near the middle
        const a = r1(i) * Math.PI * 2 + Math.pow(r2(i), 0.5) * 5;
        const rr = 0.3 + 7.5 * Math.pow(r2(i), 0.9);
        const thick = 0.12 + 0.9 * Math.exp(-rr * 0.45);
        return [Math.cos(a) * rr * 1.35, (r3(i) - 0.5) * thick * 2 + Math.cos(a) * rr * 0.1, Math.sin(a) * rr * 0.55 - 2.5];
      },
      color: (x, y, z, i) => (r3(i + 5) > 0.82 ? EMBER : r3(i + 9) > 0.55 ? DIM : INK),
      size: 0.04,
      alpha: (x, y, z, i) => 0.3 + 0.6 * r1(i + 3),
    },
    { w: 30, at: dust(3, 12, 0.6, -4), color: (x, y, z, i) => (r1(i) > 0.9 ? EMBER : DIM), size: 0.034, alpha: 0.4 },
  ]);
}

function ideaShape() {
  return makeShape([
    { w: 14, at: ball(0.55), color: (x, y, z) => mixC(INK, EMBER_SOFT, Math.min(1, Math.hypot(x, y, z) / 0.55)), size: 0.03, alpha: 0.55 },
    { w: 16, at: sphereSurface(0.95), color: INK, size: 0.026, alpha: 0.7 },
    { w: 8, at: ring(1.45, 1.2, 0.3), color: EMBER, size: 0.026, alpha: 0.8 },
    { w: 8, at: ring(1.85, 1.35, -0.45), color: DIM, size: 0.026, alpha: 0.8 },
    { w: 8, at: ring(2.35, 1.1, 0.9), color: EMBER_SOFT, size: 0.026, alpha: 0.55 },
    { w: 14, at: dust(1.1, 3.2, 1, 0), color: (x, y, z, i) => (r1(i) > 0.8 ? EMBER : DIM), size: 0.024, alpha: 0.4 },
    ambient(32),
  ]);
}

const wireframeShape = () => makeShape(wireframeParts());
const designShape = () => makeShape([...designParts(), { w: 10, at: dust(3.5, 7, 0.7, -3), color: FAINT, size: 0.026, alpha: 0.35 }, ambient(8)]);
const codeShape = () => makeShape(codeParts());

function launchShape() {
  // A laptop with the designed page on its screen, and a phone beside it.
  const base = [-0.7, -1.25, 0.3];
  const hingeZ = base[2] - 1.35;
  const tilt = 0.2;
  const U = [1, 0, 0];
  const V = [0, Math.cos(tilt), -Math.sin(tilt)];
  const screenScale = 0.63;
  const screenCenter = [base[0], base[1] + 0.08 + (WIN.h / 2) * screenScale * Math.cos(tilt), hingeZ - (WIN.h / 2) * screenScale * Math.sin(tilt)];
  const onScreen = (fn) => onPlane(fn, screenCenter, U, V, screenScale);

  const phoneC = [2.55, -0.2, 0.9];
  const pa = -0.35;
  const PU = [Math.cos(pa), 0, Math.sin(pa)];
  const onPhone = (fn) => onPlane(fn, phoneC, PU, [0, 1, 0], 1);

  return makeShape([
    ...designParts(onScreen, 0.55),
    { w: 4, at: onScreen(rectOutline(0, 0, WIN.w + 0.3, WIN.h + 0.3, 0.2)), color: INK, size: 0.028, alpha: 0.85 },
    { w: 9, at: boxSurface(base[0], base[1], base[2] - 0.05, 4.4, 0.1, 2.75), color: DIM, size: 0.028, alpha: 0.7 },
    {
      w: 4,
      at: (j, n, i) => {
        const cols = 26, rows = 9;
        const cell = j % (cols * rows);
        return [base[0] - 1.75 + (cell % cols) * 0.14, base[1] + 0.07, base[2] - 0.95 + Math.floor(cell / cols) * 0.14 + (r1(i) - 0.5) * 0.004];
      },
      color: DIM,
      size: 0.03,
      alpha: 0.9,
    },
    { w: 1.2, at: onPlane(rectOutline(0, 0, 1.3, 0.8, 0.08), [base[0], base[1] + 0.06, base[2] + 0.75], [1, 0, 0], [0, 0, 1]), color: DIM, size: 0.024, alpha: 0.8 },
    { w: 5, at: onPhone(rectOutline(0, 0, 1.05, 2.1, 0.16)), color: INK, size: 0.028, alpha: 0.9 },
    { w: 1.5, at: onPhone(fillRect(0, 0.62, 0.8, 0.5, 0.05)), color: EMBER, size: 0.026, alpha: 0.55 },
    { w: 2.2, at: onPhone(multi([[1, fillRect(-0.08, 0.2, 0.64, 0.08)], [1, fillRect(-0.16, 0.05, 0.48, 0.08)], [0.8, fillRect(0, -0.12, 0.8, 0.04)]])), color: INK, size: 0.024, alpha: 0.6 },
    { w: 1, at: onPhone(fillRect(-0.12, -0.35, 0.5, 0.16, 0.08)), color: EMBER, size: 0.026, alpha: 0.8 },
    { w: 2.5, at: onPhone(multi([[1, fillRect(0, -0.62, 0.8, 0.26, 0.04)], [1, fillRect(0, -0.92, 0.8, 0.26, 0.04)]])), color: FAINT, size: 0.024, alpha: 0.7 },
    {
      w: 8,
      at: (j, n, i) => {
        // floor reflection band under both devices
        const [u, v] = R2(j);
        return [(u - 0.5) * 9, base[1] - 0.12, (v - 0.5) * 5 + 0.2];
      },
      color: FAINT,
      size: 0.022,
      alpha: (x, y, z) => 0.35 * Math.max(0, 1 - Math.hypot(x / 4.5, (z - 0.2) / 2.5)),
    },
    ambient(12),
  ]);
}

function growthShape() {
  const floorY = -1.4;
  const bars = Array.from({ length: 11 }, (_, k) => {
    const h = Math.min(3.3, 0.28 * Math.pow(1.3, k));
    return { x: -3.1 + k * 0.62, h };
  });
  const curve = polyline(bars.map((b) => [b.x, floorY + b.h + 0.28]));
  return makeShape([
    {
      w: 34,
      at: multi(bars.map((b) => [b.h * 1.8 + 0.3, boxSurface(b.x, floorY + b.h / 2, 0, 0.36, b.h, 0.36)])),
      color: (x, y) => mixC(DIM, EMBER, Math.min(1, Math.max(0, (y - floorY) / 3.3))),
      size: 0.028,
      alpha: 0.72,
    },
    { w: 8, at: (j, n, i) => { const [x, y] = curve(j, n, i); return [x, y, 0]; }, color: EMBER_SOFT, size: 0.032, alpha: 0.95 },
    {
      w: 2,
      at: (j, n, i) => {
        const last = bars[bars.length - 1];
        const [x, y] = fillTriangle([last.x + 0.08, floorY + last.h + 0.55], [last.x - 0.22, floorY + last.h + 0.2], [last.x + 0.3, floorY + last.h + 0.18])(j, n, i);
        return [x, y, 0];
      },
      color: EMBER_SOFT,
      size: 0.03,
      alpha: 0.9,
    },
    {
      w: 14,
      at: (j, n, i) => {
        const cols = 41, rows = 21;
        const cell = j % (cols * rows);
        return [((cell % cols) - 20) * 0.2, floorY, (Math.floor(cell / cols) - 10) * 0.2 + (r1(i) - 0.5) * 0.01];
      },
      color: FAINT,
      size: 0.024,
      alpha: (x, y, z) => 0.7 * Math.max(0, 1 - Math.hypot(x / 4.2, z / 2.2)),
    },
    {
      w: 12,
      at: (j, n, i) => [(r1(i) - 0.5) * 7, floorY + Math.pow(r2(i), 1.6) * 4.5, (r3(i) - 0.5) * 3],
      color: (x, y, z, i) => (r1(i + 2) > 0.6 ? EMBER : DIM),
      size: 0.022,
      alpha: 0.35,
    },
    ambient(22),
  ]);
}

function detailShape() {
  // A pressed button: fill, label, outline, ripple rings and the pointer.
  const cx = 1.05, cy = -0.28;
  const arrow = [
    [0, 0], [0, -1.05], [0.26, -0.8], [0.46, -1.22], [0.62, -1.15], [0.42, -0.74], [0.78, -0.74],
  ].map(([x, y]) => [cx + x, cy + y]);
  return makeShape([
    { w: 26, at: flat(fillRect(0, 0, 4.6, 1.4, 0.7)), color: (x) => mixC(EMBER, EMBER_SOFT, (x + 2.3) / 4.6), size: 0.03, alpha: 0.42 },
    { w: 4, at: flat(fillRect(-0.3, 0, 1.9, 0.18), 0.02), color: INK, size: 0.028, alpha: 0.8 },
    { w: 1.5, at: flat(fillTriangle([1.0, 0.13], [1.0, -0.13], [1.22, 0])), color: INK, size: 0.028, alpha: 0.8 },
    { w: 8, at: flat(rectOutline(0, 0, 4.9, 1.7, 0.85)), color: INK, size: 0.028, alpha: 0.85 },
    { w: 6, at: flat(circleOutline(cx, cy, 0.55)), color: EMBER_SOFT, size: 0.026, alpha: 0.8 },
    { w: 7, at: flat(circleOutline(cx, cy, 1.05)), color: EMBER_SOFT, size: 0.026, alpha: 0.5 },
    { w: 8, at: flat(circleOutline(cx, cy, 1.7)), color: DIM, size: 0.026, alpha: 0.35 },
    { w: 8, at: flat(multi([[3, fillTriangle(arrow[0], arrow[1], arrow[6])], [1.2, fillTriangle(arrow[2], arrow[3], arrow[5])], [1, fillTriangle(arrow[3], arrow[4], arrow[5])]]), 0.35), color: INK, size: 0.028, alpha: 0.75 },
    { w: 4, at: flat(polyline(arrow, true), 0.36), color: INK, size: 0.028, alpha: 1 },
    ambient(28),
  ]);
}

const SHAPES = [heroShape(), ideaShape(), wireframeShape(), designShape(), codeShape(), launchShape(), growthShape(), detailShape()];

/* ---------- camera per shape ---------------------------------------- */
// target, direction from target to camera, subject size [w, h] to frame
const CAMS = [
  { target: [0, -0.35, -2.5], dir: [0, 0.1, 1], size: [10, 4.2] },
  { target: [0, 0, 0], dir: [0.18, 0.12, 1], size: [5.2, 5.2] },
  { target: [0, 0, 0], dir: [-0.12, 0.05, 1], size: [7, 4.6] },
  { target: [0, 0, 0], dir: [0.1, -0.04, 1], size: [7, 4.6] },
  { target: [0, 0, 0], dir: [-0.55, 0.12, 1], size: [7, 4.6] },
  { target: [0.25, -0.35, 0], dir: [0.45, 0.3, 1], size: [6.2, 3.5] },
  { target: [0, 0.1, 0], dir: [-0.45, 0.28, 1], size: [7.6, 5] },
  { target: [0.3, -0.1, 0], dir: [0.3, -0.12, 1], size: [6.2, 3.6] },
];
// Which side the text panel sits on, so the subject moves the other way.
const SIDES = ["center", ...CHAPTERS.map((c) => c.side)];
const HOLDS = [HERO.hold, ...CHAPTERS.map((c) => c.hold)];

/* ---------- three.js setup ------------------------------------------ */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0x0b0b0d, 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const FOV = 38;
const camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, 0.05, 100);

const geo = new THREE.BufferGeometry();
const aPos = new Float32Array(P * 3);
const aCol = new Float32Array(P * 3);
const aSize = new Float32Array(P);
const aAlpha = new Float32Array(P);
geo.setAttribute("position", new THREE.BufferAttribute(aPos, 3));
geo.setAttribute("color", new THREE.BufferAttribute(aCol, 3));
geo.setAttribute("size", new THREE.BufferAttribute(aSize, 1));
geo.setAttribute("alpha", new THREE.BufferAttribute(aAlpha, 1));

const material = new THREE.ShaderMaterial({
  uniforms: { uScale: { value: HEIGHT / (2 * Math.tan((FOV * Math.PI) / 360)) } },
  vertexShader: `
    attribute vec3 color; attribute float size; attribute float alpha;
    uniform float uScale;
    varying vec3 vColor; varying float vAlpha;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mv;
      float ps = size * uScale / -mv.z;
      gl_PointSize = max(ps, 1.2);
      vAlpha = alpha * clamp(ps * ps / 1.44, 0.0, 1.0);
      vColor = color;
    }`,
  fragmentShader: `
    varying vec3 vColor; varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = exp(-d * d * 16.0) - 0.018;
      if (a <= 0.0) discard;
      gl_FragColor = vec4(vColor * a * vAlpha, 1.0);
    }`,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  depthTest: false,
  transparent: true,
});
scene.add(new THREE.Points(geo, material));

/* ---------- per-particle motion seeds -------------------------------- */
const dirs = new Float32Array(P * 3);
const delay = new Float32Array(P);
const phase = new Float32Array(P);
for (let i = 0; i < P; i++) {
  const th = r1(i + 101) * Math.PI * 2;
  const ph = Math.acos(2 * r2(i + 101) - 1);
  dirs[i * 3] = Math.sin(ph) * Math.cos(th);
  dirs[i * 3 + 1] = Math.cos(ph);
  dirs[i * 3 + 2] = Math.sin(ph) * Math.sin(th);
  delay[i] = r3(i + 101);
  phase[i] = r1(i + 207) * Math.PI * 2;
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Where on the timeline are we: shape a, shape b and the morph amount.
function locate(p) {
  for (let k = 0; k < HOLDS.length; k++) {
    const [s, e] = HOLDS[k];
    if (p >= s && p <= e) return { a: k, b: k, m: 0, hold: (p - s) / Math.max(1e-6, e - s) };
    const next = HOLDS[k + 1];
    if (next && p > e && p < next[0]) return { a: k, b: k + 1, m: (p - e) / (next[0] - e), hold: 0 };
  }
  return { a: HOLDS.length - 1, b: HOLDS.length - 1, m: 0, hold: 1 };
}

function camFor(k) {
  const c = CAMS[k];
  const side = SIDES[k];
  // leave room for the text panel: 40% of the width on landscape,
  // the lower 45% of the height on portrait
  const usableW = PORTRAIT ? 0.92 : side === "center" ? 0.9 : 0.58;
  const usableH = PORTRAIT ? (side === "center" ? 0.8 : 0.5) : 0.84;
  const shiftX = PORTRAIT || side === "center" ? 0 : side === "left" ? 0.19 : -0.19;
  const shiftY = PORTRAIT && side !== "center" ? 0.2 : 0;
  return { ...c, usableW, usableH, shiftX, shiftY };
}

function frame(f) {
  const p = f / (FRAMES - 1);
  const { a, b, m, hold } = locate(p);
  const A = SHAPES[a];
  const B = SHAPES[b];
  const time = p * 90;
  const spread = 0.45;

  for (let i = 0; i < P; i++) {
    const t = easeInOut(clamp01((m - delay[i] * spread) / (1 - spread)));
    const swirl = Math.sin(Math.PI * t) * (0.5 + 0.9 * delay[i]);
    const i3 = i * 3;
    const wob = 0.018;
    for (let c = 0; c < 3; c++) {
      aPos[i3 + c] = lerp(A.pos[i3 + c], B.pos[i3 + c], t) + dirs[i3 + c] * swirl + Math.sin(time * (0.7 + 0.2 * c) + phase[i] + c * 2.1) * wob;
      aCol[i3 + c] = lerp(A.col[i3 + c], B.col[i3 + c], t);
    }
    aSize[i] = lerp(A.size[i], B.size[i], t) * (1 + swirl * 0.25);
    aAlpha[i] = lerp(A.alpha[i], B.alpha[i], t);
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
  geo.attributes.size.needsUpdate = true;
  geo.attributes.alpha.needsUpdate = true;

  // camera: eased blend between the two shapes' framings, plus a slow orbit
  const ca = camFor(a);
  const cb = camFor(b);
  const e = easeInOut(m);
  const target = lerp3(ca.target, cb.target, e);
  const dir = new THREE.Vector3(...lerp3(ca.dir, cb.dir, e)).normalize();
  const orbit = (a === b ? hold - 0.5 : 0) * 0.16 + Math.sin(p * Math.PI * 6) * 0.015;
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), orbit);
  const w = lerp(ca.size[0] / ca.usableW, cb.size[0] / cb.usableW, e);
  const h = lerp(ca.size[1] / ca.usableH, cb.size[1] / cb.usableH, e);
  const tanH = Math.tan((FOV * Math.PI) / 360);
  const dist = Math.max(h / 2 / tanH, w / 2 / (tanH * (WIDTH / HEIGHT))) * (1 - (a === b ? hold : 0) * 0.04);
  camera.position.set(target[0] + dir.x * dist, target[1] + dir.y * dist, target[2] + dir.z * dist);
  camera.lookAt(...target);
  const sx = lerp(ca.shiftX, cb.shiftX, e);
  const sy = lerp(ca.shiftY, cb.shiftY, e);
  camera.setViewOffset(WIDTH, HEIGHT, -sx * WIDTH, sy * HEIGHT, WIDTH, HEIGHT);
  camera.updateProjectionMatrix();

  renderer.render(scene, camera);
  return renderer.domElement.toDataURL("image/webp", QUALITY);
}

window.renderFrame = frame;
window.sceneReady = true;
