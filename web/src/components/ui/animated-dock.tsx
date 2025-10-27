"use client";

import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { cn } from "@/utils/cn";

type AnimatedDockItem = {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  variant?: "default" | "primary";
};

type AnimatedDockMenuProps = {
  items: AnimatedDockItem[];
  className?: string;
};

export function AnimatedDockMenu({ items, className }: AnimatedDockMenuProps) {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY);

  const baseGap = 96;

  const itemConfigs = useMemo(
    () =>
      items.map((item, index) => ({
        item,
        center: index * baseGap + baseGap / 2,
      })),
    [items],
  );

  return (
    <motion.div
      className={cn("relative flex items-center gap-6 px-2 py-1", className)}
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        mouseX.set(event.clientX - bounds.left);
      }}
      onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
    >
      {itemConfigs.map(({ item, center }) => (
        <AnimatedDockMenuItem key={item.id} item={item} center={center} mouseX={mouseX} />
      ))}
    </motion.div>
  );
}

type AnimatedDockMenuItemProps = {
  item: AnimatedDockItem;
  center: number;
  mouseX: MotionValue<number>;
};

function AnimatedDockMenuItem({ item, center, mouseX }: AnimatedDockMenuItemProps) {
  const distance = useTransform(mouseX, (value) => Math.abs(value - center));
  const scaleTransform = useTransform(distance, [0, 120, 260], [1.12, 1.04, 1]);
  const underlineScaleTransform = useTransform(distance, [0, 140, 260], [1, 0.5, 0]);
  const underlineOpacityTransform = useTransform(distance, [0, 140, 260], [1, 0.6, 0]);

  const scale = useSpring(scaleTransform, { stiffness: 260, damping: 30, mass: 0.5 });
  const underlineScale = useSpring(underlineScaleTransform, { stiffness: 260, damping: 32, mass: 0.5 });
  const underlineOpacity = useSpring(underlineOpacityTransform, { stiffness: 260, damping: 32, mass: 0.5 });

  const isPrimary = item.variant === "primary";
  const isActive = Boolean(item.active);

  const labelClass = cn(
    "relative z-10 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.3em] transition-colors duration-300",
    isPrimary
      ? "text-[var(--brand-2)]"
      : "text-gray-600 group-hover:text-gray-900",
    isActive && !isPrimary && "text-gray-900",
  );

  const highlightClass = cn(
    "absolute inset-x-2 -bottom-1 h-0.5 origin-center rounded-full",
    isPrimary
      ? "bg-gradient-to-r from-brand to-accent"
      : "bg-gray-900/80",
  );

  const contents = (
    <motion.div
      className="group relative flex items-center justify-center px-2 py-1.5"
      style={{ cursor: item.onClick || item.href ? "pointer" : "default" }}
    >
      <motion.span
        className={labelClass}
        style={{ scale }}
      >
        {item.label}
      </motion.span>
      <motion.span
        aria-hidden
        className={highlightClass}
        style={{
          opacity: isActive ? 1 : underlineOpacity,
          scaleX: isActive ? 1 : underlineScale,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.6 }}
      />
    </motion.div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="no-underline text-inherit">
        {contents}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className="no-underline bg-transparent p-0 border-0 text-inherit">
      {contents}
    </button>
  );
}

export default AnimatedDockMenu;
