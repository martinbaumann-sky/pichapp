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
  const animateHomeToExplore = prevPath.current === "/" && pathname === "/explorar";
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        className="flex-1"
        initial={animateHomeToExplore ? { x: 60, opacity: 0 } : { opacity: 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ opacity: 1 }}
        transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}


