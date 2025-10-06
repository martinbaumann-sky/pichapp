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
        "flex items-center gap-3 rounded-[28px] border border-gray-200/70 bg-white/90 px-4 py-2.5 shadow-xl backdrop-blur",
        "supports-[backdrop-filter]:bg-white/70",
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

  const background = isActive
    ? "linear-gradient(135deg, rgba(11,143,61,0.16), rgba(11,143,61,0.07))"
    : isPrimary
      ? "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(241,245,249,0.88))"
      : "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.86))";

  const borderColor = isActive
    ? "rgba(11, 143, 61, 0.6)"
    : isPrimary
      ? "rgba(203, 213, 225, 0.85)"
      : "rgba(226, 232, 240, 0.78)";

  const shadow = isActive
    ? "0 18px 36px -24px rgba(15, 23, 42, 0.45)"
    : isPrimary
      ? "0 12px 30px -26px rgba(15, 23, 42, 0.32)"
      : "0 10px 26px -28px rgba(15, 23, 42, 0.24)";

  const iconColor = isActive
    ? "text-[var(--brand-2)]"
    : isPrimary
      ? "text-slate-600 group-hover:text-[var(--brand-2)]"
      : "text-gray-500 group-hover:text-gray-700";

  const labelColor = isActive
    ? "text-[var(--brand-2)]"
    : isPrimary
      ? "text-slate-600 group-hover:text-[var(--brand-2)]"
      : "text-gray-600 group-hover:text-gray-800";

  const contents = (
    <motion.div
      className={cn(
        "group relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border px-3.5 py-2 transition-colors",
        "backdrop-blur-sm",
        isActive ? "bg-white" : "bg-white/90",
      )}
      style={{
        width,
        height,
        borderColor,
        background,
        boxShadow: shadow,
      }}
    >
      {isActive && (
        <motion.div
          layoutId="dock-active"
          className="absolute inset-[1px] rounded-2xl"
          style={{
            border: "1.5px solid rgba(11, 143, 61, 0.6)",
            boxShadow: "0 12px 32px -24px rgba(15, 23, 42, 0.4)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.4 }}
          aria-hidden
        />
      )}
      <motion.span
        className={cn(
          "relative z-10 flex items-center justify-center transition-colors duration-300",
          iconColor,
        )}
        style={{ scale }}
      >
        {item.icon}
      </motion.span>
      <motion.span
        className={cn(
          "relative z-10 text-[11px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap transition-colors duration-300",
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
