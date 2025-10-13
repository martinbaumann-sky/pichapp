"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  MapPin,
  MessageSquare,
  PlugZap,
  Loader2,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  Unplug,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import { VENUE_PLANS, getVenuePlan, isPaidVenuePlan } from "@/lib/venuePlans";

type PanelMatch = {
  id: string;
  title: string;
  status: string;
  startsAt: string;
  totalSpots: number;
  pricePerSpot: number;
  venueName?: string | null;
  venueAddress?: string | null;
  paidSpots: number;
  reservedSpots: number;
};

type PanelBooking = {
  id: string;
  status: string;
  team?: string | null;
  position?: string | null;
  createdAt: string;
  matchId: string;
  matchTitle: string;
  matchStartsAt: string;
  matchVenueName?: string | null;
  playerId?: string | null;
  playerName: string;
  playerEmail?: string | null;
};

type PanelPayment = {
  id: string;
  amountCLP: number;
  status: string;
  provider: string;
  createdAt: string;
  matchId: string;
  matchTitle: string;
  playerId?: string | null;
  playerName: string;
  playerEmail?: string | null;
};

type VenueSubscriptionSummary = {
  id: string;
  plan: string;
  status: string;
  createdAt: string;
  activatedAt: string | null;
  canceledAt: string | null;
  nextChargeAt: string | null;
  lastChargeAt: string | null;
  mpPreapprovalId: string | null;
};

type PanelData = {
  venue: {
    id: string;
    name: string;
    address: string;
    comuna: string;
    lat: number | null;
    lng: number | null;
    plan: string;
    verified: boolean;
    payoutEmail: string;
    taxId: string;
    phone: string | null;
    accountHolder: string;
    mpCollectorId: string | null;
    mpAccountType: string | null;
    paymentProvider: string | null;
    flowEnv?: string | null;
    flowConnection: { configured: boolean; env: string };
    mpConnection: {
      connected: boolean;
      mpUserId: string | null;
      expiresAt: string | null;
    };
    fields: Array<{ id: string; name: string }>;
    subscriptions: VenueSubscriptionSummary[];
  };
  matches: PanelMatch[];
  bookings: PanelBooking[];
  payments: PanelPayment[];
  metrics: {
    totalRevenue: number;
    totalMatches: number;
    totalPaidSpots: number;
    fillRate: number;
    upcomingMatch: (PanelMatch & { venueAddress?: string | null }) | null;
  };
};

const tabs = [
  { id: "matches", label: "Partidos", icon: Ticket },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "bookings", label: "Reservas", icon: ClipboardList },
  { id: "payments", label: "Pagos", icon: CreditCard },
  { id: "billing", label: "Planes y upgrade", icon: CreditCard },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "settings", label: "Ajustes", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

type PaymentProviderChoice = "MP" | "FLOW";
type FlowEnvChoice = "PROD" | "SANDBOX";

