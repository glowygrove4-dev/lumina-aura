import { create } from "zustand";

/**
 * One mutable frame object shared between the rAF scroll reader and the
 * render loop. Mutating a plain object (instead of setting React state every
 * frame) is what keeps the experience at 60 FPS.
 */
export type JourneyFrame = {
  /** Trio → Showcase progress (existing behaviour, untouched). */
  p: number;
  /** Chapters 5–12 progress, 0..1 across the chapter container. */
  c: number;
  /** Active chapter index (0 = Scent Trail … 7 = Final Hero). */
  chapter: number;
  /** Local progress inside the active chapter, 0..1. */
  chapterT: number;
  inChapters: boolean;
  /** Featured Trio card centre in screen px. */
  cardX: number;
  cardY: number;
  hasCard: boolean;
  /** Smoothed scroll velocity, roughly -1..1. */
  velocity: number;
  /** Normalised pointer, -1..1. */
  pointerX: number;
  pointerY: number;
};

export const journey: JourneyFrame = {
  p: 0,
  c: 0,
  chapter: 0,
  chapterT: 0,
  inChapters: false,
  cardX: 0,
  cardY: 0,
  hasCard: false,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
};

type JourneyStore = {
  chapter: number;
  active: boolean;
  setChapter: (chapter: number) => void;
  setActive: (active: boolean) => void;
};

export const useJourneyStore = create<JourneyStore>((set) => ({
  chapter: -1,
  active: false,
  setChapter: (chapter) => set((s) => (s.chapter === chapter ? s : { chapter })),
  setActive: (active) => set((s) => (s.active === active ? s : { active })),
}));
