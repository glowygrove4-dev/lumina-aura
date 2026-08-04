import { motion } from "framer-motion";

const CHAPTERS = [
  {
    eyebrow: "Chapter 05",
    title: "The Scent Trail",
    body: "Turn the flacon and the air answers — ribbons of oud and amber unravel in slow, deliberate silk.",
  },
  {
    eyebrow: "Chapter 06",
    title: "Glass, Undone",
    body: "A wall of glass fractures without violence. Every fragment drifts, refracts, then dissolves into light.",
  },
  {
    eyebrow: "Chapter 07",
    title: "Light Tunnel",
    body: "Rings of warm light pulse past. The object holds still while the world accelerates around it.",
  },
  {
    eyebrow: "Chapter 08",
    title: "The Aura",
    body: "Rose, oud wood, amber crystal, jasmine, vanilla orchid and gold — six notes in quiet orbit.",
  },
  {
    eyebrow: "Chapter 09",
    title: "Micro Detail",
    body: "Closer. Embossed letterpress, brushed pewter, the faint tide of liquid behind obsidian glass.",
  },
  {
    eyebrow: "Chapter 10",
    title: "The Perfume Wave",
    body: "A single ribbon of scent wraps the bottle like water, leaving a trail that will not settle.",
  },
  {
    eyebrow: "Chapter 11",
    title: "The Pedestal",
    body: "Marble rises through the fog. A warm spotlight finds it. The film pauses, and lets you look.",
  },
  {
    eyebrow: "Chapter 12",
    title: "Worn After Dusk",
    body: "The story ends where it began — one flacon, numbered by hand, waiting in the dark.",
  },
];

/**
 * HTML chapters 5–12. Purely typographic panels that slide over the existing
 * persistent Canvas; the 3D bottle journey is driven by scroll progress
 * across this container.
 */
export function JourneyChapters() {
  return (
    <div id="journey-chapters" className="relative">
      {CHAPTERS.map((c, i) => (
        <section
          key={c.title}
          className="relative flex h-[130vh] items-center px-5 sm:px-6 md:px-16"
        >
          <div
            className={
              i % 2 === 0
                ? "relative z-20 ml-auto w-full max-w-md text-left md:mr-[6vw]"
                : "relative z-20 mr-auto w-full max-w-md text-left md:ml-[6vw]"
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-25%" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-[10px] uppercase tracking-[0.5em] text-accent">{c.eyebrow}</div>
              <div className="mt-4 h-px w-16 bg-accent opacity-40" />
              <h2 className="mt-7 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
                {c.title}
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </motion.div>
          </div>
        </section>
      ))}
    </div>
  );
}
