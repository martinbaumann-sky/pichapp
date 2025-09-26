"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Home, Bell } from "lucide-react"
import { GearIcon, PersonIcon } from "@radix-ui/react-icons"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Home",
    href: "#",
    gradient: "radial-gradient(circle, rgba(0,105,137,0.18) 0%, rgba(0,105,137,0.08) 45%, rgba(0,105,137,0) 100%)",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    label: "Notifications",
    href: "#",
    gradient: "radial-gradient(circle, rgba(0,105,137,0.18) 0%, rgba(0,105,137,0.08) 45%, rgba(0,105,137,0) 100%)",
  },
  {
    icon: <GearIcon className="h-5 w-5" />,
    label: "Settings",
    href: "#",
    gradient: "radial-gradient(circle, rgba(0,105,137,0.18) 0%, rgba(0,105,137,0.08) 45%, rgba(0,105,137,0) 100%)",
  },
  {
    icon: <PersonIcon className="h-5 w-5" />,
    label: "Profile",
    href: "#",
    gradient: "radial-gradient(circle, rgba(0,105,137,0.18) 0%, rgba(0,105,137,0.08) 45%, rgba(0,105,137,0) 100%)",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export function MenuBar() {
  return (
    <motion.nav
      className="relative overflow-hidden rounded-2xl border border-[color:var(--border)]/60 bg-[color:var(--surface)]/80 p-2 shadow-[0_12px_30px_rgba(0,72,92,0.12)] backdrop-blur-lg"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className="pointer-events-none absolute -inset-2 z-0 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(0,105,137,0.25),transparent_70%)] opacity-0"
        variants={navGlowVariants}
      />
      <ul className="flex items-center gap-2 relative z-10">
        {menuItems.map((item, index) => (
          <motion.li key={item.label} className="relative">
            <motion.div
              className="block rounded-xl overflow-visible group relative"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                variants={glowVariants}
                style={{
                  background: item.gradient,
                  opacity: 0,
                  borderRadius: "16px",
                }}
              />
              <motion.a
                href={item.href}
                className="relative z-10 flex items-center gap-2 rounded-xl bg-transparent px-4 py-2 text-[color:var(--fg-muted)] transition-colors group-hover:text-[color:var(--fg)]"
                variants={itemVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
              >
                <span className="text-[color:var(--fg-muted)] transition-colors duration-300 group-hover:text-[color:var(--brand-1)]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </motion.a>
              <motion.a
                href={item.href}
                className="absolute inset-0 z-10 flex items-center gap-2 rounded-xl bg-transparent px-4 py-2 text-[color:var(--fg-muted)] transition-colors group-hover:text-[color:var(--fg)]"
                variants={backVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
              >
                <span className="text-[color:var(--fg-muted)] transition-colors duration-300 group-hover:text-[color:var(--brand-1)]">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </motion.a>
            </motion.div>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  )
}
