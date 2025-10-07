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

  const baseGap = 112;

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
        "relative flex items-center gap-1.5 rounded-[30px] border border-white/30 bg-white/60 px-3.5 py-2.5 shadow-[0_20px_55px_-40px_rgba(15,23,42,0.65)] backdrop-blur-2xl",
        "supports-[backdrop-filter]:bg-white/35",
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
  const widthTransform = useTransform(distance, [0, 140, 280], [118, 100, 84]);
  const heightTransform = useTransform(distance, [0, 140, 280], [60, 56, 52]);
  const scaleTransform = useTransform(distance, [0, 120, 240], [1.1, 1.05, 1]);
  const labelOpacity = useTransform(distance, [0, 120, 240], [1, 0, 0]);
  const width = useSpring(widthTransform, { stiffness: 300, damping: 35, mass: 0.6 });
  const height = useSpring(heightTransform, { stiffness: 300, damping: 35, mass: 0.6 });
  const scale = useSpring(scaleTransform, { stiffness: 260, damping: 30, mass: 0.5 });
  const label = useSpring(labelOpacity, { stiffness: 260, damping: 30 });

  const isPrimary = item.variant === "primary";
  const isActive = Boolean(item.active);

  const iconColor = isActive
    ? "text-[var(--brand-2)]"
    : isPrimary
      ? "text-slate-600 group-hover:text-[var(--brand-2)]"
      : "text-slate-500 group-hover:text-slate-700";

  const labelColor = isActive
    ? "text-gray-900"
    : isPrimary
      ? "text-slate-600 group-hover:text-gray-900"
      : "text-slate-500 group-hover:text-gray-800";

  const baseBackground = isPrimary
    ? "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(236,244,255,0.58))"
    : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.52))";

  const contents = (
    <motion.div
      className={cn(
        "group relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-3.5 py-2",
        "backdrop-blur-sm",
      )}
      style={{
        width,
        height,
      }}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 z-0 rounded-2xl opacity-90 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          pointerEvents: "none",
          background: baseBackground,
          border: "1px solid rgba(255, 255, 255, 0.35)",
          boxShadow: "0 18px 46px -36px rgba(15, 23, 42, 0.45)",
        }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      />
      {isActive && (
        <motion.div
          layoutId="dock-active"
          className="absolute inset-0 z-10 rounded-2xl"
          style={{
            pointerEvents: "none",
            background: "linear-gradient(135deg, rgba(11,143,61,0.24), rgba(11,143,61,0.1))",
            boxShadow: "0 24px 52px -30px rgba(11, 143, 61, 0.45)",
          }}
          transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.5 }}
          aria-hidden
        />
      )}
      <motion.span
        className={cn(
          "relative z-20 flex items-center justify-center transition-colors duration-300",
          iconColor,
        )}
        style={{ scale }}
      >
        {item.icon}
      </motion.span>
      <motion.span
        className={cn(
          "relative z-20 text-[11px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap transition-colors duration-300",
          labelColor,
        )}
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
