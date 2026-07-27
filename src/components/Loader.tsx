import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Loader() {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) { p = 100; clearInterval(id); setTimeout(() => setDone(true), 600); }
      setProgress(p);
    }, 120);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
        >
          <motion.div
            className="text-[11px] uppercase tracking-[0.5em] text-muted-foreground"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          >
            Maison Sheikh
          </motion.div>
          <div className="mt-8 h-px w-64 overflow-hidden bg-border">
            <motion.div className="h-full bg-accent" animate={{ width: `${progress}%` }} transition={{ ease: "easeOut" }} />
          </div>
          <div className="mt-4 font-display text-3xl tabular-nums">{Math.floor(progress)}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
