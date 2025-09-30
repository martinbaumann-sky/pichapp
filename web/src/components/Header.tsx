"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  User as UserIcon,
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Bell,
  Loader2,
  RefreshCw,
  X,
  CalendarDays,
  MessageSquare,
  MapPin,
  MoreVertical,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import AuthDialog from "./AuthDialog";
import { useAuth, resolveUserRole } from "@/hooks/useAuth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

type NavItem = { href: string; label: string };
type ActionLink = { href: string; label: string; variant: "primary" | "secondary" };
type MenuLink = { href: string; label: string; icon: LucideIcon };

export default function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const resolvedRole = resolveUserRole(user);
  const isSuperAdmin = resolvedRole === "superadmin";
  const isVenueAccount = resolvedRole === "venue_admin";
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authNext, setAuthNext] = useState<string | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup">("login");
  const {
    items: notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
    markAsSeen,
  } = useNotifications(Boolean(user));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "pichapp-role-message";
    const stored = window.sessionStorage.getItem(key);
    if (stored) {
      setRoleMessage(stored);
      window.sessionStorage.removeItem(key);
    }
  }, []);

  useEffect(() => {
    if (!roleMessage) return;
    const timeout = window.setTimeout(() => setRoleMessage(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [roleMessage]);

  const navItems = useMemo<NavItem[]>(() => {
    if (!user) {
      return [
        { href: "/explorar", label: "Explorar" },
        { href: "/ayuda", label: "Ayuda" },
      ];
    }
    if (isVenueAccount) {
      return [
        { href: "/panel/cancha/partidos/nuevo", label: "Crear partido" },
        { href: "/panel/cancha/partidos", label: "Mis partidos" },
        { href: "/panel/cancha", label: "Panel general" },
        { href: "/ayuda", label: "Soporte" },
      ];
    }
    const items: NavItem[] = [
      { href: "/explorar", label: "Explorar" },
      { href: "/amigos", label: "Amigos" },
      { href: "/dashboard", label: "Mi actividad" },
      { href: "/ayuda", label: "Ayuda" },
    ];
    if (isSuperAdmin) {
      items.splice(3, 0, { href: "/panel/cancha", label: "Panel canchas" });
    }
    return items;
  }, [isSuperAdmin, isVenueAccount, user]);

  const primaryAction = useMemo<ActionLink | null>(() => {
    if (isVenueAccount) {
      return { href: "/panel/cancha/partidos/nuevo", label: "Crear partido", variant: "primary" };
    }
    if (!user) return null;
    if (resolvedRole === "player" || isSuperAdmin) {
      return { href: "/crear", label: "Crear pichanga", variant: "primary" };
    }
    return null;
  }, [isVenueAccount, isSuperAdmin, resolvedRole, user]);

  const secondaryAction = useMemo<ActionLink | null>(() => {
    if (isVenueAccount) return null;
    return { href: "/cancha", label: user ? "Registrar mi cancha" : "Soy cancha", variant: "secondary" };
  }, [isVenueAccount, user]);

  const menuLinks = useMemo<MenuLink[]>(() => {
    if (!user) return [];
    if (isVenueAccount) {
      return [
        { href: "/panel/cancha?tab=settings", label: "Datos de la cancha", icon: Settings },
        { href: "/panel/cancha/partidos", label: "Mis partidos", icon: CalendarDays },
        { href: "/panel/cancha", label: "Panel general", icon: LayoutDashboard },
        { href: "/perfil", label: "Perfil", icon: UserCircle },
      ];
    }
    const links: MenuLink[] = [
      { href: "/dashboard", label: "Mi actividad", icon: LayoutDashboard },
      { href: "/reservas", label: "Reservas", icon: CalendarDays },
      { href: "/mensajes", label: "Mensajes", icon: MessageSquare },
      { href: "/amigos", label: "Amigos", icon: Users },
      { href: "/perfil", label: "Perfil", icon: UserCircle },
    ];
    if (isSuperAdmin) {
      links.splice(1, 0, { href: "/panel/cancha", label: "Panel canchas", icon: LayoutDashboard });
    }
    return links;
  }, [isSuperAdmin, isVenueAccount, user]);

  const renderMenuContent = () => (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={10}
        align="end"
        className="dropdown-content z-50 min-w-56 rounded-2xl border bg-white/95 backdrop-blur-xl shadow-lg p-2 focus:outline-none transform origin-[var(--radix-dropdown-menu-content-transform-origin)]"
      >
        <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-white border">
          <div className="text-xs text-gray-500">Sesion</div>
          <div className="font-medium text-black truncate">{user?.name ?? user?.email ?? ""}</div>
        </div>
        <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />

        {menuLinks.map((item) => (
          <DropdownMenu.Item asChild key={item.href}>
            <Link
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
            >
              <item.icon className="w-4 h-4 text-gray-600" />
              <span>{item.label}</span>
            </Link>
          </DropdownMenu.Item>
        ))}

        {secondaryAction && !isVenueAccount ? (
          <>
            <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />
            <DropdownMenu.Item asChild>
              <Link
                href={secondaryAction.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 focus:bg-gray-100 cursor-pointer text-gray-600"
              >
                <MapPin className="w-4 h-4" />
                <span>{secondaryAction.label}</span>
              </Link>
            </DropdownMenu.Item>
          </>
        ) : null}

        <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />
        <DropdownMenu.Item asChild>
          <button
            onClick={async () => {
              await signOut();
              setMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-50 focus:bg-red-50 text-red-600 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesion</span>
          </button>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );

  const formatNotificationDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const navLink = ({ href, label }: NavItem) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "relative px-3 py-2 rounded-full text-sm font-semibold transition-colors",
          active ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
        )}
      >
        {active && (
          <motion.span
            layoutId="navActiveBg"
            className="absolute inset-0 rounded-full bg-gray-100/90"
            transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.2 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    );
  };

  // Cerrar menus al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!notificationsOpen) return;
    // Run once on open: mark seen then refresh
    markAsSeen();
    refreshNotifications();
    // We intentionally depend only on `notificationsOpen` to avoid loops
    // caused by changing function identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 border-b border-gray-200/50 shadow-sm">
      <AnimatePresence>
        {roleMessage ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-b border-amber-200/70 bg-amber-50/90 backdrop-blur-sm"
          >
            <div className="container container-px flex items-center justify-between gap-3 py-2 text-sm text-amber-900">
              <span className="flex-1 leading-snug">{roleMessage}</span>
              <button
                type="button"
                onClick={() => setRoleMessage(null)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 text-amber-700 transition hover:bg-amber-100"
                aria-label="Cerrar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="container h-16 lg:h-18 container-px flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect width="24" height="24" rx="6" fill="var(--brand-2)" />
                <path d="M6 12h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <span className="font-bold text-lg lg:text-xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">PichangApp</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => navLink(item))}
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="hidden md:inline-flex items-center rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              {secondaryAction.label}
            </Link>
          ) : null}
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className="hidden md:inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900"
            >
              {primaryAction.label}
            </Link>
          ) : null}
          <div className="relative flex items-center gap-1 lg:gap-2">
            {!user ? (
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
              <button
