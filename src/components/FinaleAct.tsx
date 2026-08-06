import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * The finale — concentric rings of warm light expand around the flacon while
 * the object itself holds the centre of the frame and turns a full 360°.
 * The 3D object lives in the single persistent Canvas (BottleJourney);
 * this file supplies the ring tunnel, the type, and the centre anchor.
 */

const RINGS = Array.from({ length: 9 }, (_, i) => i);

export function FinaleAct() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const tunnelScale = useTransform(scrollYProgress, [0, 1], [0.9, 1.45]);
  const tunnelRotate = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const tunnelOpacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.08, 0.2, 0.8, 0.95], [0, 1, 1, 0]);

  return (
    <div id="finale-act" ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Ring tunnel */}
        <motion.div
          aria-hidden
          style={{ scale: tunnelScale, rotate: tunnelRotate, opacity: tunnelOpacity }}
          className="absolute left-1/2 top-1/2 aspect-square w-[130vmax] -translate-x-1/2 -translate-y-1/2"
        >
          {RINGS.map((i) => (
            <span
              key={i}
              className="absolute inset-0 rounded-full"
              style={{
                transform: `scale(${0.18 + i * 0.1})`,
                border: `${i % 2 === 0 ? 2.5 : 1.25}px solid ${
                  i % 3 === 0 ? "var(--accent)" : "var(--foreground)"
                }`,
                boxShadow: i % 3 === 0 ? "0 0 40px color-mix(in oklab, var(--accent) 30%, transparent)" : "none",
                opacity: 0.3 + (i % 3) * 0.16,
                animation: `finale-pulse ${7 + i * 1.3}s ease-in-out infinite`,
              }}
            />
          ))}
        </motion.div>

        {/* Centre anchor — the 3D flacon is placed exactly here. */}
        <span
          id="finale-anchor"
          aria-hidden
          className="absolute left-1/2 top-1/2 block h-1 w-1 -translate-x-1/2 -translate-y-1/2"
        />

        {/* Editorial type */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-14 z-40 px-6 text-center sm:bottom-20"
        >
          <div className="text-[10px] uppercase tracking-[0.5em] text-accent">Finale</div>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
            The object, turning.
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Rings of warm light pulse past. It holds still while the world accelerates around it.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