export default function VenueDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("matches");
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (!tabParam) return;
    if (!tabs.some((tab) => tab.id === tabParam)) return;
    setActiveTab((current) => (current === tabParam ? current : (tabParam as TabId)));
  }, []);

  const role = useMemo(() => {
    if (!user) return null;
    if (user.role) return user.role;
    if (user.isAdmin) return "superadmin";
    return null;
  }, [user]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/venue/dashboard", { cache: "no-store" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || "No pudimos cargar tu panel");
      }
      const payload = (await res.json()) as PanelData;
      setData(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/cancha/ingresar");
      return;
    }
    if (role !== "venue_admin" && role !== "superadmin") {
      router.replace("/cancha");
      return;
    }
    fetchData();
  }, [authLoading, user, role, router, fetchData]);

  const reloadPage = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const isVenueVerified = Boolean(data?.venue?.verified);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-10 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Gestión de cancha
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel de cancha</h1>
                <p className="mt-2 max-w-xl text-sm text-gray-600">
                  Administra tus partidos, sigue tus métricas financieras y ofrece una mejor experiencia a tus jugadores desde un solo lugar.
                </p>
              </div>
              {data?.venue ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    {data.venue.name} · {data.venue.comuna}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/60 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                    <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> Plan {String(data.venue.plan ?? "básico").toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                      isVenueVerified
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/10 text-amber-700",
                    )}
                  >
                    {isVenueVerified ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldAlert className="h-3.5 w-3.5" />
                    )}
                    {isVenueVerified ? "Cancha verificada" : "Verificación en proceso"}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/panel/cancha/partidos/nuevo"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
              >
                <Ticket className="h-4 w-4 transition group-hover:scale-110" />
                Crear partido
              </Link>
              <button
                type="button"
                onClick={reloadPage}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white"
                aria-label="Actualizar panel"
              >
                <RefreshCw className="h-4 w-4" /> Actualizar
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <MetricsSummary data={data?.metrics} loading={loading} verified={isVenueVerified} />

        <div className="mt-8 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-full border border-white/70 bg-white/80 p-1 shadow-inner backdrop-blur">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const iconClasses = isActive ? "text-white" : "text-emerald-500/80";
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow"
                      : "text-gray-600 hover:text-emerald-700",
                  )}
                >
                  <Icon className={cn("h-4 w-4", iconClasses)} aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">
          {activeTab === "matches" ? (
            <MatchesTab loading={loading} matches={data?.matches ?? []} />
          ) : activeTab === "calendar" ? (
            <CalendarTab loading={loading} matches={data?.matches ?? []} />
          ) : activeTab === "bookings" ? (
            <BookingsTab loading={loading} bookings={data?.bookings ?? []} />
          ) : activeTab === "payments" ? (
            <PaymentsTab loading={loading} payments={data?.payments ?? []} />
          ) : activeTab === "billing" ? (
            <BillingTab loading={loading} venue={data?.venue ?? null} onRefresh={fetchData} />
          ) : activeTab === "reports" ? (
            <ReportsTab loading={loading} data={data} />
          ) : activeTab === "settings" ? (
            <SettingsTab loading={loading} data={data} onSaved={fetchData} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricsSummary({
  data,
  loading,
  verified,
}: {
  data: PanelData["metrics"] | undefined;
  loading: boolean;
  verified: boolean;
}) {
  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-28 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const upcoming = data.upcomingMatch;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <MetricCard
        title="Ingresos aprobados"
        value={formatCurrency(data.totalRevenue)}
        subtitle="Pagos con estado aprobado"
      />
      <MetricCard
        title="Cupos pagados"
        value={data.totalPaidSpots.toString()}
        subtitle={`${Math.round((data.fillRate || 0) * 100)}% de ocupación`}
      />
      <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur">
        <div className="absolute -left-8 -top-12 h-28 w-28 rounded-full bg-sky-200/30 blur-2xl" aria-hidden />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-gray-600">
          Próximo partido
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold",
              verified ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700",
            )}
          >
            {verified ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {verified ? "Verificada" : "Verificación pendiente"}
          </span>
        </div>
        {upcoming ? (
          <div className="mt-4 space-y-2 text-sm text-gray-700">
            <p className="text-lg font-semibold text-gray-900">{upcoming.title}</p>
            <p className="text-xs uppercase tracking-wider text-emerald-700">{formatDateTime(upcoming.startsAt)}</p>
            {upcoming.venueName ? (
              <p className="text-xs text-gray-500">{upcoming.venueName}</p>
            ) : null}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
              <span>Cupos confirmados</span>
              <span>
                {upcoming.paidSpots} / {upcoming.totalSpots}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
                style={{ width: `${Math.min(100, (upcoming.paidSpots / upcoming.totalSpots) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Aún no tienes partidos programados.</p>
        )}
      </div>
    </div>
  );
}

function MatchesTab({ loading, matches }: { loading: boolean; matches: PanelMatch[] }) {
  if (loading && matches.length === 0) {
    return (
      <div className="space-y-4">
        {[0, 1].map((key) => (
          <div key={key} className="h-32 rounded-3xl border border-white/60 bg-white/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!loading && matches.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-10 text-center text-sm text-gray-600 shadow-sm backdrop-blur">
        <p className="text-lg font-semibold text-gray-900">Aún no publicas partidos.</p>
        <p className="mt-2 text-sm text-gray-600">Crea tu primer partido para que los jugadores puedan reservar y pagar sus cupos.</p>
        <Link
          href="/panel/cancha/partidos/nuevo"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          Crear partido
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {matches.map((match) => {
        const paidRatio = match.totalSpots > 0 ? Math.round((match.paidSpots / match.totalSpots) * 100) : 0;
        return (
          <article
            key={match.id}
            className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur"
          >
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">{match.title}</h3>
                <p className="text-sm text-gray-600">{formatDateTime(match.startsAt)}</p>
                {match.venueName ? (
                  <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                    {match.venueName}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                  matchStatusClass(match.status),
                )}
              >
                {match.status}
              </span>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-4 text-sm text-gray-600 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                <span className="block text-xs uppercase tracking-wide text-gray-400">Cupos</span>
                <span className="mt-1 block text-lg font-semibold text-gray-900">
                  {match.paidSpots} / {match.totalSpots}
                </span>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                <span className="block text-xs uppercase tracking-wide text-gray-400">Reservados</span>
                <span className="mt-1 block text-lg font-semibold text-gray-900">{match.reservedSpots}</span>
              </div>
              <div className="rounded-2xl bg-white/70 p-4 shadow-sm">
                <span className="block text-xs uppercase tracking-wide text-gray-400">Precio por cupo</span>
                <span className="mt-1 block text-lg font-semibold text-gray-900">{formatCurrency(match.pricePerSpot)}</span>
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-white/70 p-4 shadow-sm">
                <Link
                  href={`/partidos/${match.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  Ver detalle
                </Link>
              </div>
            </div>
            <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
                style={{ width: `${Math.min(100, paidRatio)}%` }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CalendarTab({ loading, matches }: { loading: boolean; matches: PanelMatch[] }) {
  const upcoming = useMemo(
    () =>
      matches
        .filter((match) => new Date(match.startsAt) >= new Date())
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [matches],
  );

  if (loading && upcoming.length === 0) {
    return <div className="h-52 rounded-3xl border border-white/60 bg-white/60 animate-pulse" />;
  }

  if (upcoming.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-10 text-center text-sm text-gray-600 shadow-sm backdrop-blur">
        No hay partidos próximos. Programa uno nuevo para llenar tu calendario.
      </div>
    );
  }

  const grouped = upcoming.reduce<Record<string, PanelMatch[]>>((acc, match) => {
    const key = new Date(match.startsAt).toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    acc[key] = acc[key] ? [...acc[key], match] : [match];
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([day, items]) => (
        <div
          key={day}
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur"
        >
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{day}</h3>
          <div className="mt-3 space-y-3">
            {items.map((match) => (
              <div
                key={match.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-900">{match.title}</p>
                  <p className="text-xs uppercase tracking-wider text-emerald-700">{formatTime(match.startsAt)}</p>
                  {match.venueName ? (
                    <p className="text-xs text-gray-500">{match.venueName}</p>
                  ) : null}
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  {match.paidSpots} pagados · {match.reservedSpots} reservados
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookingsTab({ loading, bookings }: { loading: boolean; bookings: PanelBooking[] }) {
  if (loading && bookings.length === 0) {
    return <div className="h-64 rounded-3xl border border-white/60 bg-white/60 animate-pulse" />;
  }

  if (!loading && bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-10 text-center text-sm text-gray-600 shadow-sm backdrop-blur">
        Aún no recibes reservas pagadas. Comparte tus partidos para comenzar a llenar cupos.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reservas</h2>
          <p className="text-sm text-gray-600">Controla jugadores confirmados y su estado de pago.</p>
        </div>
        <Link
          href="/panel/cancha/reservas/export"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white"
        >
          Exportar CSV
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-white/60 text-sm">
          <thead className="bg-white/60 text-left text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <tr>
              <th scope="col" className="px-4 py-3">
                Jugador
              </th>
              <th scope="col" className="px-4 py-3">
                Partido
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="px-4 py-3">
                Equipo
              </th>
              <th scope="col" className="px-4 py-3">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {bookings.map((booking) => (
              <tr key={booking.id} className="transition hover:bg-white/60">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div>{booking.playerName}</div>
                  {booking.playerEmail ? <div className="text-xs text-gray-500">{booking.playerEmail}</div> : null}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="font-medium text-gray-900">{booking.matchTitle}</div>
                  <div className="text-xs text-gray-500">{formatDateTime(booking.matchStartsAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={booking.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {booking.team || booking.position ? `${booking.team ?? "-"} / ${booking.position ?? "-"}` : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(booking.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab({ loading, payments }: { loading: boolean; payments: PanelPayment[] }) {
  if (loading && payments.length === 0) {
    return <div className="h-56 rounded-3xl border border-white/60 bg-white/60 animate-pulse" />;
  }

  if (!loading && payments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/60 bg-white/70 p-10 text-center text-sm text-gray-600 shadow-sm backdrop-blur">
        Aún no recibes pagos confirmados. Comparte tus enlaces de partidos para generar reservas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(payment.amountCLP)} · {payment.matchTitle}
            </p>
            <p className="text-xs text-gray-500">
              {payment.playerName} · {formatDateTime(payment.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-emerald-700">
            <span className="rounded-full border border-emerald-200 bg-white/70 px-2 py-1 uppercase tracking-wide">
              {payment.provider}
            </span>
            <StatusBadge status={payment.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function BillingTab({
  loading,
  venue,
  onRefresh,
}: {
  loading: boolean;
  venue: PanelData["venue"] | null;
  onRefresh: () => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = useMemo(() => getVenuePlan(venue?.plan ?? "gratis"), [venue?.plan]);
  const subscriptions = venue?.subscriptions ?? [];
  const activeSubscription = useMemo(
    () => subscriptions.find((sub) => sub.status === "ACTIVE" || sub.status === "PAUSED") ?? null,
    [subscriptions],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("planStatus");
    const success = params.get("planSuccess");
    if (status && success === "1") {
      const info = getVenuePlan(status);
      if (info) {
        setMessage(`Plan ${info.name} activado correctamente.`);
        params.delete("planStatus");
        params.delete("planSuccess");
        window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, [venue?.plan]);

  const handleCheckout = async (planSlug: string) => {
    try {
      setError(null);
      setMessage(null);
      setProcessing(planSlug);
      const payload = {
        plan: planSlug,
        returnUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/panel/cancha?tab=billing&planStatus=${planSlug}&planSuccess=1`
            : undefined,
      };
      const response = await fetch("/api/venue/plans/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "No pudimos iniciar el checkout");
      }
      const data = (await response.json()) as {
        checkoutUrl?: string | null;
        redirectUrl?: string | null;
        plan?: { slug: string };
      };
      if (data.checkoutUrl) {
        if (typeof window !== "undefined") {
          window.location.href = data.checkoutUrl;
        }
      } else {
        await onRefresh();
        setMessage("Tu plan gratis quedó activo.");
        if (data.redirectUrl && typeof window !== "undefined") {
          window.history.replaceState({}, "", data.redirectUrl);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async () => {
    try {
      setError(null);
      setMessage(null);
      setProcessing("cancel");
      const response = await fetch("/api/venue/plans/cancel", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "No pudimos cancelar tu suscripción");
      }
      await onRefresh();
      setMessage("Tu suscripción fue cancelada. Volviste al plan Gratis.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setProcessing(null);
    }
  };

  if (!venue && loading) {
    return <div className="h-40 rounded-3xl border border-white/60 bg-white/70 animate-pulse" />;
  }

  if (!venue) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-sm text-amber-800">
        Registra tu cancha para contratar un plan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tu plan actual</h2>
            <p className="text-sm text-gray-600">
              {currentPlan
                ? `Plan ${currentPlan.name} · ${currentPlan.commissionLabel}`
                : `Plan ${venue.plan.toUpperCase()}`}
            </p>
            {activeSubscription?.nextChargeAt ? (
              <p className="text-xs text-gray-500">
                Próxima renovación: {formatDateTime(activeSubscription.nextChargeAt)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1">
              {activeSubscription ? "Suscripción activa" : "Sin suscripción"}
            </span>
            {currentPlan?.slug !== "gratis" ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1 text-white">
                Comisión {Math.round((currentPlan?.commissionRate ?? 0) * 100)}%
              </span>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900">Planes disponibles</h3>
        <p className="mt-1 text-sm text-gray-600">
          Elige el plan que mejor se ajusta al volumen de tu cancha. Las suscripciones se renuevan automáticamente cada mes.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {Object.values(VENUE_PLANS).map((plan) => {
            const isCurrent = currentPlan?.slug === plan.slug;
            const isProcessing = processing === plan.slug;
            const canDowngrade = plan.slug === "gratis" && currentPlan?.slug !== "gratis";
            const label = isCurrent
              ? "Plan actual"
              : canDowngrade
              ? "Volver a Gratis"
              : "Contratar plan";
            const disabled = isCurrent && plan.slug !== "gratis";
            return (
              <div
                key={plan.slug}
                className={cn(
                  "rounded-3xl border p-6 shadow-sm transition",
                  plan.highlight ? "border-gray-900 bg-white shadow-xl" : "border-gray-200 bg-white/90",
                )}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                      {plan.name}
                    </span>
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Actual
                      </span>
                    ) : null}
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{plan.priceLabel}</div>
                  <div className="text-sm font-semibold text-emerald-600">{plan.commissionLabel}</div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => handleCheckout(plan.slug)}
                  disabled={disabled || processing !== null}
                  className={cn(
                    "mt-6 w-full rounded-full px-4 py-2 text-sm font-semibold transition",
                    disabled
                      ? "cursor-not-allowed bg-gray-200 text-gray-500"
                      : plan.highlight
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20",
                  )}
                >
                  {isProcessing ? "Redirigiendo…" : label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeSubscription && isPaidVenuePlan(currentPlan?.slug ?? "gratis") ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-red-800">¿Deseas cancelar tu suscripción?</p>
              <p className="text-sm text-red-600">
                Al cancelar volverás al plan Gratis al finalizar el ciclo vigente. Los cobros recurrentes se detendrán.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              disabled={processing !== null}
              className="inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed"
            >
              {processing === "cancel" ? "Cancelando…" : "Cancelar suscripción"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
        <h3 className="text-lg font-semibold text-gray-900">Historial de suscripciones</h3>
        {subscriptions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Aún no hay suscripciones registradas.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {subscriptions.map((sub) => {
              const plan = getVenuePlan(sub.plan);
              return (
                <div
                  key={sub.id}
                  className="flex flex-col gap-2 rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{plan ? `Plan ${plan.name}` : sub.plan}</p>
                    <p className="text-xs text-gray-500">Creado el {formatDateTime(sub.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 text-xs text-gray-600 sm:items-end">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 font-semibold uppercase tracking-widest text-gray-600">
                      {sub.status}
                    </span>
                    {sub.nextChargeAt ? <span>Próximo cobro: {formatDateTime(sub.nextChargeAt)}</span> : null}
                    {sub.lastChargeAt ? <span>Último cobro: {formatDateTime(sub.lastChargeAt)}</span> : null}
                    {sub.mpPreapprovalId ? (
                      <span className="font-mono text-[11px] text-gray-400">ID: {sub.mpPreapprovalId}</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsTab({ loading, data }: { loading: boolean; data: PanelData | null }) {
  if (loading && !data) {
    return <div className="h-40 rounded-3xl border border-white/60 bg-white/60 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
      <h2 className="text-xl font-semibold text-gray-900">Resumen</h2>
      <p className="mt-2 text-sm text-gray-600">Indicadores clave de tus partidos en la plataforma.</p>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Partidos publicados" value={data.metrics.totalMatches.toString()} subtitle="Últimos 100" />
        <MetricCard
          title="Cupos pagados"
          value={data.metrics.totalPaidSpots.toString()}
          subtitle={`${Math.round(data.metrics.fillRate * 100)}% ocupación`}
        />
        <MetricCard title="Ingresos" value={formatCurrency(data.metrics.totalRevenue)} subtitle="Pagos aprobados" />
        <MetricCard
          title="Plan"
          value={data.venue.plan === "pro" ? "Pro" : "Gratis"}
          subtitle={data.venue.verified ? "Cancha verificada" : "Verificación pendiente"}
        />
      </div>
    </div>
  );
}

function SettingsTab({
  loading,
  data,
  onSaved,
}: {
  loading: boolean;
  data: PanelData | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    taxId: "",
    address: "",
    comuna: "",
    payoutEmail: "",
    accountHolder: "",
    phone: "",
    fields: "",
    mpCollectorId: "",
    mpAccountType: "",
    paymentProvider: "MP" as PaymentProviderChoice,
    flowEnv: "SANDBOX" as FlowEnvChoice,
    flowApiKey: "",
    flowSecretKey: "",
  });
  const [flowConfigured, setFlowConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mpLoading, setMpLoading] = useState<"connect" | "disconnect" | null>(null);
  const [mpMessage, setMpMessage] = useState<string | null>(null);
  const [mpError, setMpError] = useState<string | null>(null);

  const accountTypeOptions = useMemo(
    () => [
      { value: "Persona", label: "Persona natural" },
      { value: "Empresa", label: "Empresa / Sociedad" },
      { value: "Fundación", label: "Fundación u ONG" },
    ],
    [],
  );

  const paymentProviderOptions = useMemo(
    () => [
      { value: "MP" as PaymentProviderChoice, label: "Mercado Pago" },
      { value: "FLOW" as PaymentProviderChoice, label: "Flow (Chile)" },
    ],
    [],
  );

  const flowEnvOptions = useMemo(
    () => [
      { value: "SANDBOX" as FlowEnvChoice, label: "Sandbox (pruebas)" },
      { value: "PROD" as FlowEnvChoice, label: "Producción" },
    ],
    [],
  );

  useEffect(() => {
    if (!data?.venue) return;
    const provider = data.venue.paymentProvider === "FLOW" ? "FLOW" : "MP";
    const env = data.venue.flowConnection?.env === "PROD" ? "PROD" : "SANDBOX";
    setForm({
      name: data.venue.name ?? "",
      taxId: data.venue.taxId ?? "",
      address: data.venue.address ?? "",
      comuna: data.venue.comuna ?? "",
      payoutEmail: data.venue.payoutEmail ?? "",
      accountHolder: data.venue.accountHolder ?? "",
      phone: data.venue.phone ?? "",
      fields: data.venue.fields.map((field) => field.name).join("\n"),
      mpCollectorId: data.venue.mpCollectorId ?? "",
      mpAccountType: data.venue.mpAccountType ?? "",
      paymentProvider: provider,
      flowEnv: env,
      flowApiKey: "",
      flowSecretKey: "",
    });
    setFlowConfigured(Boolean(data.venue.flowConnection?.configured));
  }, [data]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mpStatus = params.get("mp");
    if (!mpStatus) return;
    if (mpStatus === "connected") {
      setMpError(null);
      setMpMessage("Tu cuenta de Mercado Pago quedó conectada correctamente.");
      onSaved();
    } else if (mpStatus === "error") {
      const reason = params.get("reason");
      setMpMessage(null);
      setMpError(reason ? `No pudimos conectar Mercado Pago: ${reason}` : "No pudimos conectar Mercado Pago.");
    }
    params.delete("mp");
    params.delete("reason");
    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [onSaved]);

  if (loading && !data) {
    return <div className="h-48 rounded-3xl border border-white/60 bg-white/60 animate-pulse" />;
  }

  if (!data) return null;

  const mpConnection = data.venue.mpConnection;
  const mpConnected = Boolean(mpConnection?.connected);
  const mpUserId = mpConnection?.mpUserId ?? null;
  const mpExpiresLabel = mpConnection?.expiresAt ? formatDateTime(mpConnection.expiresAt) : null;

  const handleConnectMp = async () => {
    try {
      if (!data?.venue?.id) {
        throw new Error("No encontramos tu cancha. Actualiza la página e intenta nuevamente.");
      }
      setMpError(null);
      setMpMessage(null);
      setMpLoading("connect");
      const res = await fetch("/api/mp/oauth/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: data.venue.id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "No pudimos iniciar la conexión con Mercado Pago.");
      }
      const url = typeof payload?.url === "string" ? payload.url : null;
      if (!url) {
        throw new Error("No recibimos el enlace de Mercado Pago. Intenta nuevamente.");
      }
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos iniciar la conexión con Mercado Pago.";
      setMpError(message);
    } finally {
      setMpLoading(null);
    }
  };

  const handleDisconnectMp = async () => {
    try {
      if (!data?.venue?.id) {
        throw new Error("No encontramos tu cancha. Actualiza la página e intenta nuevamente.");
      }
      if (typeof window !== "undefined") {
        const confirmed = window.confirm(
          "¿Seguro que quieres desconectar Mercado Pago? Los partidos pagados quedarán bloqueados hasta volver a conectar.",
        );
        if (!confirmed) {
          return;
        }
      }
      setMpError(null);
      setMpMessage(null);
      setMpLoading("disconnect");
      const res = await fetch("/api/venue/mp/disconnect", { method: "POST" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || "No pudimos desconectar Mercado Pago.");
      }
      setMpMessage("Desconectaste Mercado Pago. Conéctalo nuevamente antes de publicar partidos pagados.");
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos desconectar Mercado Pago.";
      setMpError(message);
    } finally {
      setMpLoading(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        taxId: form.taxId,
        address: form.address,
        comuna: form.comuna,
        payoutEmail: form.payoutEmail,
        accountHolder: form.accountHolder,
        phone: form.phone,
        fields: form.fields,
        paymentProvider: form.paymentProvider,
        flowEnv: form.flowEnv,
      };

      if (form.paymentProvider === "MP") {
        payload.mpCollectorId = form.mpCollectorId;
        payload.mpAccountType = form.mpAccountType;
      }

      if (form.paymentProvider === "FLOW") {
        if (form.flowApiKey.trim().length > 0) {
          payload.flowApiKey = form.flowApiKey.trim();
        }
        if (form.flowSecretKey.trim().length > 0) {
          payload.flowSecretKey = form.flowSecretKey.trim();
        }
      }

      const res = await fetch("/api/venue/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok || !responseBody?.ok) {
        throw new Error(responseBody?.error || "No pudimos guardar los cambios.");
      }

      const updatedVenue = responseBody.venue as PanelData["venue"] | undefined;
      if (updatedVenue) {
        const provider = updatedVenue.paymentProvider === "FLOW" ? "FLOW" : "MP";
        const env = updatedVenue.flowEnv === "PROD" ? "PROD" : "SANDBOX";
        setForm((prev) => ({
          ...prev,
          mpCollectorId: updatedVenue.mpCollectorId ?? "",
          mpAccountType: updatedVenue.mpAccountType ?? "",
          paymentProvider: provider,
          flowEnv: env,
          flowApiKey: "",
          flowSecretKey: "",
        }));
        const configured = "flowConnection" in updatedVenue
          ? (updatedVenue as any).flowConnection?.configured
          : responseBody.venue?.flowConfigured;
        setFlowConfigured(Boolean(configured));
      }

      setSuccess("Información guardada correctamente.");
      onSaved();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos guardar los cambios.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Información de la cancha</h2>
          <p className="mt-1 text-sm text-gray-600">Actualiza tu perfil para que los jugadores confíen y paguen con tranquilidad.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm text-gray-600">
            Nombre comercial de la cancha
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            RUT o identificación tributaria
            <input
              value={form.taxId}
              onChange={(event) => setForm((prev) => ({ ...prev, taxId: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              placeholder="12.345.678-9"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Dirección
            <input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Comuna
            <input
              value={form.comuna}
              onChange={(event) => setForm((prev) => ({ ...prev, comuna: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Correo para liquidaciones
            <input
              value={form.payoutEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, payoutEmail: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="email"
              placeholder="pagos@tucancha.cl"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Titular de la cuenta
            <input
              value={form.accountHolder}
              onChange={(event) => setForm((prev) => ({ ...prev, accountHolder: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              required
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Proveedor de cobros
            <select
              value={form.paymentProvider}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentProvider: (event.target.value === "FLOW" ? "FLOW" : "MP") as PaymentProviderChoice,
                }))
              }
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            >
              {paymentProviderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="mt-1 text-xs text-gray-400">Define cómo se procesarán los pagos en Chile. Puedes cambiarlo cuando necesites.</span>
          </label>
          {form.paymentProvider === "MP" ? (
            <>
              <label className="flex flex-col text-sm text-gray-600">
                Tipo de cuenta en Mercado Pago
                <select
                  value={form.mpAccountType}
                  onChange={(event) => setForm((prev) => ({ ...prev, mpAccountType: event.target.value }))}
                  className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  required
                >
                  <option value="">Selecciona una opción</option>
                  {accountTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  {form.mpAccountType && !accountTypeOptions.some((option) => option.value === form.mpAccountType) ? (
                    <option value={form.mpAccountType}>{form.mpAccountType}</option>
                  ) : null}
                </select>
                <span className="mt-1 text-xs text-gray-400">Debe coincidir con el tipo de titular configurado en Mercado Pago.</span>
              </label>
              <label className="flex flex-col text-sm text-gray-600">
                Collector ID de Mercado Pago
                <input
                  value={form.mpCollectorId}
                  onChange={(event) => setForm((prev) => ({ ...prev, mpCollectorId: event.target.value }))}
                  className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  placeholder="123456789"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                />
                <span className="mt-1 text-xs text-gray-400">Lo encuentras en Configuración &gt; Credenciales de Mercado Pago.</span>
              </label>
            </>
          ) : null}
          <label className="flex flex-col text-sm text-gray-600">
            Teléfono de contacto
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              placeholder="+56 9 1234 5678"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600 md:col-span-2">
            Tipos de cancha
            <textarea
              value={form.fields}
              onChange={(event) => setForm((prev) => ({ ...prev, fields: event.target.value }))}
              className="mt-1 h-28 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              placeholder="Ej: Cancha 1 - Pasto sintético\nCancha techada"
            />
            <span className="mt-1 text-xs text-gray-400">Una por línea. Máximo 12.</span>
          </label>
          {form.paymentProvider === "FLOW" ? (
            <div className="md:col-span-2 space-y-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 p-4">
              <p className="text-sm font-semibold text-emerald-900">Credenciales de Flow</p>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col text-xs text-emerald-900/80">
                  Ambiente de Flow
                  <select
                    value={form.flowEnv}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        flowEnv: (event.target.value === "PROD" ? "PROD" : "SANDBOX") as FlowEnvChoice,
                      }))
                    }
                    className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  >
                    {flowEnvOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-900/80">
                  {flowConfigured ? (
                    <span>✔️ Flow está configurado. Las credenciales guardadas se mantendrán si dejas los campos vacíos.</span>
                  ) : (
                    <span>Ingresa tu API Key y Secret Key de Flow Commerce para que los pagos lleguen directo a tu cuenta.</span>
                  )}
                </div>
              </div>
              <label className="flex flex-col text-xs text-emerald-900/80">
                API Key de Flow
                <input
                  value={form.flowApiKey}
                  onChange={(event) => setForm((prev) => ({ ...prev, flowApiKey: event.target.value }))}
                  className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  placeholder="Ingresa tu API Key de Flow"
                />
              </label>
              <label className="flex flex-col text-xs text-emerald-900/80">
                Secret Key de Flow
                <input
                  value={form.flowSecretKey}
                  onChange={(event) => setForm((prev) => ({ ...prev, flowSecretKey: event.target.value }))}
                  className="mt-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                  type="password"
                  placeholder="Ingresa tu Secret Key de Flow"
                />
              </label>
              <p className="text-xs text-emerald-900/70">
                Guardamos tus claves cifradas. Si dejas los campos vacíos mantendremos las credenciales actuales.
              </p>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{success}</div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
          <p className="text-xs text-gray-500">
            Estos datos se usan para mostrar tu perfil a los jugadores y procesar los pagos.
          </p>
        </div>
      </form>

      <div className="space-y-4">
        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900">Conexión con Mercado Pago</h3>
          <p className="mt-1 text-sm text-gray-600">
            Usa esta integración cuando Mercado Pago sea tu proveedor activo. Si eliges Flow, mantendremos tus credenciales por si deseas volver a Mercado Pago más adelante.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {mpConnected ? "Mercado Pago conectado" : "Mercado Pago desconectado"}
                </p>
                <p className="text-xs text-emerald-800/70">
                  {mpConnected
                    ? `Cuenta ${mpUserId ?? "vinculada"}. Token vigente hasta ${mpExpiresLabel ?? "actualizar conexión"}.`
                    : "Conecta Mercado Pago para recibir los pagos directamente en tu cuenta."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleConnectMp}
                  disabled={mpLoading === "connect"}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mpLoading === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} {mpConnected ? "Volver a conectar Mercado Pago" : "Conectar Mercado Pago"}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectMp}
                  disabled={!mpConnected || mpLoading === "disconnect"}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mpLoading === "disconnect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />} Desconectar Mercado Pago
                </button>
              </div>
            </div>
            {mpMessage ? <p className="mt-3 text-xs text-emerald-700">{mpMessage}</p> : null}
            {mpError ? <p className="mt-3 text-xs text-rose-600">{mpError}</p> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
          <h3 className="text-lg font-semibold text-gray-900">Verificación</h3>
          <p className="mt-2 text-sm text-gray-600">
            {data.venue.verified
              ? "Tu cancha está verificada. Puedes publicar partidos sin restricciones."
              : "Estamos revisando tu información. Publica con normalidad y te avisaremos cuando el sello de verificación esté activo."}
          </p>
        </div>
      </div>
    </div>
  );
}


function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-200/40 blur-2xl" aria-hidden />
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{title}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-gray-600">{subtitle}</div> : null}
    </div>
  );
}

function matchStatusClass(status: string | null | undefined) {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("cancel")) return "bg-rose-500/10 text-rose-700";
  if (normalized.includes("confirm")) return "bg-emerald-500/10 text-emerald-700";
  if (normalized.includes("pend") || normalized.includes("program")) {
    return "bg-amber-500/10 text-amber-700";
  }
  return "bg-slate-900/90 text-white";
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "paid" || normalized === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
      </span>
    );
  }
  if (normalized === "reserved" || normalized === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 shadow-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> En revisión
      </span>
    );
  }
  if (normalized === "refunded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/70 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 shadow-sm">
        <RefreshCw className="h-3.5 w-3.5" /> Reembolsado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-200/70 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {status}
    </span>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}











