"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = { children: React.ReactNode };

export default function RouteTransition({ children }: Props) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  useEffect(() => {
    prevPath.current = pathname;
  }, [pathname]);
  // Mejor detección de dirección basada en un orden de rutas: si la ruta no está en la lista se hace fade
  const routeOrder = ["/", "/explorar", "/matches", "/crear", "/organizar", "/perfil", "/dashboard"];
  const prevIndex = prevPath.current ? routeOrder.indexOf(prevPath.current) : -1;
  const currIndex = pathname ? routeOrder.indexOf(pathname) : -1;
  const direction = prevIndex === -1 || currIndex === -1 ? 0 : currIndex > prevIndex ? 1 : currIndex < prevIndex ? -1 : 0;

  const pageVariants = {
    initial: (d: number) => ({
      x: d === 0 ? 0 : d > 0 ? 36 : -36,
      y: 18,
      opacity: 0,
      scale: 0.985,
      filter: "blur(12px)",
    }),
    animate: { x: 0, y: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: (d: number) => ({
      x: d === 0 ? 0 : d > 0 ? -24 : 24,
      y: -12,
      opacity: 0,
      scale: 0.985,
      filter: "blur(8px)",
    }),
  };

  const pageTransition = {
    duration: 0.48,
    ease: [0.18, 0.84, 0.42, 1],
  };

  return (
    <div className="relative flex-1">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {/* subtle crossfade layer to smooth repaints */}
        <motion.div
          key={pathname}
          className="relative z-10 flex-1"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          custom={direction}
          transition={pageTransition}
          style={{ willChange: "transform, opacity, filter" }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950/40" aria-hidden />
          <main className="relative z-10 flex-1">{children}</main>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


