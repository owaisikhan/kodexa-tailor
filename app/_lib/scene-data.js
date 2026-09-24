// Content and timing for the scroll scene, taken 1:1 from the original.

export const FRAME_COUNT = 535;

export const framePath = (i) =>
  `/assets/frames/frame_${String(i).padStart(5, "0")}.webp`;

// Frames loaded before the experience starts (the rest keep streaming in).
export const START_BUFFER = 60;

// Each editorial panel: [fadeIn start, fadeOut start] as scroll fractions.
//   01 Foundation  shirt        ~0.11-0.22
//   02 Waistcoat   vest+tie     ~0.22-0.37
//   03 Canvas      jacket       ~0.37-0.55
//   04 Cut         full suit    ~0.55-0.64
//   05 Man         worn / cuff  ~0.64-0.78
//   06 Procession  colour walk  ~0.78-0.92
//   07 Detail      macro cuff   ~0.92-1.00
export const CUES = [
  [0.115, 0.205],
  [0.235, 0.355],
  [0.385, 0.535],
  [0.56, 0.635],
  [0.66, 0.765],
  [0.79, 0.905],
  [0.925, 0.995],
];

export const FADE = 0.035;

export const PANELS = [
  { side: "left", kicker: "The Foundation", title: ["A Shirt of", "Pure Cotton"], spec: ["Cloth", "Egyptian Two-Ply Poplin · 120s"] },
  {
    side: "right",
    kicker: "The Waistcoat",
    title: ["Structure,", "Held Close"],
    body: "The waistcoat draws the line of the body inward. Five buttons, a silk-backed rear, and a tie cut on the bias so the knot falls true and never twists.",
    spec: ["Silk", "Mulberry, Woven in Como"],
  },
  { side: "left", kicker: "The Canvas", title: ["Built on", "Full Canvas"], spec: ["Construction", "Hand-Padded Full Canvas"] },
  { side: "right", kicker: "The Cut", title: ["The Complete", "Silhouette"], spec: ["Cloth", "Super 150's Merino · 240g"] },
  { side: "left", kicker: "The Man", title: ["Made", "to Be Worn"], spec: ["Fit", "Individually Made to Measure"] },
  { side: "right", kicker: "The Procession", title: ["A Language", "of Colour"], spec: ["Palette", "Four Signature Tones"] },
  {
    side: "left",
    kicker: "The Detail",
    title: ["The Last", "Quarter-Inch"],
    body: "Functioning surgeon's cuffs. Horn buttons, each hand-shanked. Pick-stitching you will only ever find by touch.",
    spec: ["Finish", "Working Surgeon's Cuffs"],
  },
];

export const FOOTER_COLUMNS = [
  { heading: "Atelier", links: ["The House", "Full Canvas", "The Cloth Library"] },
  { heading: "Wardrobe", links: ["Suits", "Shirting", "Accessories"] },
  { heading: "Visit", links: ["Mayfair · London", "By Appointment", "Contact"] },
];
