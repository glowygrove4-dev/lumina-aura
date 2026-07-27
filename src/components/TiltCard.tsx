import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

export function TiltCard({
  children,
  className = "",
  highlight = false,
}: {
  children: ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 14 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }}
      className={`glass relative rounded-lg p-8 transition-shadow duration-700 ${
        highlight ? "shadow-[0_40px_120px_-20px_var(--glow)]" : ""
      } ${className}`}
    >
      {highlight && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg opacity-60"
          style={{ background: "radial-gradient(ellipse at top, var(--glow) 0%, transparent 60%)", mixBlendMode: "screen" }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
