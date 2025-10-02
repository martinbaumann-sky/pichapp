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

  // Orden de rutas para inferir dirección del desplazamiento
  const routeOrder = ["/", "/explorar", "/matches", "/crear", "/organizar", "/perfil", "/dashboard"];
  const prevIndex = prevPath.current ? routeOrder.indexOf(prevPath.current) : -1;
  const currIndex = pathname ? routeOrder.indexOf(pathname) : -1;
  const direction = prevIndex === -1 || currIndex === -1 ? 0 : currIndex > prevIndex ? 1 : currIndex < prevIndex ? -1 : 0;

  const ease = [0.22, 1, 0.36, 1] as const;

  const pageVariants = {
    initial: (d: number) => ({
      opacity: 0,
      y: d === 0 ? 32 : d > 0 ? 36 : -36,
      x: d === 0 ? 0 : d > 0 ? 12 : -12,
      scale: 0.985,
      filter: "blur(18px)",
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (d: number) => ({
      opacity: 0,
      y: d === 0 ? -28 : d > 0 ? -32 : 32,
      x: d === 0 ? 0 : d > 0 ? -8 : 8,
      scale: 1.015,
      filter: "blur(18px)",
    }),
  };

  const backdropVariants = {
    initial: {
      opacity: 0,
      scale: 0.96,
      filter: "blur(24px)",
    },
    animate: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      scale: 1.04,
      filter: "blur(28px)",
    },
  };

  const transition = {
    duration: 0.65,
    ease,
  };

  return (
    <div className="relative isolate flex-1 overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={pathname}
          className="relative z-10 flex h-full flex-1"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          custom={direction}
          transition={transition}
          style={{ willChange: "transform, opacity, filter" }}
        >
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            variants={backdropVariants}
            transition={transition}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white/75 to-emerald-50/70" />
            <div className="absolute inset-0 bg-[radial-gradient(600px_280px_at_15%_0%,rgba(59,130,246,0.12),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(560px_320px_at_85%_100%,rgba(16,185,129,0.14),transparent_75%)]" />
          </motion.div>
          <main className="relative z-10 flex-1">{children}</main>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


