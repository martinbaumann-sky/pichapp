"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  User as UserIcon,
  Users,
  UserCircle,
  LogOut,
  Bell,
  RefreshCw,
  CalendarDays,
  CalendarCheck,
  Compass,
  LayoutDashboard,
  MessageSquare,
  MapPin,
  MoreVertical,
  PlusCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { ADMIN_EMAILS } from "@/constants/admin";
import { useAuth } from "@/hooks/useAuth";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";
import { AnimatedDockMenu } from "./ui/animated-dock";
import { cn } from "../utils/cn";
import AuthDialog from "./AuthDialog";

const pathMatchScore = (currentPath: string | null | undefined, targetPath: string) => {
  if (!currentPath || !targetPath) return 0;
  if (currentPath === targetPath) return targetPath.length + 1;
  if (!currentPath.startsWith(targetPath)) return 0;
  const nextChar = currentPath.charAt(targetPath.length);
  if (nextChar === "/" || nextChar === "?" || nextChar === "#" || nextChar === "") {
    return targetPath.length;
  }
  return 0;
};

type NavItem =
  | { type: "link"; href: string; label: string; variant?: "primary" }
  | { type: "action"; label: string; onClick: () => void };

export default function Header() {
  const pathname = usePathname();
  // Avoid SSR/CSR hydration mismatches by deferring pathname-based UI until mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user, loading, signOut } = useAuth();
  const userRole =
    (user?.role as "player" | "venue_admin" | "superadmin" | undefined) ??
    (user?.isAdmin ? "superadmin" : undefined);
  const isAdminPanelView = pathname?.startsWith("/admin") ?? false;
  const canAccessVenuePanel = userRole === "venue_admin" && !isAdminPanelView;
  const isVenueAdmin = userRole === "venue_admin";
  const isVenueMarketingView = pathname?.startsWith("/cancha") ?? false;
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
  } = useNotifications(Boolean(user) && !isVenueAdmin);
  const showNotifications = Boolean(user) && !isVenueAdmin;
  const normalizedUserEmail = user?.email?.toLowerCase();
  const adminEmail = normalizedUserEmail
    ? ADMIN_EMAILS.some((email) => email.toLowerCase() === normalizedUserEmail)
    : false;
  const isSuperAdmin = adminEmail || userRole === "superadmin";

  const openLoginDialog = useCallback(() => {
    if (loading) return;
    setAuthNext(undefined);
    setAuthInitialTab("login");
    setAuthOpen(true);
  }, [loading]);

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

  const mainNavItems: NavItem[] = useMemo(() => {
    if (isVenueMarketingView) return [];
    if (canAccessVenuePanel) {
      const base: NavItem[] = [
        { type: "link", href: "/panel/cancha", label: "Mi Panel" },
        { type: "link", href: "/panel/cancha/partidos/nuevo", label: "Crear partido", variant: "primary" },
        { type: "link", href: "/panel/cancha/partidos", label: "Mis partidos" },
      ];
      if (isSuperAdmin) {
        base.unshift({ type: "link", href: "/admin", label: "Admin" });
      }
      return base;
    }

    if (user) {
      if (isSuperAdmin) {
        return [
          { type: "link", href: "/admin", label: "Admin" },
          { type: "link", href: "/mensajes", label: "Mensajes" },
        ];
      }
      return [
        { type: "link", href: "/explorar", label: "Explorar" },
        { type: "link", href: "/reservas", label: "Reservas" },
        { type: "link", href: "/amigos", label: "Amigos" },
        { type: "link", href: "/mensajes", label: "Mensajes" },
      ];
    }

    return [
      { type: "link", href: "/explorar", label: "Explorar" },
      { type: "action", label: "Iniciar sesión", onClick: openLoginDialog },
    ];
  }, [canAccessVenuePanel, isSuperAdmin, isVenueMarketingView, openLoginDialog, user]);

  const dockItems = useMemo(() => {
    const computed = mainNavItems.map((item) => {
      if (item.type === "link") {
        let icon = <Compass className="h-5 w-5" />;
        if (item.href.startsWith("/reservas")) icon = <CalendarDays className="h-5 w-5" />;
        if (item.href.startsWith("/amigos")) icon = <Users className="h-5 w-5" />;
        if (item.href.startsWith("/mensajes")) icon = <MessageSquare className="h-5 w-5" />;
        if (item.href.startsWith("/panel/cancha/partidos/nuevo")) icon = <PlusCircle className="h-5 w-5" />;
        if (item.href.startsWith("/panel/cancha/partidos")) icon = <CalendarCheck className="h-5 w-5" />;
        if (item.href === "/admin") icon = <ShieldCheck className="h-5 w-5" />;
        if (item.href === "/panel/cancha") icon = <LayoutDashboard className="h-5 w-5" />;

        const score = mounted ? pathMatchScore(pathname, item.href) : 0;

        return {
          id: item.href,
          label: item.label,
          icon,
          href: item.href,
          variant: item.variant === "primary" ? "primary" : "default",
          score,
        };
      }

      return {
        id: `action-${item.label}`,
        label: item.label,
        icon: <UserIcon className="h-5 w-5" />,
        onClick: item.onClick,
        variant: "primary" as const,
      };
    });

    const activeId = computed
      .filter((item): item is typeof computed[number] & { href: string; score: number } =>
        "href" in item,
      )
      .reduce<{ id: string | null; score: number }>(
        (best, item) => {
          if ((item.score ?? 0) > best.score) {
            return { id: item.id, score: item.score ?? 0 };
          }
          return best;
        },
        { id: null, score: 0 },
      ).id;

    return computed.map((item) => {
      if ("href" in item) {
        const { score: _score, ...rest } = item;
        return { ...rest, active: activeId === item.id };
      }
      return item;
    });
  }, [mainNavItems, mounted, pathname]);

  const dropdownContentVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 380,
        damping: 32,
        mass: 0.7,
      },
    },
    exit: {
      opacity: 0,
      y: 12,
      scale: 0.96,
      transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
    },
  };

  const dropdownListVariants = {
    hidden: {
      transition: { staggerChildren: 0.04, staggerDirection: -1 },
    },
    visible: {
      transition: { staggerChildren: 0.05, delayChildren: 0.05 },
    },
    exit: {
      transition: { staggerChildren: 0.035, staggerDirection: -1 },
    },
  };

  const dropdownItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.97 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 500,
        damping: 34,
      },
    },
    exit: {
      opacity: 0,
      y: 8,
      scale: 0.95,
      transition: { duration: 0.12 },
    },
  };

  const renderMenuContent = () => {
    const primaryLinks = canAccessVenuePanel
      ? [
          {
            key: "panel-settings",
            href: "/panel/cancha?tab=settings",
            icon: <Settings className="w-4 h-4 text-gray-600" />,
            label: "Datos de la cancha",
          },
          {
            key: "panel-partidos",
            href: "/panel/cancha/partidos",
            icon: <CalendarDays className="w-4 h-4 text-gray-600" />,
            label: "Mis partidos",
          },
        ]
      : [
          {
            key: "perfil",
            href: "/perfil",
            icon: <UserCircle className="w-4 h-4 text-gray-600" />,
            label: "Perfil",
          },
        ];

    const marketingLink = !canAccessVenuePanel
      ? {
          key: "cancha",
          href: "/cancha",
          icon: <MapPin className="w-4 h-4" />,
          label: "¿Tienes una cancha?",
        }
      : null;

    return (
      <DropdownMenu.Portal forceMount>
        <AnimatePresence>
          {menuOpen ? (
            <DropdownMenu.Content
              forceMount
              sideOffset={12}
              align="end"
              asChild
            >
              <motion.div
                variants={dropdownContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="dropdown-content z-50 min-w-56 rounded-2xl border border-gray-100/80 bg-white/95 p-2 shadow-xl backdrop-blur-xl focus:outline-none origin-[var(--radix-dropdown-menu-content-transform-origin)]"
              >
                <motion.div
                  variants={dropdownItemVariants}
                  className="px-3 py-2 rounded-xl bg-gradient-to-br from-gray-50 to-white border"
                >
                  <div className="text-xs text-gray-500">Sesión</div>
                  <div className="font-medium text-black truncate">{user.name}</div>
                </motion.div>

                <motion.div variants={dropdownItemVariants} className="my-2 h-px bg-gray-200" />

                <motion.div className="flex flex-col gap-1" variants={dropdownListVariants}>
                  {primaryLinks.map((item) => (
                    <motion.div
                      key={item.key}
                      variants={dropdownItemVariants}
                      whileHover={{ x: 6, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <DropdownMenu.Item asChild>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 transition-colors hover:bg-gray-100 focus:bg-gray-100"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenu.Item>
                    </motion.div>
                  ))}
                </motion.div>

                {marketingLink ? (
                  <>
                    <motion.div variants={dropdownItemVariants} className="my-2 h-px bg-gray-200" />
                    <motion.div
                      variants={dropdownItemVariants}
                      whileHover={{ x: 6, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <DropdownMenu.Item asChild>
                        <Link
                          href={marketingLink.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 transition-colors hover:bg-gray-100 focus:bg-gray-100"
                        >
                          {marketingLink.icon}
                          <span>{marketingLink.label}</span>
                        </Link>
                      </DropdownMenu.Item>
                    </motion.div>
                  </>
                ) : null}

                <motion.div variants={dropdownItemVariants} className="my-2 h-px bg-gray-200" />

                <motion.div
                  variants={dropdownItemVariants}
                  whileHover={{ x: 6, scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={async () => {
                        await signOut();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </DropdownMenu.Item>
                </motion.div>
              </motion.div>
            </DropdownMenu.Content>
          ) : null}
        </AnimatePresence>
      </DropdownMenu.Portal>
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

        <nav className="hidden md:flex items-center">
          {dockItems.length > 0 ? (
            <AnimatedDockMenu items={dockItems} />
          ) : null}
        </nav>

        {/* Perfil / Auth */}
        <div className="relative flex items-center gap-3">
          {isVenueMarketingView && !user ? (
            <Link
              href="/cancha/ingresar"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-brand-600 hover:to-accent-600"
            >
              Iniciar sesión
            </Link>
          ) : !user ? (
            <button
              aria-label="perfil"
              onClick={openLoginDialog}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-target"
            >
              <UserIcon className="w-5 h-5" />
            </button>
          ) : (
            <>
              {showNotifications && (
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
                          <RefreshCw className={cn("h-4 w-4", notificationsLoading && "animate-spin")} />
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
              )}

              <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenu.Trigger asChild>
                  <button
                    onClick={() => setMenuOpen(true)}
                    className={cn(
                      "p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black/10 touch-target",
                      menuOpen
                        ? "bg-[rgba(11,143,61,0.12)] text-[var(--brand-2)] shadow-[0_8px_24px_-16px_rgba(11,143,61,0.45)]"
                        : "hover:bg-gray-100",
                    )}
                    aria-label={isVenueAdmin ? "acciones de la cuenta" : "perfil"}
                  >
                    {isVenueAdmin ? <MoreVertical className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  </button>
                </DropdownMenu.Trigger>
                {renderMenuContent()}
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
                {isVenueMarketingView && !user ? (
                  <Link
                    href="/cancha/ingresar"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm bg-white/90 font-semibold text-gray-900 shadow-sm transition hover:bg-white"
                  >
                    Iniciar sesión
                  </Link>
                ) : (
                  mainNavItems.map((item) =>
                    item.type === "link" ? (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="px-4 py-3 rounded-xl text-sm bg-white/90 hover:bg-white transition-colors touch-target"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <button
                        key={"mobile-action-" + item.label}
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          item.onClick();
                        }}
                        className="px-4 py-3 rounded-xl text-sm bg-white/90 hover:bg-white transition-colors text-left touch-target"
                      >
                        {item.label}
                      </button>
                    )
                  )
                )}
                {!isVenueMarketingView && !canAccessVenuePanel && (
                  <Link
                    href="/cancha"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm text-gray-600 bg-white/80 border border-gray-200 hover:bg-white transition-colors touch-target"
                  >
                    ¿Tienes una cancha?
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}







