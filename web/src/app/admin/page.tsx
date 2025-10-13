"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  Calendar,
  ChartSpline,
  Check,
  Download,
  Loader2,
  Mail,
  MapPin,
  PauseCircle,
  PieChart,
  PlayCircle,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Table,
  Ticket,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";

import AuthDialog from "@/components/AuthDialog";
import { ADMIN_EMAIL } from "@/constants/admin";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import { formatCurrencyCLP } from "@/utils/formatters";
import { VENUE_PLANS } from "@/lib/venuePlans";

type AdminTab =
  | "overview"
  | "users"
  | "venues"
  | "finances"
  | "matches"
  | "subscriptions"
  | "reports"
  | "config"
  | "alerts"
  | "admins"
  | "support";

type MatchStatus =
  | "PUBLISHED"
  | "CONFIRMED"
  | "FULL"
  | "FINISHED"
  | "CANCELED"
  | "CANCELED_MINIMUM";

type MatchSummary = {
  id: string;
  title: string;
  status: MatchStatus;
  startsAt: string;
  comuna: string;
  venueName: string | null;
  organizerName: string | null;
  pricePerSpot: number;
  totalSpots: number;
  paidSpots: number;
  reservedSpots: number;
};

type AdminOverviewResponse = {
  generatedAt: string;
  summary: {
    totals: {
      players: number;
      activePlayers30d: number;
      organizers: number;
      activeOrganizers30d: number;
      venues: number;
      verifiedVenues: number;
      upcomingMatches: number;
      finishedMatches30d: number;
    };
    revenue: {
      totalApproved: number;
      approved30d: number;
      pending: number;
      retainedCommission30d: number;
    };
  };
  users: {
    totals: {
      players: number;
      organizers: number;
      suspended: number;
    };
    list: Array<{
      id: string;
      email: string | null;
      role: "PLAYER" | "VENUE_ADMIN" | "SUPERADMIN";
      createdAt: string;
      disabledAt: string | null;
      isAdmin: boolean;
      profile: {
        name: string | null;
        comuna: string | null;
        phone: string | null;
        rating: number | null;
      };
      matchesOrganized: number;
      matchesPlayed: number;
      paymentsTotal: number;
      paymentsCount: number;
      lastLoginAt: string | null;
    }>;
    recentLogins: Array<{
      userId: string;
      email: string | null;
      name: string | null;
      comuna: string | null;
      createdAt: string;
    }>;
  };
  venues: {
    totals: {
      active: number;
      inactive: number;
    };
    list: Array<{
      id: string;
      name: string;
      comuna: string;
      plan: string;
      verified: boolean;
      createdAt: string;
      owner: {
        id: string | null;
        name: string | null;
        email: string | null;
      };
      revenueApproved: number;
      revenueApproved30d: number;
      pendingPayments: number;
      matchStats: {
        active: number;
        upcoming: number;
      };
      subscriptions: Array<{
        id: string;
        plan: string;
        status: string;
        createdAt: string;
        activatedAt: string | null;
        canceledAt: string | null;
        nextChargeAt: string | null;
        lastChargeAt: string | null;
      }>;
    }>;
  };
  matches: {
    active: MatchSummary[];
    finished: MatchSummary[];
    canceled: MatchSummary[];
  };
  payments: {
    recent: Array<{
      id: string;
      amountCLP: number;
      status: string;
      provider: string;
      createdAt: string;
      user: { email: string | null; name: string | null };
      match: { title: string | null; venueName: string | null };
    }>;
  };
  subscriptions: {
    countsByPlan: Record<string, Record<string, number>>;
    expiringSoon: Array<{
      id: string;
      plan: string;
      status: string;
      nextChargeAt: string | null;
      venueName: string | null;
      venuePlan: string | null;
    }>;
  };
  admins: {
    list: Array<{
      id: string;
      email: string | null;
      role: string;
      name: string | null;
      createdAt: string;
      lastLoginAt: string | null;
    }>;
  };
};

const TABS: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Resumen", icon: Activity },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "venues", label: "Canchas", icon: Building2 },
  { id: "finances", label: "Finanzas", icon: PieChart },
  { id: "matches", label: "Partidos", icon: Ticket },
  { id: "subscriptions", label: "Suscripciones", icon: Calendar },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "config", label: "Configuración", icon: Settings2 },
  { id: "alerts", label: "Alertas", icon: BellRing },
  { id: "admins", label: "Administradores", icon: UserCog },
  { id: "support", label: "Soporte", icon: Mail },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return value;
  }
}

