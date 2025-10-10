"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarRange,
  CheckCircle,
  Download,
  ExternalLink,
  LineChart,
  Loader2,
  MailWarning,
  RefreshCcw,
  ShieldCheck,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/constants/admin";
import { formatCurrencyCLP, formatPercentage } from "@/utils/formatters";
interface ActivityEntry {
  hour: string;
  total: number;
  players: number;
  organizers: number;
}

interface MatchMetric {
  published: number;
  confirmed: number;
  cancelled: number;
  fillRate: number;
  trend: number;
}

interface RevenueMetric {
  total: number;
  commissions: number;
  avgTicket: number;
  trend: number;
}

interface VenuePayout {
  venue: string;
  comuna: string;
  amount: number;
  matches: number;
}

interface PaymentItem {
  id: string;
  amount: number;
  venue: string;
  match: string;
  date: string;
  status: "approved" | "pending" | "failed";
  method: string;
}

interface SystemAlert {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

const BASE_ACTIVITY: ActivityEntry[] = [
  { hour: "09:00", players: 18, organizers: 4, total: 22 },
  { hour: "10:00", players: 24, organizers: 5, total: 29 },
  { hour: "11:00", players: 31, organizers: 6, total: 37 },
  { hour: "12:00", players: 36, organizers: 7, total: 43 },
  { hour: "13:00", players: 28, organizers: 6, total: 34 },
  { hour: "14:00", players: 26, organizers: 5, total: 31 },
  { hour: "15:00", players: 32, organizers: 7, total: 39 },
  { hour: "16:00", players: 41, organizers: 8, total: 49 },
  { hour: "17:00", players: 48, organizers: 9, total: 57 },
  { hour: "18:00", players: 56, organizers: 10, total: 66 },
  { hour: "19:00", players: 63, organizers: 11, total: 74 },
  { hour: "20:00", players: 59, organizers: 10, total: 69 },
];

const MATCH_METRICS: Record<"today" | "week" | "month", MatchMetric> = {
  today: { published: 26, confirmed: 18, cancelled: 1, fillRate: 0.84, trend: 0.12 },
  week: { published: 148, confirmed: 109, cancelled: 6, fillRate: 0.81, trend: 0.17 },
  month: { published: 612, confirmed: 468, cancelled: 21, fillRate: 0.83, trend: 0.22 },
};

const REVENUE_METRICS: Record<"week" | "month" | "quarter", RevenueMetric> = {
  week: { total: 4285000, commissions: 462000, avgTicket: 86900, trend: 0.08 },
  month: { total: 17842000, commissions: 1846000, avgTicket: 89400, trend: 0.14 },
  quarter: { total: 53488000, commissions: 5521000, avgTicket: 90100, trend: 0.18 },
};

const VENUE_PAYOUTS: VenuePayout[] = [
  { venue: "Club Deportivo Ñuñoa", comuna: "Ñuñoa", amount: 3248000, matches: 42 },
  { venue: "Estadio Lo Barnechea", comuna: "Lo Barnechea", amount: 2875000, matches: 36 },
  { venue: "Santa Rosa Fútbol Park", comuna: "La Florida", amount: 2569000, matches: 33 },
  { venue: "Complejo Sporting Maipú", comuna: "Maipú", amount: 1984000, matches: 27 },
  { venue: "Las Condes Arena", comuna: "Las Condes", amount: 1746000, matches: 22 },
];

const TOTAL_PAID_TO_VENUES = VENUE_PAYOUTS.reduce((sum, item) => sum + item.amount, 0);

const LATEST_PAYMENTS: PaymentItem[] = [
  {
    id: "pay_5902",
    amount: 68000,
    venue: "Club Deportivo Ñuñoa",
    match: "Mixto Nocturno 8vs8",
    date: "2025-02-18T00:45:00.000Z",
    status: "approved",
    method: "Mercado Pago",
  },
  {
    id: "pay_5901",
    amount: 54000,
    venue: "Estadio Lo Barnechea",
    match: "Intermedia Miércoles",
    date: "2025-02-17T23:58:00.000Z",
    status: "approved",
    method: "Mercado Pago",
  },
  {
    id: "pay_5898",
    amount: 48000,
    venue: "Santa Rosa Fútbol Park",
    match: "Damas Principiantes",
    date: "2025-02-17T23:05:00.000Z",
    status: "pending",
    method: "Transferencia",
  },
  {
    id: "pay_5892",
    amount: 72000,
    venue: "Complejo Sporting Maipú",
    match: "Avanzado Nocturno",
    date: "2025-02-17T21:34:00.000Z",
    status: "approved",
    method: "Mercado Pago",
  },
  {
    id: "pay_5887",
    amount: 52000,
    venue: "Las Condes Arena",
    match: "Mixto Viernes",
    date: "2025-02-17T20:11:00.000Z",
    status: "failed",
    method: "Webpay",
  },
];

const SYSTEM_ALERTS: SystemAlert[] = [
  {
    id: "alert_102",
    title: "Webhook Mercado Pago",
    detail: "2 eventos fallidos en la última hora. Revisa credenciales de producción.",
    severity: "warning",
    timestamp: "2025-02-17T23:21:00.000Z",
  },
  {
    id: "alert_101",
    title: "Partido sin cupos",
    detail: "Match #7843 agotó lista de espera. Sugerir cancha alterna a organizador.",
    severity: "info",
    timestamp: "2025-02-17T22:54:00.000Z",
  },
  {
    id: "alert_099",
    title: "Pago observado",
    detail: "Intento rechazado en Las Condes Arena. Usuario reportó error 4003.",
    severity: "critical",
    timestamp: "2025-02-17T21:02:00.000Z",
  },
];

const TOP_VENUE = {
  name: "Club Deportivo Ñuñoa",
  matches: 42,
  occupancy: 0.92,
  trend: 0.11,
};

const TOP_PLAYER = {
  name: "Ignacio Rivas",
  comuna: "Providencia",
  matchesPlayed: 18,
  streak: 9,
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>(() => BASE_ACTIVITY);
  const [matchesRange, setMatchesRange] = useState<"today" | "week" | "month">("today");
  const [revenueRange, setRevenueRange] = useState<"week" | "month" | "quarter">("month");
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());
  const previousActiveRef = useRef(activity[activity.length - 1]?.total ?? 0);
  const [activeDelta, setActiveDelta] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
    }
  }, [loading, user]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActivity((prev) => {
        const next = prev.map((entry, index) => {
          if (index === prev.length - 1) {
            const drift = Math.max(2, Math.round(entry.total * 0.06));
            const nextTotal = Math.max(12, entry.total + Math.round((Math.random() - 0.45) * drift));
            const players = Math.max(4, Math.round(nextTotal * 0.8));
            const organizers = Math.max(2, nextTotal - players);
            return { ...entry, total: nextTotal, players, organizers };
          }
          if (index === prev.length - 2) {
            return { ...entry, total: Math.max(10, entry.total + Math.round((Math.random() - 0.5) * 4)) };
          }
          return entry;
        });
        setLastUpdated(new Date());
        return next;
      });
    }, 8000);
    return () => window.clearInterval(id);
  }, []);

  const activeUsers = useMemo(() => activity[activity.length - 1]?.total ?? 0, [activity]);

  useEffect(() => {
    const prev = previousActiveRef.current;
    if (prev !== activeUsers) {
      setActiveDelta(activeUsers - prev);
      previousActiveRef.current = activeUsers;
    }
  }, [activeUsers]);

  const isAdminUser = useMemo(() => {
    if (!user) return false;
    const emailMatch = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    return Boolean(emailMatch || user.isAdmin || (user.role ?? "") === "superadmin");
  }, [user]);

  const revenueMetrics = REVENUE_METRICS[revenueRange];
  const matchMetrics = MATCH_METRICS[matchesRange];
  const totalPaidToVenues = TOTAL_PAID_TO_VENUES;
  const commissionsShare = revenueMetrics.total > 0 ? revenueMetrics.commissions / revenueMetrics.total : 0;

  const handleManualRefresh = () => {
    setActivity((prev) => {
      const next = prev.map((entry, index) => {
        if (index >= prev.length - 2) {
          const jitter = Math.round((Math.random() - 0.4) * 10);
          const total = Math.max(12, entry.total + jitter);
          const players = Math.max(4, Math.round(total * 0.78));
          const organizers = Math.max(2, total - players);
          return { ...entry, total, players, organizers };
        }
        return entry;
      });
      return next;
    });
    setLastUpdated(new Date());
  };

  const handleExportPayments = () => {
    const headers = ["fecha", "monto_clp", "cancha", "partido", "estado", "metodo"];
    const rows = LATEST_PAYMENTS.map((payment) => [
      new Date(payment.date).toISOString(),
      payment.amount.toString(),
      payment.venue,
      payment.match,
      payment.status,
      payment.method,
    ]);
    const csvContent = [headers, ...rows]
      .map((cells) =>
        cells
          .map((value) => {
            const needsQuotes = value.includes(",") || value.includes("\"") || value.includes("\n");
            const sanitized = value.replace(/"/g, '""');
            return needsQuotes ? `"${sanitized}"` : sanitized;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pagos-pichapp-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex items-center gap-3 text-white/80 text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verificando credenciales del administrador…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <AuthDialog
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open);
            if (!open) {
              router.replace("/");
            }
          }}
          initialTab="login"
          next="/admin"
        />
      </div>
    );
  }

  const maxActivity = Math.max(...activity.map((item) => item.total));
  const lastUpdatedLabel = new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(lastUpdated);

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 space-y-6 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-gray-800" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900">Acceso restringido</h1>
            <p className="text-sm text-gray-600">
              Esta sección está reservada para el equipo administrador de PichangApp. Inicia sesión con las credenciales asignadas
              para continuar.
            </p>
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-left text-xs text-gray-600">
              <p className="font-medium text-gray-700">Credenciales del administrador</p>
              <p className="mt-1"><span className="font-semibold">Correo:</span> {ADMIN_EMAIL}</p>
              <p><span className="font-semibold">Contraseña:</span> {ADMIN_PASSWORD}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ArrowRight className="h-4 w-4" /> Ir a mi dashboard
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
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <ShieldCheck className="h-4 w-4" /> Acceso administrador seguro
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <h1 className="text-3xl font-semibold text-gray-900">Centro de control</h1>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Sesión: {user.email}
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Monitorea actividad en tiempo real, pagos y alertas críticas de la operación.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm md:flex-row">
            <button
              onClick={handleExportPayments}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100"
            >
              <Download className="h-4 w-4" /> Exportar pagos
            </button>
            <Link
              href="/panel/cancha"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-900"
            >
              Ver panel de canchas
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 flex max-w-7xl flex-col gap-8 px-6">
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Usuarios activos</h2>
                <p className="text-sm text-gray-600">Personas conectadas navegando o reservando en este momento.</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <button
                  onClick={handleManualRefresh}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCcw className="h-3.5 w-3.5" /> Actualizar ahora
                </button>
                <span>Actualizado {lastUpdatedLabel}</span>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-4">
              <div className="md:col-span-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-semibold text-gray-900">{activeUsers}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", activeDelta >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")}> 
                    {activeDelta >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(activeDelta)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">vs hace 10 min</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4 text-emerald-500" /> Jugadores
                    </span>
                    <span>{activity[activity.length - 1]?.players ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2 text-gray-600">
                      <Trophy className="h-4 w-4 text-indigo-500" /> Organizadores
                    </span>
                    <span>{activity[activity.length - 1]?.organizers ?? 0}</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <div className="flex h-48 items-end gap-2">
                  {activity.map((entry) => (
                    <div key={entry.hour} className="flex h-full flex-1 flex-col justify-end">
                      <div
                        className="flex w-full flex-col justify-end gap-1 rounded-t-lg bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300"
                        style={{ height: `${Math.max(10, Math.round((entry.total / maxActivity) * 100))}%` }}
                      >
                        <span className="px-1 text-[10px] font-medium text-white/90 text-center">{entry.total}</span>
                      </div>
                      <div className="mt-2 text-center text-[10px] text-gray-500">{entry.hour}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Partidos publicados</h2>
                <p className="text-sm text-gray-600">Actividad confirmada por período.</p>
              </div>
              <CalendarRange className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex gap-2">
              {(
                [
                  { key: "today", label: "Hoy" },
                  { key: "week", label: "Semana" },
                  { key: "month", label: "Mes" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setMatchesRange(option.key)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition", 
                    matchesRange === option.key
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-semibold text-gray-900">{matchMetrics.published}</span>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", matchMetrics.trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")}> 
                  {matchMetrics.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {formatPercentage(Math.abs(matchMetrics.trend))}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Confirmados</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{matchMetrics.confirmed}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Cancelados</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{matchMetrics.cancelled}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-gray-500">Ocupación</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{formatPercentage(matchMetrics.fillRate)}</p>
                </div>
              </div>
              <Link
                href="/matches"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Ver partidos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ingresos totales</h2>
                <p className="text-sm text-gray-600">Incluye comisiones retenidas por PichangApp.</p>
              </div>
              <div className="flex gap-2">
                {(
                  [
                    { key: "week", label: "7 días" },
                    { key: "month", label: "30 días" },
                    { key: "quarter", label: "90 días" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setRevenueRange(option.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      revenueRange === option.key
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-semibold text-gray-900">{formatCurrencyCLP(revenueMetrics.total)}</span>
                  <span className="text-sm text-gray-500">periodo seleccionado</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-gray-500">Ticket promedio</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{formatCurrencyCLP(revenueMetrics.avgTicket)}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-gray-500">Participación comisión</p>
                    <p className="mt-2 text-lg font-semibold text-gray-900">{formatPercentage(commissionsShare)}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Comisiones generadas</p>
                    <p className="text-emerald-600">{formatCurrencyCLP(revenueMetrics.commissions)}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-emerald-700/80">
                  Las comisiones se transfieren semanalmente. Revisa Finanzas &gt; Desglose para programar retiros.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Top desempeño</h2>
              <LineChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-5 space-y-5 text-sm">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Cancha</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{TOP_VENUE.name}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <span>{TOP_VENUE.matches} partidos</span>
                  <span>{formatPercentage(TOP_VENUE.occupancy)} ocupación</span>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <ArrowUpRight className="h-3 w-3" /> {formatPercentage(TOP_VENUE.trend)} último mes
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Jugador</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{TOP_PLAYER.name}</p>
                <p className="text-xs text-gray-500">{TOP_PLAYER.comuna}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>{TOP_PLAYER.matchesPlayed} partidos jugados</span>
                  <span>{TOP_PLAYER.streak} al hilo</span>
                </div>
              </div>
            </div>
            <Link
              href="/usuarios"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Gestionar usuarios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pagos a canchas</h2>
                <p className="text-sm text-gray-600">Transferencias programadas esta semana.</p>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatCurrencyCLP(totalPaidToVenues)}</span>
            </div>
            <div className="mt-5 space-y-4">
              {VENUE_PAYOUTS.map((payout) => {
                const pct = payout.amount / totalPaidToVenues;
                return (
                  <div key={payout.venue} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{payout.venue}</p>
                        <p className="text-xs text-gray-500">{payout.comuna} · {payout.matches} partidos</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrencyCLP(payout.amount)}</p>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Alertas del sistema</h2>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-5 space-y-4">
              {SYSTEM_ALERTS.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <AlertIcon severity={alert.severity} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                        <AlertBadge severity={alert.severity} />
                      </div>
                      <p className="text-xs text-gray-600">{alert.detail}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Intl.DateTimeFormat("es-CL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(alert.timestamp))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/panel"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Revisar historial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Últimos pagos procesados</h2>
              <span className="text-sm text-gray-500">Mercado Pago + Transferencias</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Partido</th>
                    <th className="px-4 py-3 text-left font-medium">Cancha</th>
                    <th className="px-4 py-3 text-left font-medium">Monto</th>
                    <th className="px-4 py-3 text-left font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {LATEST_PAYMENTS.map((payment) => (
                    <tr key={payment.id} className="bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{payment.match}</div>
                        <div className="text-xs text-gray-500">{payment.method}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{payment.venue}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrencyCLP(payment.amount)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Intl.DateTimeFormat("es-CL", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(payment.date))}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <MailWarning className="h-5 w-5 text-gray-500" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Pendientes críticos</h2>
                <p className="text-sm text-gray-600">Seguimiento manual requerido.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">Reintentar pago Webpay</p>
                <p className="mt-1 text-xs text-amber-800">Las Condes Arena · Ticket #pay_5887</p>
                <Link
                  href="/pagos"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline"
                >
                  Ver detalle <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="font-semibold text-rose-900">Devolución manual solicitada</p>
                <p className="mt-1 text-xs text-rose-800">Match #7819 · Jugador reportó ausencia de rival</p>
                <Link
                  href="/pagos"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-900 hover:underline"
                >
                  Revisar caso <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                <p className="font-semibold text-sky-900">Ticket de soporte sin respuesta</p>
                <p className="mt-1 text-xs text-sky-800">Jugadora Laura Díaz · SLA vence en 35 min</p>
                <Link
                  href="/mensajes"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-900 hover:underline"
                >
                  Abrir bandeja <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
              <CheckCircle className="h-3.5 w-3.5" /> 97% de tickets resueltos dentro de SLA
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentItem["status"] }) {
  const config: Record<PaymentItem["status"], { label: string; className: string }> = {
    approved: { label: "Aprobado", className: "bg-emerald-50 text-emerald-700" },
    pending: { label: "Pendiente", className: "bg-amber-50 text-amber-700" },
    failed: { label: "Fallido", className: "bg-rose-50 text-rose-700" },
  };
  const { label, className } = config[status];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", className)}>{label}</span>;
}

function AlertBadge({ severity }: { severity: SystemAlert["severity"] }) {
  const config: Record<SystemAlert["severity"], { label: string; className: string }> = {
    critical: { label: "Crítico", className: "bg-rose-100 text-rose-700" },
    warning: { label: "Atención", className: "bg-amber-100 text-amber-800" },
    info: { label: "Info", className: "bg-sky-100 text-sky-700" },
  };
  const { label, className } = config[severity];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", className)}>{label}</span>;
}

function AlertIcon({ severity }: { severity: SystemAlert["severity"] }) {
  if (severity === "critical") {
    return <AlertTriangle className="h-5 w-5 text-rose-600" />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
  return <AlertTriangle className="h-5 w-5 text-sky-500" />;
}
