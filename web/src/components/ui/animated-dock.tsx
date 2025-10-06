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

  const baseGap = 80;

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
      className={cn(
        "flex items-end gap-2 rounded-3xl border border-gray-200/60 bg-white/80 px-3 py-2 shadow-lg backdrop-blur",
        "supports-[backdrop-filter]:bg-white/60",
        className,
      )}
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
  const widthTransform = useTransform(distance, [0, 120, 240], [92, 76, 64]);
  const heightTransform = useTransform(distance, [0, 120, 240], [60, 54, 48]);
  const scaleTransform = useTransform(distance, [0, 120, 240], [1.1, 1.05, 1]);
  const labelOpacity = useTransform(distance, [0, 120, 240], [1, 0, 0]);
  const glowOpacity = useTransform(distance, [0, 120, 240], [0.55, 0.25, 0]);

  const width = useSpring(widthTransform, { stiffness: 300, damping: 35, mass: 0.6 });
  const height = useSpring(heightTransform, { stiffness: 300, damping: 35, mass: 0.6 });
  const scale = useSpring(scaleTransform, { stiffness: 260, damping: 30, mass: 0.5 });
  const label = useSpring(labelOpacity, { stiffness: 260, damping: 30 });
  const glow = useSpring(glowOpacity, { stiffness: 240, damping: 30 });

  const contents = (
    <motion.div
      className={cn(
        "group relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-3 py-2 transition-colors",
        item.variant === "primary"
          ? "text-emerald-700"
          : item.active
            ? "text-gray-900"
            : "text-gray-500 hover:text-gray-800",
      )}
      style={{ width, height }}
    >
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-emerald-200/30 via-emerald-400/20 to-emerald-500/10",
          item.variant === "primary" ? "opacity-80" : "opacity-0",
        )}
        style={{ opacity: item.variant === "primary" ? 0.9 : glow }}
        aria-hidden
      />
      {item.active && (
        <motion.div
          layoutId="dock-active"
          className="absolute inset-[1px] rounded-2xl border border-emerald-400/60"
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.4 }}
          aria-hidden
        />
      )}
      <motion.span className="relative z-10 flex items-center justify-center" style={{ scale }}>
        {item.icon}
      </motion.span>
      <motion.span
        className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-600"
        style={{ opacity: label }}
      >
        {item.label}
      </motion.span>
    </motion.div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="no-underline">
        {contents}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className="no-underline bg-transparent p-0 border-0">
      {contents}
    </button>
  );
}

export default AnimatedDockMenu;
