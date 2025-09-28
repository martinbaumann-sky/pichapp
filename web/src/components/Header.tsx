"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User as UserIcon,
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Bell,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "../utils/cn";
import AuthDialog from "./AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

export default function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const userRole =
    (user?.role as "player" | "venue_admin" | "superadmin" | undefined) ??
    (user?.isAdmin ? "superadmin" : undefined);
  const canAccessVenuePanel = userRole === "venue_admin" || userRole === "superadmin";
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

  const navLink = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={cn(
          "relative px-3 py-2 rounded-full text-sm font-medium transition-all duration-150",
          active ? "text-black" : "text-gray-700 hover:bg-gray-100 hover:-translate-y-0.5"
        )}
      >
        {active && (
          <motion.span
            layoutId="navActiveBg"
            className="absolute inset-0 rounded-full bg-gray-100 shadow-sm"
            transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.2 }}
          />
        )}
        <span className="relative z-10">{label}</span>
      </Link>
    );
  };

  // Cerrar menús al cambiar de ruta
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

        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {navLink("/explorar", "Explorar")}
          {navLink("/cancha", "Soy cancha")}
          {navLink("/ayuda", "Ayuda")}
          {canAccessVenuePanel ? (
            <Link
              href="/panel/cancha"
              className="btn-primary btn-mobile-sm lg:btn-mobile"
            >
              <span className="hidden lg:inline">Panel cancha</span>
              <span className="lg:hidden">Panel</span>
            </Link>
          ) : null}
        </nav>

        {/* Perfil / Auth */}
        <div className="relative flex items-center gap-1 lg:gap-2">
          {!user ? (
            <button
              aria-label="perfil"
              onClick={() => {
                if (loading) return;
                setAuthNext(undefined);
                setAuthInitialTab("login");
                setAuthOpen(true);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-target"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          ) : (
            <>
              <DropdownMenu.Root open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(true)}
                    className={cn(
                      "relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors touch-target",
                      notificationsOpen && "bg-gray-100"
                    )}
                    aria-label="notificaciones"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-4 text-white shadow-lg animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    sideOffset={10}
                    align="end"
                    className="dropdown-content z-50 w-80 max-w-xs rounded-2xl border bg-white/95 backdrop-blur-xl shadow-lg p-2 focus:outline-none transform origin-[var(--radix-dropdown-menu-content-transform-origin)]"
                  >
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-gradient-to-br from-gray-50 to-white px-3 py-2">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Notificaciones</div>
                        <div className="text-xs text-gray-500">
                          {notificationsLoading
                            ? "Actualizando..."
                            : unreadCount > 0
                              ? `${unreadCount} nuevas`
                              : "Todo al día"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => refreshNotifications()}
                        className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Actualizar notificaciones"
                      >
                        {notificationsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 max-h-80 overflow-y-auto">
                      {notificationsLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center px-4 py-8 text-sm text-gray-500">
                          Cargando notificaciones...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
                          No tienes notificaciones nuevas por ahora.
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <DropdownMenu.Item asChild key={item.id}>
                            <Link
                              href={item.href}
                              onClick={() => setNotificationsOpen(false)}
                              className="block rounded-xl px-3 py-3 transition hover:bg-gray-100 focus:bg-gray-100"
                            >
                              <div className="flex flex-col gap-1 text-left">
                                <span className="text-sm font-medium text-gray-900">{item.title}</span>
                                <span className="text-xs text-gray-500">{item.description}</span>
                                <span className="text-[11px] uppercase tracking-wide text-gray-400">
                                  {formatNotificationDate(item.createdAt)}
                                </span>
                              </div>
                            </Link>
                          </DropdownMenu.Item>
                        ))
                      )}
                    </div>

                    {notificationsError && (
                      <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                        {notificationsError}
                      </div>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>

              <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenu.Trigger asChild>
                  <button
                    onClick={() => setMenuOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors touch-target"
                  >
                    <UserIcon className="w-5 h-5" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    sideOffset={10}
                    align="end"
                    className="dropdown-content z-50 min-w-56 rounded-2xl border bg-white/95 backdrop-blur-xl shadow-lg p-2 focus:outline-none transform origin-[var(--radix-dropdown-menu-content-transform-origin)]"
                  >
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-white border">
                      <div className="text-xs text-gray-500">Sesión</div>
                      <div className="font-medium text-black truncate">{user.name}</div>
                    </div>
                    <DropdownMenu.Separator className="my-2 h-px bg-gray-200" />

                {canAccessVenuePanel && (
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/panel/cancha"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-600" />
                      <span>Panel cancha</span>
                    </Link>
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item asChild>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-gray-600" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link href="/amigos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span>Amigos</span>
                      </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild>
                      <Link href="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 focus:bg-gray-100 cursor-pointer">
                        <UserCircle className="w-4 h-4 text-gray-600" />
                        <span>Perfil</span>
                      </Link>
                    </DropdownMenu.Item>

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
                        <span>Cerrar sesión</span>
                      </button>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          )}
        </div>

        <AuthDialog
          open={authOpen}
          onOpenChange={(o) => {
            setAuthOpen(o);
            if (!o) setAuthNext(undefined);
          }}
          initialTab={authInitialTab}
          next={authNext}
        />

        {/* Mobile */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setMobileOpen((v) => !v)} className="p-2 rounded-md hover:bg-gray-100 transition-colors touch-target">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="#0f172a"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.4, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="container container-px pb-4">
              <div className="flex flex-col gap-2">
                <Link
                  href="/explorar"
                  className="px-4 py-3 rounded-xl text-sm bg-white/90 hover:bg-white transition-colors touch-target"
                >
                  Explorar partidos
                </Link>
                <Link
                  href="/cancha"
                  className="px-4 py-3 rounded-xl text-sm bg-white/90 hover:bg-white transition-colors touch-target"
                >
                  Soy cancha
                </Link>
                <Link
                  href="/ayuda"
                  className="px-4 py-3 rounded-xl text-sm bg-white/90 hover:bg-white transition-colors touch-target"
                >
                  Ayuda
                </Link>
                {canAccessVenuePanel ? (
                  <Link href="/panel/cancha" className="btn-primary btn-mobile">
                    Panel cancha
                  </Link>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