function formatRelative(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  const now = Date.now();
  const diff = date.getTime() - now;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const minutes = Math.round(diff / (1000 * 60));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (Math.abs(minutes) < 120) return rtf.format(minutes, "minute");
  if (Math.abs(hours) < 72) return rtf.format(hours, "hour");
  return rtf.format(days, "day");
}

function roleLabel(role: "PLAYER" | "VENUE_ADMIN" | "SUPERADMIN" | string | null | undefined) {
  if (role === "SUPERADMIN") return "Superadmin";
  if (role === "VENUE_ADMIN") return "Organizador";
  return "Jugador";
}

function matchStatusLabel(status: MatchStatus) {
  switch (status) {
    case "PUBLISHED":
    case "CONFIRMED":
    case "FULL":
      return "Activo";
    case "FINISHED":
      return "Completado";
    default:
      return "Cancelado";
  }
}

function statusTone(status: MatchStatus) {
  if (["PUBLISHED", "CONFIRMED", "FULL"].includes(status)) return "bg-emerald-100 text-emerald-700";
  if (status === "FINISHED") return "bg-sky-100 text-sky-700";
  return "bg-rose-100 text-rose-700";
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingVenueId, setUpdatingVenueId] = useState<string | null>(null);
  const [matchFilter, setMatchFilter] = useState<"active" | "finished" | "canceled">("active");

  const isAdminUser = useMemo(() => {
    if (!user) return false;
    if (user.role === "superadmin" || user.isAdmin) return true;
    return false;
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAuthOpen(true);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!isAdminUser) return;
    const loadData = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await fetch("/api/admin/overview", { cache: "no-store" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "No pudimos cargar el panel admin");
        }
        const payload = (await res.json()) as AdminOverviewResponse;
        setData(payload);
        setSelectedUserId(null);
        setSelectedVenueId(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error inesperado";
        setError(message);
      } finally {
        setLoadingData(false);
      }
    };

    loadData().catch(() => {});
  }, [isAdminUser]);

  const selectedUser = useMemo(() => {
    if (!data || !selectedUserId) return null;
    return data.users.list.find((item) => item.id === selectedUserId) ?? null;
  }, [data, selectedUserId]);

  const selectedVenue = useMemo(() => {
    if (!data || !selectedVenueId) return null;
    return data.venues.list.find((item) => item.id === selectedVenueId) ?? null;
  }, [data, selectedVenueId]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    if (!userSearch.trim()) return data.users.list;
    const term = userSearch.trim().toLowerCase();
    return data.users.list.filter((item) => {
      const name = item.profile.name?.toLowerCase() ?? "";
      const email = item.email?.toLowerCase() ?? "";
      const comuna = item.profile.comuna?.toLowerCase() ?? "";
      return name.includes(term) || email.includes(term) || comuna.includes(term);
    });
  }, [data, userSearch]);

  const matchSource = useMemo(() => {
    if (!data) return [] as MatchSummary[];
    if (matchFilter === "active") return data.matches.active;
    if (matchFilter === "finished") return data.matches.finished;
    return data.matches.canceled;
  }, [data, matchFilter]);

  const refreshData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "No pudimos actualizar los datos");
      }
      const payload = (await res.json()) as AdminOverviewResponse;
      setData(payload);
      setSelectedUserId(null);
      setSelectedVenueId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleUserStatus = async (userId: string, suspend: boolean) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspend }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "No se pudo actualizar el usuario");
      }
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: {
            ...prev.users,
            list: prev.users.list.map((item) =>
              item.id === userId
                ? { ...item, disabledAt: suspend ? new Date().toISOString() : null }
                : item,
            ),
          },
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el usuario";
      setError(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleVenueVerification = async (venueId: string, verified: boolean) => {
    try {
      setUpdatingVenueId(venueId);
      const res = await fetch(`/api/admin/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "No se pudo actualizar la cancha");
      }
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          venues: {
            ...prev.venues,
            list: prev.venues.list.map((venue) =>
              venue.id === venueId ? { ...venue, verified } : venue,
            ),
          },
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la cancha";
      setError(message);
    } finally {
      setUpdatingVenueId(null);
    }
  };

  if (authLoading || (isAdminUser && loadingData && !data)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Cargando panel…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthDialog
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open);
            if (!open) router.replace("/");
          }}
          initialTab="login"
          next="/admin"
        />
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-gray-900" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">Acceso restringido</h1>
            <p className="text-sm text-gray-600">
              Esta sección es exclusiva para el equipo administrador de PichangApp. Inicia sesión con
              las credenciales asignadas para continuar.
            </p>
            {ADMIN_EMAIL ? (
              <p className="text-xs text-gray-500">
                ¿Necesitas acceso? Contacta a{" "}
                <a className="font-medium underline" href={`mailto:${ADMIN_EMAIL}`}>
                  {ADMIN_EMAIL}
                </a>{" "}
                para solicitar tus credenciales.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ArrowRight className="h-4 w-4" /> Ir a mi perfil
            </Link>
            <button
              onClick={() => {
                void signOut();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Cambiar de cuenta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Panel admin
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">Control central de PichangApp</h1>
              {data?.generatedAt ? (
                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">
                  Actualizado {formatRelative(data.generatedAt)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <RefreshCcw className="h-4 w-4" /> Actualizar
            </button>
            <button
              onClick={() => {
                void signOut();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              <Check className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
                  isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
            <p className="mt-2 text-xs text-rose-600">
              Si el problema persiste, revisa la consola del servidor o vuelve a autenticarte.
            </p>
          </div>
        ) : null}

        {!data ? (
          <div className="mt-10 flex justify-center">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Procesando información en vivo…</span>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {activeTab === "overview" ? <OverviewTab data={data} /> : null}
            {activeTab === "users" ? (
              <UsersTab
                data={data}
                filteredUsers={filteredUsers}
                userSearch={userSearch}
                setUserSearch={setUserSearch}
                selectedUser={selectedUser}
                setSelectedUserId={setSelectedUserId}
                toggleUserStatus={toggleUserStatus}
                updatingUserId={updatingUserId}
              />
            ) : null}
            {activeTab === "venues" ? (
              <VenuesTab
                data={data}
                selectedVenue={selectedVenue}
                setSelectedVenueId={setSelectedVenueId}
                toggleVenueVerification={toggleVenueVerification}
                updatingVenueId={updatingVenueId}
              />
            ) : null}
            {activeTab === "finances" ? <FinancesTab data={data} /> : null}
            {activeTab === "matches" ? (
              <MatchesTab data={matchSource} filter={matchFilter} setFilter={setMatchFilter} />
            ) : null}
            {activeTab === "subscriptions" ? <SubscriptionsTab data={data} /> : null}
            {activeTab === "reports" ? <ReportsTab data={data} /> : null}
            {activeTab === "config" ? <ConfigTab /> : null}
            {activeTab === "alerts" ? <AlertsTab data={data} /> : null}
            {activeTab === "admins" ? <AdminsTab data={data} /> : null}
            {activeTab === "support" ? <SupportTab data={data} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}

type OverviewTabProps = { data: AdminOverviewResponse };

function OverviewTab({ data }: OverviewTabProps) {
  const { summary, users, venues } = data;

  return (
    <section className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          title="Jugadores activos"
          value={summary.totals.activePlayers30d}
          helper={`Total registrados: ${summary.totals.players}`}
          icon={Users}
        />
        <OverviewCard
          title="Organizadores activos"
          value={summary.totals.activeOrganizers30d}
          helper={`Total organizadores: ${summary.totals.organizers}`}
          icon={UserCheck}
        />
        <OverviewCard
          title="Canchas verificadas"
          value={summary.totals.verifiedVenues}
          helper={`Total en plataforma: ${summary.totals.venues}`}
          icon={Building2}
        />
        <OverviewCard
          title="Partidos próximos"
          value={summary.totals.upcomingMatches}
          helper={`Terminados en 30 días: ${summary.totals.finishedMatches30d}`}
          icon={Ticket}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
        <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ingresos netos</p>
              <h2 className="text-xl font-semibold text-gray-900">Rendimiento financiero</h2>
            </div>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricStack
              label="Total histórico"
              value={formatCurrencyCLP(summary.revenue.totalApproved)}
              tone="text-gray-900"
            />
            <MetricStack
              label="Últimos 30 días"
              value={formatCurrencyCLP(summary.revenue.approved30d)}
              tone="text-emerald-600"
            />
            <MetricStack
              label="Comisión retenida"
              value={formatCurrencyCLP(summary.revenue.retainedCommission30d)}
              tone="text-slate-600"
            />
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Pagos pendientes</p>
            <p className="text-lg font-semibold text-gray-900">{formatCurrencyCLP(summary.revenue.pending)}</p>
            <p className="text-xs text-gray-500">
              Suma de reservas aprobadas por Mercado Pago que aún no se liquida a la cancha.
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Últimos ingresos al sistema</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <ul className="space-y-3 text-sm">
            {users.recentLogins.length === 0 ? (
              <li className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                Aún no registramos sesiones en los últimos 30 días.
              </li>
            ) : (
              users.recentLogins.map((login) => (
                <li
                  key={`${login.userId}-${login.createdAt}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {login.name ?? login.email ?? "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {login.comuna ? `Desde ${login.comuna}` : "Sesión iniciada"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{formatRelative(login.createdAt)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Uso de la plataforma</h3>
              <p className="text-xs text-gray-500">
                Resumen de crecimiento y salud de la comunidad en los últimos 30 días.
              </p>
            </div>
            <ChartSpline className="h-5 w-5 text-gray-400" />
          </div>
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">Retención de jugadores activos</dt>
              <dd className="font-semibold text-gray-900">
                {summary.totals.players === 0
                  ? "-"
                  : `${Math.round((summary.totals.activePlayers30d / summary.totals.players) * 100)}%`}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">Canchas verificadas</dt>
              <dd className="font-semibold text-gray-900">
                {summary.totals.venues === 0
                  ? "-"
                  : `${Math.round((summary.totals.verifiedVenues / summary.totals.venues) * 100)}%`}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <dt className="text-gray-600">Partidos confirmados vs publicados</dt>
              <dd className="font-semibold text-gray-900">
                {summary.totals.upcomingMatches + summary.totals.finishedMatches30d === 0
                  ? "-"
                  : `${summary.totals.finishedMatches30d}/${summary.totals.upcomingMatches + summary.totals.finishedMatches30d}`}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Canchas con más actividad</h3>
            <Table className="h-5 w-5 text-gray-400" />
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {venues.list.slice(0, 4).map((venue) => (
              <li
                key={venue.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{venue.name}</p>
                  <p className="text-xs text-gray-500">{venue.comuna}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Partidos activos</p>
                  <p className="text-sm font-semibold text-gray-900">{venue.matchStats.active}</p>
                </div>
              </li>
            ))}
            {venues.list.length === 0 ? (
              <li className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                No hay canchas registradas todavía.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

type OverviewCardProps = {
  title: string;
  value: number;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
};

function OverviewCard({ title, value, helper, icon: Icon }: OverviewCardProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-semibold uppercase tracking-wider">{title}</span>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value.toLocaleString("es-CL")}</p>
      <p className="text-xs text-gray-500">{helper}</p>
    </div>
  );
}

type MetricStackProps = { label: string; value: string; tone: string };

function MetricStack({ label, value, tone }: MetricStackProps) {
  return (
    <div className="space-y-1 rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
      <p className={cn("text-lg font-semibold", tone)}>{value}</p>
    </div>
  );
}

type UsersTabProps = {
  data: AdminOverviewResponse;
  filteredUsers: AdminOverviewResponse["users"]["list"];
  userSearch: string;
  setUserSearch: (value: string) => void;
  selectedUser: AdminOverviewResponse["users"]["list"][number] | null;
  setSelectedUserId: (value: string | null) => void;
  toggleUserStatus: (id: string, suspend: boolean) => void;
  updatingUserId: string | null;
};

function UsersTab({
  data,
  filteredUsers,
  userSearch,
  setUserSearch,
  selectedUser,
  setSelectedUserId,
  toggleUserStatus,
  updatingUserId,
}: UsersTabProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Gestión de usuarios</h2>
            <p className="text-sm text-gray-600">
              Busca, filtra y controla cuentas de jugadores y organizadores con datos reales.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500">
            <Search className="h-4 w-4" />
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o comuna"
              className="w-48 border-none bg-transparent text-sm text-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Rol</th>
                <th className="px-4 py-3 text-left font-medium">Partidos</th>
                <th className="px-4 py-3 text-left font-medium">Pagos</th>
                <th className="px-4 py-3 text-left font-medium">Último acceso</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const isSuspended = Boolean(user.disabledAt);
                const isSelected = selectedUser?.id === user.id;
                return (
                  <tr key={user.id} className={cn("bg-white", isSelected ? "bg-emerald-50/70" : "")}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{user.profile.name ?? user.email ?? "Usuario"}</div>
                      <div className="text-xs text-gray-500">
                        {user.email ?? "Sin correo"} · {user.profile.comuna ?? "Sin comuna"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-sm font-semibold text-gray-900">{user.matchesPlayed.toLocaleString("es-CL")}</div>
                      <div className="text-xs text-gray-500">Organizados: {user.matchesOrganized}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-sm font-semibold text-gray-900">{user.paymentsCount} pagos</div>
                      <div className="text-xs text-gray-500">{formatCurrencyCLP(user.paymentsTotal)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatRelative(user.lastLoginAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          Ver detalles
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, !isSuspended)}
                          disabled={updatingUserId === user.id}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                            isSuspended
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
                            updatingUserId === user.id ? "opacity-60" : "",
                          )}
                        >
                          {updatingUserId === user.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSuspended ? (
                            <PlayCircle className="h-3.5 w-3.5" />
                          ) : (
                            <PauseCircle className="h-3.5 w-3.5" />
                          )}
                          {isSuspended ? "Reactivar" : "Suspender"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No encontramos usuarios con ese criterio.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Detalles del usuario</h3>
          <Users className="h-5 w-5 text-gray-400" />
        </div>
        {selectedUser ? (
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">Identidad</p>
              <p className="mt-1 text-base font-semibold text-gray-900">
                {selectedUser.profile.name ?? selectedUser.email ?? "Usuario"}
              </p>
              <p className="text-xs text-gray-500">
                {selectedUser.email ?? "Sin correo"} · {selectedUser.profile.phone ?? "Sin teléfono"}
              </p>
              <p className="text-xs text-gray-500">
                Rol: {roleLabel(selectedUser.role)} · Rating promedio: {selectedUser.profile.rating?.toFixed(1) ?? "N/A"}
              </p>
            </div>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Partidos jugados" value={selectedUser.matchesPlayed.toLocaleString("es-CL")} />
              <DetailRow label="Partidos organizados" value={selectedUser.matchesOrganized.toLocaleString("es-CL")} />
              <DetailRow label="Pagos registrados" value={`${selectedUser.paymentsCount} · ${formatCurrencyCLP(selectedUser.paymentsTotal)}`} />
              <DetailRow label="Último acceso" value={formatDate(selectedUser.lastLoginAt)} />
              <DetailRow label="Estado" value={selectedUser.disabledAt ? "Suspendido" : "Activo"} />
              <DetailRow label="Creado" value={formatDate(selectedUser.createdAt)} />
            </dl>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Selecciona un usuario para revisar su historial real de partidos, pagos y accesos.
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
          <p>
            Total jugadores: {data.users.totals.players.toLocaleString("es-CL")} · Organizadores: {data.users.totals.organizers.toLocaleString("es-CL")} · Suspendidos: {data.users.totals.suspended.toLocaleString("es-CL")}.
          </p>
        </div>
      </div>
    </section>
  );
}

type DetailRowProps = { label: string; value: string };

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2">
      <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

type VenuesTabProps = {
  data: AdminOverviewResponse;
  selectedVenue: AdminOverviewResponse["venues"]["list"][number] | null;
  setSelectedVenueId: (value: string | null) => void;
  toggleVenueVerification: (venueId: string, verified: boolean) => void;
  updatingVenueId: string | null;
};

function VenuesTab({ data, selectedVenue, setSelectedVenueId, toggleVenueVerification, updatingVenueId }: VenuesTabProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Canchas registradas</h2>
            <p className="text-sm text-gray-600">Controla la oferta disponible, planes y estado de verificación.</p>
          </div>
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Cancha</th>
                <th className="px-4 py-3 text-left font-medium">Plan</th>
                <th className="px-4 py-3 text-left font-medium">Ingresos</th>
                <th className="px-4 py-3 text-left font-medium">Partidos</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.venues.list.map((venue) => {
                const isSelected = selectedVenue?.id === venue.id;
                const isVerified = venue.verified;
                return (
                  <tr key={venue.id} className={cn("bg-white", isSelected ? "bg-emerald-50/70" : "")}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{venue.name}</div>
                      <div className="text-xs text-gray-500">
                        {venue.comuna} · {venue.owner?.name ?? venue.owner?.email ?? "Sin propietario"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-sm font-semibold text-gray-900">{venue.plan.toUpperCase()}</div>
                      <div className="text-xs text-gray-500">
                        {isVerified ? "Verificada" : "Pendiente"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrencyCLP(venue.revenueApproved)}</div>
                      <div className="text-xs text-gray-500">Últimos 30 días: {formatCurrencyCLP(venue.revenueApproved30d)}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-sm font-semibold text-gray-900">{venue.matchStats.active} activos</div>
                      <div className="text-xs text-gray-500">Próximos: {venue.matchStats.upcoming}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedVenueId(isSelected ? null : venue.id)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          Ver detalles
                        </button>
                        <button
                          onClick={() => toggleVenueVerification(venue.id, !isVerified)}
                          disabled={updatingVenueId === venue.id}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                            isVerified
                              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                            updatingVenueId === venue.id ? "opacity-60" : "",
                          )}
                        >
                          {updatingVenueId === venue.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isVerified ? (
                            <PauseCircle className="h-3.5 w-3.5" />
                          ) : (
                            <PlayCircle className="h-3.5 w-3.5" />
                          )}
                          {isVerified ? "Suspender" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.venues.list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay canchas registradas todavía.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Información de la cancha</h3>
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        {selectedVenue ? (
          <div className="space-y-4 text-sm text-gray-600">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">Datos principales</p>
              <p className="mt-1 text-base font-semibold text-gray-900">{selectedVenue.name}</p>
              <p className="text-xs text-gray-500">{selectedVenue.comuna}</p>
              <p className="text-xs text-gray-500">
                Plan actual: {selectedVenue.plan.toUpperCase()} · Estado: {selectedVenue.verified ? "Verificada" : "Inactiva"}
              </p>
              <p className="text-xs text-gray-500">
                Dueño: {selectedVenue.owner?.name ?? selectedVenue.owner?.email ?? "Sin registrar"}
              </p>
            </div>
            <dl className="space-y-3 text-sm">
              <DetailRow label="Ingresos totales" value={formatCurrencyCLP(selectedVenue.revenueApproved)} />
              <DetailRow label="Pendiente de liquidar" value={formatCurrencyCLP(selectedVenue.pendingPayments)} />
              <DetailRow label="Partidos activos" value={`${selectedVenue.matchStats.active}`} />
              <DetailRow label="Creada" value={formatDate(selectedVenue.createdAt)} />
            </dl>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-gray-500">Suscripciones recientes</p>
              {selectedVenue.subscriptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  Sin movimientos registrados.
                </div>
              ) : (
                selectedVenue.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-xs font-semibold text-gray-900">
                      {subscription.plan.toUpperCase()} · {subscription.status}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Creado {formatDate(subscription.createdAt)} · Próximo cobro {formatDate(subscription.nextChargeAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Selecciona una cancha para revisar ingresos, agenda y suscripciones reales.
          </div>
        )}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
          <p>
            Canchas activas: {data.venues.totals.active.toLocaleString("es-CL")} · Inactivas: {data.venues.totals.inactive.toLocaleString("es-CL")}
          </p>
        </div>
      </div>
    </section>
  );
}

type FinancesTabProps = { data: AdminOverviewResponse };

function FinancesTab({ data }: FinancesTabProps) {
  const { summary, payments } = data;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Finanzas y comisiones</h2>
            <p className="text-sm text-gray-600">
              Monitorea pagos procesados, pendientes y retención de comisiones por plan.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricStack label="Ingresos totales" value={formatCurrencyCLP(summary.revenue.totalApproved)} tone="text-gray-900" />
          <MetricStack label="Últimos 30 días" value={formatCurrencyCLP(summary.revenue.approved30d)} tone="text-emerald-600" />
          <MetricStack label="Pendiente" value={formatCurrencyCLP(summary.revenue.pending)} tone="text-amber-600" />
          <MetricStack label="Comisión retenida" value={formatCurrencyCLP(summary.revenue.retainedCommission30d)} tone="text-slate-600" />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Pagos recientes</h3>
          <PieChart className="h-5 w-5 text-gray-400" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Pago</th>
                <th className="px-4 py-3 text-left font-medium">Jugador</th>
                <th className="px-4 py-3 text-left font-medium">Partido</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.recent.map((payment) => (
                <tr key={payment.id} className="bg-white">
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(payment.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{payment.user.name ?? payment.user.email ?? "Jugador"}</div>
                    <div className="text-xs text-gray-500">{payment.provider}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="text-sm font-semibold text-gray-900">{payment.match.title ?? "Partido"}</div>
                    <div className="text-xs text-gray-500">{payment.match.venueName ?? "Sin cancha"}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        payment.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : payment.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrencyCLP(payment.amountCLP)}</td>
                </tr>
              ))}
              {payments.recent.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay pagos registrados aún.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type MatchesTabProps = {
  data: MatchSummary[];
  filter: "active" | "finished" | "canceled";
  setFilter: (value: "active" | "finished" | "canceled") => void;
};

function MatchesTab({ data, filter, setFilter }: MatchesTabProps) {
  const tabs: Array<{ id: "active" | "finished" | "canceled"; label: string }> = [
    { id: "active", label: "Activos" },
    { id: "finished", label: "Completados" },
    { id: "canceled", label: "Cancelados" },
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Partidos</h2>
          <p className="text-sm text-gray-600">
            Consulta, filtra y gestiona partidos activos, completados y cancelados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide",
                filter === tab.id ? "bg-black text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-100",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Partido</th>
              <th className="px-4 py-3 text-left font-medium">Cancha</th>
              <th className="px-4 py-3 text-left font-medium">Organizador</th>
              <th className="px-4 py-3 text-left font-medium">Inicio</th>
              <th className="px-4 py-3 text-left font-medium">Cupos</th>
              <th className="px-4 py-3 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((match) => (
              <tr key={match.id} className="bg-white">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{match.title}</div>
                  <div className="text-xs text-gray-500">${formatCurrencyCLP(match.pricePerSpot)} por cupo</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{match.venueName ?? "Sin cancha"}</td>
                <td className="px-4 py-3 text-gray-600">{match.organizerName ?? "Organizador"}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(match.startsAt)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {match.paidSpots}/{match.totalSpots} pagados · {match.reservedSpots} reservados
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", statusTone(match.status))}>
                    {matchStatusLabel(match.status)}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No hay partidos en este estado actualmente.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type SubscriptionsTabProps = { data: AdminOverviewResponse };

function SubscriptionsTab({ data }: SubscriptionsTabProps) {
  const { subscriptions } = data;

  const planEntries = Object.entries(subscriptions.countsByPlan);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <div className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Planes y suscripciones</h2>
            <p className="text-sm text-gray-600">
              Visualiza cuántas canchas utilizan cada plan y su estado de facturación.
            </p>
          </div>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {planEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              No hay suscripciones registradas aún.
            </div>
          ) : (
            planEntries.map(([plan, statuses]) => (
              <div key={plan} className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wider text-gray-500">Plan {plan.toUpperCase()}</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {Object.entries(statuses).map(([status, count]) => (
                    <li key={`${plan}-${status}`} className="flex items-center justify-between">
                      <span className="text-gray-500">{status}</span>
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Renovaciones próximas</h3>
          <RefreshCcw className="h-5 w-5 text-gray-400" />
        </div>
        <ul className="space-y-3 text-sm">
          {subscriptions.expiringSoon.length === 0 ? (
            <li className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              No hay renovaciones programadas.
            </li>
          ) : (
            subscriptions.expiringSoon.map((subscription) => (
              <li key={subscription.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{subscription.venueName ?? "Cancha"}</p>
                    <p className="text-xs text-gray-500">
                      Plan {subscription.venuePlan?.toUpperCase() ?? subscription.plan.toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {formatRelative(subscription.nextChargeAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Estado: {subscription.status}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

type ReportsTabProps = { data: AdminOverviewResponse };

function ReportsTab({ data }: ReportsTabProps) {
  const { summary, users, venues } = data;

  const fillRate = summary.totals.upcomingMatches + summary.totals.finishedMatches30d === 0
    ? 0
    : summary.totals.finishedMatches30d / (summary.totals.upcomingMatches + summary.totals.finishedMatches30d);

  return (
    <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Analítica y reportes</h2>
          <p className="text-sm text-gray-600">
            Indicadores clave para presentar en directorio o exportar a BI.
          </p>
        </div>
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricStack label="Retención jugadores" value={`${summary.totals.players ? Math.round((summary.totals.activePlayers30d / summary.totals.players) * 100) : 0}%`} tone="text-gray-900" />
        <MetricStack label="Retención organizadores" value={`${summary.totals.organizers ? Math.round((summary.totals.activeOrganizers30d / summary.totals.organizers) * 100) : 0}%`} tone="text-gray-900" />
        <MetricStack label="Tasa de llenado" value={`${Math.round(fillRate * 100)}%`} tone="text-gray-900" />
        <MetricStack label="Canchas activas" value={`${venues.totals.active}`} tone="text-gray-900" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Actividad de usuarios</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-gray-600">Jugadores activos 30d</span>
              <span className="font-semibold text-gray-900">{summary.totals.activePlayers30d}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-gray-600">Organizadores activos 30d</span>
              <span className="font-semibold text-gray-900">{summary.totals.activeOrganizers30d}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-gray-600">Nuevas sesiones 30d</span>
              <span className="font-semibold text-gray-900">{users.recentLogins.length}</span>
            </li>
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500">Canchas con mejor desempeño</p>
          <ul className="space-y-2 text-sm">
            {venues.list.slice(0, 5).map((venue) => (
              <li key={venue.id} className="flex items-center justify-between">
                <span className="text-gray-600">{venue.name}</span>
                <span className="font-semibold text-gray-900">{formatCurrencyCLP(venue.revenueApproved30d)}</span>
              </li>
            ))}
            {venues.list.length === 0 ? (
              <li className="text-xs text-gray-500">Sin canchas registradas.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

type ConfigTabProps = Record<string, never>;

function ConfigTab(_: ConfigTabProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Configuración global</h2>
          <p className="text-sm text-gray-600">
            Parámetros corporativos vigentes en PichangApp.
          </p>
        </div>
        <Settings2 className="h-5 w-5 text-gray-400" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.values(VENUE_PLANS).map((plan) => (
          <div key={plan.slug} className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-500">
              <span>Plan {plan.name}</span>
              <span>{plan.priceLabel}</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">Comisión {Math.round(plan.commissionRate * 100)}%</p>
            <ul className="space-y-1 text-xs text-gray-600">
              {plan.features.slice(0, 3).map((feature) => (
                <li key={`${plan.slug}-${feature}`}>• {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-500">
        <p>
          Los parámetros avanzados de Mercado Pago y webhooks se administran desde la configuración del entorno.
          Revisa el repositorio para actualizar claves seguras y URLs.
        </p>
      </div>
    </section>
  );
}

type AlertsTabProps = { data: AdminOverviewResponse };

function AlertsTab({ data }: AlertsTabProps) {
  const alerts: Array<{ id: string; title: string; description: string; tone: string }> = [];

  if (data.summary.revenue.pending > 0) {
    alerts.push({
      id: "pending-payments",
      title: "Pagos pendientes por liquidar",
      description: `Hay ${formatCurrencyCLP(data.summary.revenue.pending)} esperando confirmación de Mercado Pago.`,
      tone: "text-amber-700",
    });
  }

  const suspendedUsers = data.users.list.filter((user) => user.disabledAt).length;
  if (suspendedUsers > 0) {
    alerts.push({
      id: "suspended-users",
      title: "Cuentas suspendidas",
      description: `${suspendedUsers} usuarios están con acceso restringido. Revisa si corresponde reactivar.`,
      tone: "text-rose-700",
    });
  }

  const unverifiedVenues = data.venues.list.filter((venue) => !venue.verified).length;
  if (unverifiedVenues > 0) {
    alerts.push({
      id: "unverified-venues",
      title: "Canchas pendientes de verificación",
      description: `${unverifiedVenues} canchas necesitan revisión antes de publicar nuevos partidos.`,
      tone: "text-sky-700",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "all-good",
      title: "Sin alertas críticas",
      description: "El sistema opera sin incidencias relevantes en este momento.",
      tone: "text-emerald-700",
    });
  }

  return (
    <section className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alertas y notificaciones</h2>
          <p className="text-sm text-gray-600">Monitorea eventos que requieren acción del equipo admin.</p>
        </div>
        <BellRing className="h-5 w-5 text-gray-400" />
      </div>

      <ul className="space-y-3 text-sm">
        {alerts.map((alert) => (
          <li key={alert.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className={cn("text-sm font-semibold", alert.tone)}>{alert.title}</p>
            <p className="text-xs text-gray-600">{alert.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type AdminsTabProps = { data: AdminOverviewResponse };

function AdminsTab({ data }: AdminsTabProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Administradores y roles</h2>
          <p className="text-sm text-gray-600">
            Lista de cuentas con permisos elevados y su última actividad registrada.
          </p>
        </div>
        <UserCog className="h-5 w-5 text-gray-400" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Administrador</th>
              <th className="px-4 py-3 text-left font-medium">Rol</th>
              <th className="px-4 py-3 text-left font-medium">Último acceso</th>
              <th className="px-4 py-3 text-left font-medium">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.admins.list.map((admin) => (
              <tr key={admin.id} className="bg-white">
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">{admin.name ?? admin.email ?? "Admin"}</div>
                  <div className="text-xs text-gray-500">{admin.email ?? "Sin correo"}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{roleLabel(admin.role)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(admin.lastLoginAt)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(admin.createdAt)}</td>
              </tr>
            ))}
            {data.admins.list.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No hay administradores registrados.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type SupportTabProps = { data: AdminOverviewResponse };

function SupportTab({ data }: SupportTabProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
      <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Soporte y feedback</h2>
            <p className="text-sm text-gray-600">
              Centraliza tickets de jugadores o canchas y mide tiempos de respuesta.
            </p>
          </div>
          <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Aún no integramos un sistema de tickets en la base de datos. Puedes revisar las bandejas de correo corporativas para dar seguimiento.
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Actividad reciente</h3>
        <p className="text-sm text-gray-600">
          En los últimos 30 días registramos {data.users.recentLogins.length} inicios de sesión únicos. Utiliza esta sección para comunicar mantenimientos o avisos importantes.
        </p>
        <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100">
          <SendIcon /> Enviar broadcast por correo
        </button>
        <p className="text-xs text-gray-500">
          El envío masivo requiere configurar la integración de correo transactional en el backend.
        </p>
      </div>
    </section>
  );
}

function SendIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.293 2.293a1 1 0 0 1 1.074-.217l14 5a1 1 0 0 1 0 1.848l-14 5A1 1 0 0 1 2 13.999V6.618a1 1 0 0 1 .293-.707l3-3a1 1 0 1 1 1.414 1.414L4 7.414V12.5l10.382-3.707L4 5.086V6.586l1.707-1.707a1 1 0 0 1 1.414 1.414l-3 3A1 1 0 0 1 3 9.414V4a1 1 0 0 1 .293-.707Z" fill="currentColor" /></svg>;
}
