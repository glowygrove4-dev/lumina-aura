import * as THREE from "three";

/** Chapters 5 → 12 of the film, in scroll order. */
export const CHAPTERS = [
  "scent-trail",
  "glass-shatter",
  "light-tunnel",
  "perfume-aura",
  "micro-detail",
  "perfume-wave",
  "pedestal",
  "final-hero",
] as const;

export type ChapterId = (typeof CHAPTERS)[number];
export const CHAPTER_COUNT = CHAPTERS.length;

export const easeInOut = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

/** Anticipation + overshoot, settling back to 1. */
export const easeBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * A single continuous Bézier-like camera path (Catmull-Rom) across all
 * chapters — the camera never cuts, it only glides.
 */
export const CAMERA_PATH = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.55, 0.2, 4.2), // handoff from Showcase
    new THREE.Vector3(1.05, 0.28, 4.6), // scent trail
    new THREE.Vector3(0.2, 0.12, 4.4), // glass shatter
    new THREE.Vector3(-0.1, 0.05, 4.9), // light tunnel
    new THREE.Vector3(1.15, 0.5, 5.0), // aura
    new THREE.Vector3(0.42, 0.06, 2.6), // micro detail
    new THREE.Vector3(-1.05, 0.24, 4.7), // perfume wave
    new THREE.Vector3(1.35, 0.62, 5.2), // pedestal
    new THREE.Vector3(0.0, 0.14, 4.6), // final hero
  ],
  false,
  "catmullrom",
  0.4,
);

/** Per-chapter field of view (desktop); mobile adds a few degrees. */
export const CHAPTER_FOV = [22, 21, 21, 19, 13, 20, 20, 19];

/** Where the bottle rests during each chapter — it barely moves. */
export const CHAPTER_BOTTLE = [
  new THREE.Vector3(-0.1, 0.02, 0),
  new THREE.Vector3(0.0, 0.04, 0.35),
  new THREE.Vector3(0.0, 0.0, 0.1),
  new THREE.Vector3(0.05, 0.03, 0),
  new THREE.Vector3(0.0, 0.0, 0),
  new THREE.Vector3(-0.05, 0.03, 0),
  new THREE.Vector3(0.0, -0.12, 0),
  new THREE.Vector3(0.0, 0.0, 0),
];

export function fovFor(c: number, mobileBoost: number) {
  const f = clamp01(c) * (CHAPTER_COUNT - 1);
  const i = Math.min(CHAPTER_COUNT - 2, Math.floor(f));
  const t = easeInOut(f - i);
  return THREE.MathUtils.lerp(CHAPTER_FOV[i], CHAPTER_FOV[i + 1], t) + mobileBoost;
}

export function bottleTargetFor(c: number, out: THREE.Vector3) {
  const f = clamp01(c) * (CHAPTER_COUNT - 1);
  const i = Math.min(CHAPTER_COUNT - 2, Math.floor(f));
  const t = easeInOut(f - i);
  return out.lerpVectors(CHAPTER_BOTTLE[i], CHAPTER_BOTTLE[i + 1], t);
}

/** Fade weight for a scene that owns chapter `index`. */
export function chapterWeight(c: number, index: number) {
  const f = clamp01(c) * CHAPTER_COUNT;
  const d = Math.abs(f - (index + 0.5));
  return clamp01(1 - Math.max(0, d - 0.35) / 0.8);
}
