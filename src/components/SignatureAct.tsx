import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import modelImg from "@/assets/model-palm.png.asset.json";

/**
 * The signature act — begins immediately after Ingredients.
 *
 * One sticky stage, three beats, everything driven by scroll:
 *   1. The model appears, the flacon rests on her open palm.
 *   2. The flacon lifts, turns and travels through space.
 *   3. It settles onto dark marble while the camera circles it.
 *
 * The 3D object and camera live in the single persistent Canvas
 * (BottleJourney); this file only supplies the photographic layer, the
 * palm anchor and the editorial type.
 */

const BEATS = [
  {
    eyebrow: "Signature I",
    title: "Held, for a moment.",
    body: "Studio light, a black blazer, and one hundred millilitres of quiet obsession resting in an open palm.",
  },
  {
    eyebrow: "Signature II",
    title: "It lifts.",
    body: "The flacon leaves her hand without a sound — turning slowly, weightless, deliberate.",
  },
  {
    eyebrow: "Signature III",
    title: "Marble.",
    body: "Dark stone rises through the haze. The object arrives, and the room simply looks at it.",
  },
];

export function SignatureAct() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Very slow editorial push toward the model, then a gentle exit.
  const modelScale = useTransform(scrollYProgress, [0, 0.3, 0.6], [1.02, 1.1, 1.14]);
  const modelOpacity = useTransform(scrollYProgress, [0, 0.06, 0.3, 0.48], [0, 1, 1, 0]);
  const modelX = useTransform(scrollYProgress, [0, 0.48], ["0%", "6%"]);

  const t1 = useTransform(scrollYProgress, [0.02, 0.1, 0.26, 0.32], [0, 1, 1, 0]);
  const t2 = useTransform(scrollYProgress, [0.36, 0.44, 0.6, 0.66], [0, 1, 1, 0]);
  const t3 = useTransform(scrollYProgress, [0.74, 0.82, 0.96, 1], [0, 1, 1, 0.85]);

  return (
    <div id="journey-chapters" ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Soft charcoal gradient stage */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 60% 40%, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 70%)",
          }}
        />

        {/* Photographic layer — the model with the open palm. */}
        <motion.div
          style={{ scale: modelScale, opacity: modelOpacity, x: modelX }}
          className="absolute inset-y-0 left-1/2 z-10 aspect-[1097/1428] h-full -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0"
        >
          <img
            src={modelImg.url}
            alt="Model presenting the Riya Sheikh №001 flacon on an open palm"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {/* Blends the photograph into the page. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, var(--background) 0%, transparent 28%, transparent 78%, var(--background) 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, var(--background) 0%, transparent 22%, transparent 76%, var(--background) 100%)",
            }}
          />
          {/* The palm: the 3D flacon is positioned exactly here. */}
          <span
            id="palm-anchor"
            aria-hidden
            className="absolute block h-1 w-1"
            style={{ left: "19%", top: "62%" }}
          />
        </motion.div>

        {/* Editorial type, one beat at a time. */}
        <div className="pointer-events-none absolute inset-0 z-40 flex items-end px-5 pb-16 sm:px-8 sm:pb-20 md:items-center md:px-16 md:pb-0">
          <div className="relative w-full max-w-md">
            {BEATS.map((b, i) => (
              <motion.div
                key={b.title}
                style={{ opacity: [t1, t2, t3][i] }}
                className={i === 0 ? "relative" : "absolute inset-x-0 top-0"}
              >
                <div className="text-[10px] uppercase tracking-[0.5em] text-accent">{b.eyebrow}</div>
                <div className="mt-4 h-px w-16 bg-accent opacity-40" />
                <h2 className="mt-6 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
                  {b.title}
                </h2>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
