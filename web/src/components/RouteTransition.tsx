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
      x: d === 1 ? 120 : d === -1 ? -120 : 0,
      opacity: d === 0 ? 0.98 : 0,
      scale: 1,
    }),
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d === 1 ? -80 : d === -1 ? 80 : 0, opacity: 0, scale: 0.999 }),
  };

  return (
    <div className="relative flex-1">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        {/* subtle crossfade layer to smooth repaints */}
        <motion.div
          key={`${pathname}-fade`}
          className="pointer-events-none absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.36, 0.99] }}
        />

        <motion.main
          key={pathname}
          className="flex-1 relative z-10"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          custom={direction}
          transition={{ duration: 0.36, ease: [0.22, 0.8, 0.36, 0.99] }}
          style={{ willChange: "transform, opacity" }}
        >
          {children}
        </motion.main>

        {/* no extra overlay to avoid leaving painted remnants */}
      </AnimatePresence>
    </div>
  );
}


