// Single source of truth for "The Anatomy of a Product".
// Read by the site (panel timing, copy, HUD) and by scripts/frames/render.mjs
// (which shape is fully formed when), so frames and text can never drift.
//
// `hold` is the scroll-progress window (0 to 1) in which the chapter's shape
// is fully formed and its panel is on screen. Morphs happen in the gaps.

export const FRAME_COUNT = 1200;

export const SEQUENCES = {
  // Chosen by viewport aspect: portrait screens get their own framing.
  landscape: { dir: "/frames/landscape", width: 1280, height: 720 },
  portrait: { dir: "/frames/portrait", width: 720, height: 1280 },
};

export const framePath = (dir, i) => `${dir}/${String(i).padStart(4, "0")}.webp`;

export const HERO = {
  hold: [0, 0.05],
  eyebrow: "Kodexa · Software studio",
  title: ["The Anatomy", "of a Product"],
  sub: "Seven stages between a rough idea and software people use every day. Scroll to watch one take shape.",
};

export const CHAPTERS = [
  {
    id: "idea",
    side: "left",
    hold: [0.1, 0.2],
    kicker: "The Idea",
    title: ["It starts", "as a spark"],
    body: "One sentence about who it is for and what it changes for them. Everything we build later answers to it.",
    spec: [["Output", "A one-page brief"], ["Week", "01"]],
  },
  {
    id: "wireframe",
    side: "right",
    hold: [0.25, 0.36],
    kicker: "The Wireframe",
    title: ["Lines before", "colour"],
    body: "Boxes, labels and the order things happen in. Cheap to change, so we change it until it reads right on a phone.",
    spec: [["Output", "Clickable wireframes"], ["Week", "02"]],
  },
  {
    id: "design",
    side: "left",
    hold: [0.41, 0.52],
    kicker: "The Design",
    title: ["The skin", "goes on"],
    body: "Type, colour and spacing chosen for the brand, not for a template. Every screen, every state, empty and full.",
    spec: [["Output", "Design system + screens"], ["Weeks", "03 to 04"]],
  },
  {
    id: "code",
    side: "right",
    hold: [0.57, 0.67],
    kicker: "The Code",
    title: ["Written", "to last"],
    body: "Next.js, Postgres and rules kept in the database, so the numbers stay right when the team grows.",
    spec: [["Stack", "Next.js · Supabase · Vercel"], ["Weeks", "05 to 08"]],
  },
  {
    id: "launch",
    side: "left",
    hold: [0.72, 0.81],
    kicker: "The Launch",
    title: ["On every", "screen"],
    body: "Laptop, phone and the cheap tablet at the front desk. Tested on all of them before anyone outside sees it.",
    spec: [["Checked at", "360px to 1920px"], ["Week", "09"]],
  },
  {
    id: "growth",
    side: "right",
    hold: [0.86, 0.93],
    kicker: "The Growth",
    title: ["Then it", "earns its keep"],
    body: "Real usage decides what comes next. We measure, fix what slows people down and ship small, often.",
    spec: [["Cadence", "Weekly releases"], ["After", "Launch"]],
  },
  {
    id: "detail",
    side: "left",
    hold: [0.96, 1.0],
    kicker: "The Detail",
    title: ["One button,", "done properly"],
    body: "The pressed state, the loading state, the error nobody planned for. Products are judged at this size.",
    spec: [["Standard", "Every state designed"], ["Always", "On"]],
  },
];

// Fade length (progress units) for panels entering and leaving.
export const FADE = 0.025;
