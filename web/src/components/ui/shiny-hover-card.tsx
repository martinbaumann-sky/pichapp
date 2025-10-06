"use client";

import { ReactNode, useCallback } from "react";
import type { MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/utils/cn";

type ShinyHoverCardProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
};

export function ShinyHoverCard({ children, className, intensity = 0.35 }: ShinyHoverCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const opacity = useSpring(0, { stiffness: 260, damping: 30 });

  const background = useMotionTemplate`radial-gradient(200px circle at ${mouseX}px ${mouseY}px, rgba(16, 185, 129, ${intensity}) 0%, rgba(16, 185, 129, 0) 70%)`;

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      mouseX.set(event.clientX - bounds.left);
      mouseY.set(event.clientY - bounds.top);
      opacity.set(1);
    },
    [mouseX, mouseY, opacity],
  );

  const handleMouseLeave = useCallback(() => {
    opacity.set(0);
  }, [opacity]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative overflow-hidden transition-transform duration-500 ease-out will-change-transform",
        "hover:-translate-y-1",
        className,
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background, opacity }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default ShinyHoverCard;
