import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { Loader } from "@/components/Loader";
import { TiltCard } from "@/components/TiltCard";
import { Particles } from "@/components/Particles";
import heroVideo from "@/assets/hero.mp4.asset.json";
import perfumeImg from "@/assets/perfume.png.asset.json";

const BottleJourney = lazy(() =>
  import("@/components/BottleJourney").then((m) => ({ default: m.BottleJourney })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Riya Sheikh №001 — Eau de Parfum | Maison Sheikh" },
      { name: "description", content: "An olfactive study in shadow and gold. Discover Riya Sheikh №001, a cinematic eau de parfum from Maison Sheikh." },
      { property: "og:title", content: "Riya Sheikh №001 — Maison Sheikh" },
      { property: "og:description", content: "A cinematic eau de parfum. Oud, amber, and quiet obsession." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ThemeProvider>
      <Loader />
      <Cursor />
      <ThemeSwitcher />
      <Suspense fallback={null}>
        <BottleJourney />
      </Suspense>
      <SmoothScroll>
        <Nav />
        <Hero />
        <Trio />
        <Showcase />
        <Ingredients />
        <FinalCTA />
        <Footer />
      </SmoothScroll>
    </ThemeProvider>
  );
}

function Nav() {
  return (
    <header className="fixed left-0 top-0 z-40 flex w-full items-center justify-between px-5 py-5 sm:px-8 sm:py-6 md:px-14">
      <div className="text-[10px] uppercase tracking-[0.3em] sm:text-[11px] sm:tracking-[0.4em]">Maison Sheikh</div>
      <nav className="hidden gap-6 text-[11px] uppercase tracking-[0.3em] sm:flex md:gap-10">
        <a href="#trio" className="opacity-70 transition hover:opacity-100">Collection</a>
        <a href="#story" className="opacity-70 transition hover:opacity-100">Craft</a>
        <a href="#ingredients" className="opacity-70 transition hover:opacity-100">Notes</a>
      </nav>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.5, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-[110vh] w-full overflow-hidden">
      <motion.div style={{ scale, y, opacity }} className="absolute inset-0">
        <video
          src={heroVideo.url}
          autoPlay muted loop playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
      </motion.div>
      <div className="absolute inset-0"><Particles count={40} /></div>

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 flex h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.5em" }}
          transition={{ duration: 1.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-[10px] uppercase text-accent"
        >
          Chapter 001 — Nuit d'Onyx
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-balance mt-6 max-w-4xl font-display text-5xl leading-[0.95] sm:text-6xl md:text-[9rem]"
        >
          Riya <em className="italic opacity-80">Sheikh</em>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 0.75 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="mt-8 max-w-md text-sm leading-relaxed"
        >
          An olfactive study in shadow and gold. Bottled by hand in the atelier — worn only after dusk.
        </motion.p>
        <motion.a
          href="#trio" data-magnetic
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="mt-12 inline-flex items-center gap-3 border-b border-accent px-1 pb-2 text-[11px] uppercase tracking-[0.4em] text-accent transition hover:gap-5"
        >
          Enter the Maison <span>→</span>
        </motion.a>
      </motion.div>
    </section>
  );
}

function Trio() {
  const others = [
    { name: "Ambre Voilé", num: "№002", note: "Amber · Iris" },
    { name: "Cuir Nocturne", num: "№003", note: "Leather · Smoke" },
  ];
  return (
    <section id="trio" className="relative px-6 py-40 md:px-16">
      <div className="mx-auto max-w-6xl">
        <SectionLabel eyebrow="La Trilogie" title="Three chapters, one obsession." />
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <TiltCard>
            <BottleCard name={others[0].name} num={others[0].num} note={others[0].note} />
          </TiltCard>
          <TiltCard highlight className="md:-mt-10 md:mb-10">
            <div className="float">
              <BottleCard name="Riya Sheikh" num="№001" note="Oud · Amber · Vanilla" featured />
            </div>
          </TiltCard>
          <TiltCard>
            <BottleCard name={others[1].name} num={others[1].num} note={others[1].note} />
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

function BottleCard({ name, num, note, featured = false }: { name: string; num: string; note: string; featured?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative flex h-72 w-full items-center justify-center">
        <img
          src={perfumeImg.url}
          alt={name}
          className="max-h-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)] transition-opacity duration-300"
          style={{
            filter: featured ? "drop-shadow(0 0 40px var(--glow))" : undefined,
            opacity: featured ? "calc(1 - var(--bottle-handoff, 0))" : 1,
          }}
        />
      </div>
      <div className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{num}</div>
      <div className="mt-2 font-display text-3xl">{name}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{note}</div>
      {featured && (
        <button data-magnetic className="mt-6 border border-accent px-6 py-2.5 text-[10px] uppercase tracking-[0.4em] text-accent transition hover:bg-accent hover:text-accent-foreground">
          Discover
        </button>
      )}
    </div>
  );
}

function SectionLabel({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-[10px] uppercase tracking-[0.5em] text-accent">{eyebrow}</div>
      <div className="mt-4 h-px w-20 bg-accent opacity-50" />
      <h2 className="text-balance mt-8 max-w-3xl font-display text-5xl leading-tight md:text-7xl">{title}</h2>
    </div>
  );
}

function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <section id="story" ref={ref} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0">
          <Particles count={80} />
        </motion.div>

        {/* Left half reserved for the flying 3D bottle (rendered by global BottleJourney) */}
        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
          <div />
          <div className="relative z-40 flex items-center p-10 md:p-20">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md"
            >
              <div className="text-[10px] uppercase tracking-[0.5em] text-accent">The Object</div>
              <h2 className="mt-6 font-display text-5xl leading-tight md:text-6xl">
                Hand-cut in Grasse. Silent as ink.
              </h2>
              <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                Every flacon travels three months from the atelier — polished obsidian glass, brushed pewter,
                and a label letterpressed on cotton stock. Turn it in the light. It answers.
              </p>
              <div className="hairline mt-10" />
              <dl className="mt-8 grid grid-cols-2 gap-6 text-[11px] uppercase tracking-[0.3em]">
                <div><dt className="text-muted-foreground">Volume</dt><dd className="mt-2 font-display text-2xl normal-case tracking-normal">100 ml</dd></div>
                <div><dt className="text-muted-foreground">Concentration</dt><dd className="mt-2 font-display text-2xl normal-case tracking-normal">22%</dd></div>
                <div><dt className="text-muted-foreground">Family</dt><dd className="mt-2 font-display text-2xl normal-case tracking-normal">Oriental</dd></div>
                <div><dt className="text-muted-foreground">Longevity</dt><dd className="mt-2 font-display text-2xl normal-case tracking-normal">12 h</dd></div>
              </dl>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

const NOTES = [
  { name: "Oud", desc: "Cambodian, aged 12 years", icon: "◈" },
  { name: "Amber", desc: "Golden, resinous, animalic", icon: "☾" },
  { name: "Vanilla", desc: "Madagascar bourbon", icon: "❋" },
  { name: "Sandalwood", desc: "Mysore, creamy heart", icon: "▲" },
  { name: "Rose", desc: "Taif, first-press absolute", icon: "✦" },
  { name: "Citrus", desc: "Bergamot Calabria", icon: "◯" },
];

function Ingredients() {
  return (
    <section id="ingredients" className="relative px-6 py-40 md:px-16">
      <div className="mx-auto max-w-6xl">
        <SectionLabel eyebrow="Composition" title="Six notes. One long silence." />
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {NOTES.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <TiltCard>
                <div className="flex flex-col">
                  <div className="text-3xl text-accent" style={{ textShadow: "0 0 24px var(--glow)" }}>{n.icon}</div>
                  <div className="mt-6 font-display text-3xl">{n.name}</div>
                  <div className="mt-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{n.desc}</div>
                  <div className="hairline mt-8" />
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-40 md:py-56">
      <Particles count={60} />
      <div className="relative mx-auto max-w-4xl text-center">
        <motion.h2
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-balance font-display text-6xl leading-[0.95] md:text-[10rem]"
        >
          Worn by <em className="italic">few.</em>
        </motion.h2>
        <p className="mx-auto mt-10 max-w-md text-sm leading-relaxed text-muted-foreground">
          Available in limited edition of four hundred numbered flacons per season.
        </p>
        <button
          data-magnetic
          className="group relative mt-14 overflow-hidden border border-accent px-10 py-4 text-[11px] uppercase tracking-[0.4em] text-accent transition-all duration-500 hover:tracking-[0.5em]"
        >
          <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-700 group-hover:translate-x-0" />
          <span className="relative transition-colors duration-500 group-hover:text-accent-foreground">Discover Collection</span>
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-16 md:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">© Maison Sheikh — Paris · Grasse</div>
        <div className="flex gap-6 text-[11px] uppercase tracking-[0.3em]">
          {["Instagram", "Journal", "Contact"].map((l) => (
            <a key={l} href="#" className="opacity-60 transition hover:opacity-100 hover:text-accent">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}
