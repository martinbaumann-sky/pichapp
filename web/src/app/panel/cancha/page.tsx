"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  RefreshCw,
  Settings,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

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
    fields: Array<{ id: string; name: string }>;
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
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "settings", label: "Ajustes", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function VenueDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("matches");
  const [data, setData] = useState<PanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const isVenueVerified = Boolean(data?.venue?.verified);

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de cancha</h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra tus partidos oficiales, revisa reservas y concilia tus pagos en un solo lugar.
            </p>
            {data?.venue ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                {data.venue.name} · {data.venue.comuna}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cancha"
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400"
            >
              Ver landing
            </Link>
            <Link
              href="/panel/cancha/partidos/nuevo"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Crear partido
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400"
              aria-label="Actualizar panel"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-4 w-4" /> Actualizar
              </span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <MetricsSummary data={data?.metrics} loading={loading} verified={isVenueVerified} />

        <div className="mt-8 overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
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
          ) : activeTab === "reports" ? (
            <ReportsTab loading={loading} data={data} />
          ) : activeTab === "settings" ? (
            <SettingsTab loading={loading} data={data} />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-500">
          Próximo partido
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
              verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
            )}
          >
            {verified ? "Cancha verificada" : "Verificación pendiente"}
          </span>
        </div>
        {upcoming ? (
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{upcoming.title}</p>
            <p>{formatDateTime(upcoming.startsAt)}</p>
            {upcoming.venueName ? (
              <p className="text-xs text-gray-500">{upcoming.venueName}</p>
            ) : null}
            <p className="text-xs text-gray-500">
              Cupos confirmados: {upcoming.paidSpots} / {upcoming.totalSpots}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Aún no tienes partidos programados.</p>
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
          <div key={key} className="h-32 rounded-3xl border border-gray-200 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!loading && matches.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
        <p className="font-semibold text-gray-900">Aún no publicas partidos.</p>
        <p className="mt-2">Crea tu primer partido para que los jugadores puedan reservar y pagar sus cupos.</p>
        <Link
          href="/panel/cancha/partidos/nuevo"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          Crear partido
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const paidRatio = match.totalSpots > 0 ? Math.round((match.paidSpots / match.totalSpots) * 100) : 0;
        return (
          <article key={match.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{match.title}</h3>
                <p className="text-sm text-gray-500">{formatDateTime(match.startsAt)}</p>
                {match.venueName ? (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {match.venueName}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {match.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600 sm:grid-cols-4">
              <div>
                <span className="block text-xs uppercase text-gray-400">Cupos</span>
                <span className="font-medium text-gray-900">
                  {match.paidSpots} / {match.totalSpots}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-400">Reservados</span>
                <span className="font-medium text-gray-900">{match.reservedSpots}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-400">Precio por cupo</span>
                <span className="font-medium text-gray-900">{formatCurrency(match.pricePerSpot)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" aria-hidden />
                <Link href={`/partidos/${match.id}`} className="text-sm font-semibold text-gray-900 hover:underline">
                  Ver detalle
                </Link>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, paidRatio)}%` }} />
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
    return <div className="h-52 rounded-3xl border border-gray-200 bg-gray-50 animate-pulse" />;
  }

  if (upcoming.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
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
    <div className="space-y-4">
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{day}</h3>
          <div className="mt-3 space-y-3">
            {items.map((match) => (
              <div key={match.id} className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{match.title}</p>
                  <p className="text-xs text-gray-500">{formatTime(match.startsAt)}</p>
                  {match.venueName ? (
                    <p className="text-xs text-gray-500">{match.venueName}</p>
                  ) : null}
                </div>
                <div className="text-xs text-gray-600">
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
    return <div className="h-64 rounded-3xl border border-gray-200 bg-gray-50 animate-pulse" />;
  }

  if (!loading && bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
        Aún no recibes reservas pagadas. Comparte tus partidos para comenzar a llenar cupos.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reservas</h2>
          <p className="text-sm text-gray-600">Controla jugadores confirmados y su estado de pago.</p>
        </div>
        <Link
          href="/panel/cancha/reservas/export"
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400"
        >
          Exportar CSV
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
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
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
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
    return <div className="h-56 rounded-3xl border border-gray-200 bg-gray-50 animate-pulse" />;
  }

  if (!loading && payments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-600">
        Aún no recibes pagos confirmados. Comparte tus enlaces de partidos para generar reservas.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(payment.amountCLP)} · {payment.matchTitle}
            </p>
            <p className="text-xs text-gray-500">
              {payment.playerName} · {formatDateTime(payment.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="rounded-full border border-gray-200 px-2 py-1 uppercase tracking-wide">
              {payment.provider}
            </span>
            <StatusBadge status={payment.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab({ loading, data }: { loading: boolean; data: PanelData | null }) {
  if (loading && !data) {
    return <div className="h-40 rounded-3xl border border-gray-200 bg-gray-50 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Resumen</h2>
      <p className="mt-2 text-sm text-gray-600">Indicadores clave de tus partidos en la plataforma.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

function SettingsTab({ loading, data }: { loading: boolean; data: PanelData | null }) {
  if (loading && !data) {
    return <div className="h-48 rounded-3xl border border-gray-200 bg-gray-50 animate-pulse" />;
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Datos de la cancha</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-gray-400">Nombre</dt>
            <dd className="font-medium text-gray-900">{data.venue.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-400">Dirección</dt>
            <dd className="font-medium text-gray-900">{data.venue.address}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-400">Comuna</dt>
            <dd className="font-medium text-gray-900">{data.venue.comuna}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-400">Correo de pagos</dt>
            <dd className="font-medium text-gray-900">{data.venue.payoutEmail}</dd>
          </div>
        </dl>
        {data.venue.fields.length > 0 ? (
          <div className="mt-4 text-xs text-gray-500">
            Tipos de cancha: {data.venue.fields.map((field) => field.name).join(", ")}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Verificación</h3>
        <p className="mt-2 text-sm text-gray-600">
          {data.venue.verified
            ? "Tu cancha está verificada. Puedes publicar partidos sin restricciones."
            : "Estamos revisando tu información. Publica con normalidad y te avisaremos cuando el sello de verificación esté activo."}
        </p>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "paid" || normalized === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Pagado
      </span>
    );
  }
  if (normalized === "reserved" || normalized === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        En revisión
      </span>
    );
  }
  if (normalized === "refunded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
        Reembolsado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
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
