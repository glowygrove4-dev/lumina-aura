import * as THREE from "three";

/**
 * The signature act, after Ingredients — three chapters, one continuous shot.
 * 0 In Her Hand · 1 The Lift · 2 The Pedestal
 */
export const CHAPTERS = ["in-her-hand", "the-lift", "the-pedestal"] as const;

export type ChapterId = (typeof CHAPTERS)[number];
export const CHAPTER_COUNT = CHAPTERS.length;

export const easeInOut = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export const easeInOutSlow = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Scroll windows of the act (all in 0..1 of the container). */
export const HOLD_END = 0.3; // bottle rests in the palm
export const LIFT_END = 0.72; // bottle has landed on the marble

/** Where the bottle rests once it has landed. */
export const PEDESTAL_TOP = new THREE.Vector3(0, -0.2, 0);

/** Quadratic Bézier — no straight lines, ever. */
export function bezier3(
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  t: number,
  out: THREE.Vector3,
) {
  const u = 1 - t;
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  );
  return out;
}

/** Fade weight for a scene that owns chapter `index`. */
export function chapterWeight(c: number, index: number) {
  const f = clamp01(c) * CHAPTER_COUNT;
  const d = Math.abs(f - (index + 0.5));
  return clamp01(1 - Math.max(0, d - 0.35) / 0.8);
}
