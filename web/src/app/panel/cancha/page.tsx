"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  MessageSquare,
  Settings,
  Ticket,
} from "lucide-react";

const tabs = [
  { id: "matches", label: "Partidos", icon: Ticket },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "bookings", label: "Reservas", icon: ClipboardList },
  { id: "payments", label: "Pagos", icon: CreditCard },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "settings", label: "Ajustes", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

const sampleMatches = [
  {
    id: "match-1",
    title: "Fútbol 7 Nocturno",
    status: "Publicado",
    startsAt: "2024-07-18T21:00:00",
    spots: "12/14",
    price: 8500,
  },
  {
    id: "match-2",
    title: "Mixto Nivel Intermedio",
    status: "Borrador",
    startsAt: "2024-07-21T19:30:00",
    spots: "0/14",
    price: 7000,
  },
];

const sampleBookings = [
  {
    id: "booking-1",
    player: "María González",
    match: "Fútbol 7 Nocturno",
    status: "Pagado",
    checkIn: true,
  },
  {
    id: "booking-2",
    player: "Pedro Lagos",
    match: "Mixto Nivel Intermedio",
    status: "Pendiente",
    checkIn: false,
  },
];

const samplePayouts = [
  {
    id: "payout-1",
    period: "8 - 14 Jul",
    amount: 320000,
    platformFee: 32000,
    status: "Programado",
  },
  {
    id: "payout-2",
    period: "1 - 7 Jul",
    amount: 280000,
    platformFee: 28000,
    status: "Liquidado",
  },
];

export default function VenueDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("matches");

  const content = useMemo(() => {
    switch (activeTab) {
      case "matches":
        return <MatchesTab />;
      case "calendar":
        return <CalendarTab />;
      case "bookings":
        return <BookingsTab />;
      case "payments":
        return <PaymentsTab />;
      case "reports":
        return <ReportsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="bg-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de cancha</h1>
            <p className="mt-2 text-sm text-gray-600">
              Administra tus partidos oficiales, revisa las reservas y concilia tus pagos desde un solo lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/cancha" className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">
              Ver landing
            </Link>
            <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800">
              Crear partido
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8">{content}</div>
      </div>
    </div>
  );
}

function MatchesTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tus partidos</h2>
          <p className="text-sm text-gray-600">Duplica, programa y publica partidos oficiales con cupos pagados.</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">
            Duplicar último partido
          </button>
          <button className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800">
            Crear nuevo partido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sampleMatches.map((match) => (
          <article key={match.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{match.title}</h3>
                <p className="text-sm text-gray-500">{new Date(match.startsAt).toLocaleString("es-CL", { dateStyle: "full", timeStyle: "short" })}</p>
              </div>
              <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">{match.status}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600 sm:grid-cols-4">
              <div>
                <span className="block text-xs uppercase text-gray-400">Cupos</span>
                <span className="font-medium text-gray-900">{match.spots}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-400">Precio por cupo</span>
                <span className="font-medium text-gray-900">{formatCurrency(match.price)}</span>
              </div>
              <div>
                <span className="block text-xs uppercase text-gray-400">Chat</span>
                <span className="font-medium text-gray-900">Activo</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" aria-hidden />
                <button className="text-sm font-semibold text-gray-900 hover:underline">Enviar mensaje</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
        ¿Quieres programar partidos recurrentes? Configura slots desde el Calendario y genera eventos masivos.
      </div>
    </div>
  );
}

function CalendarTab() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Calendario semanal</h2>
      <p className="mt-2 text-sm text-gray-600">
        Visualiza tus slots disponibles, aplica excepciones por clima o feriados y genera partidos en bloque.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
          <div key={day} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">{day}</h3>
            <p className="mt-2 text-xs text-gray-500">Sin slots programados todavía.</p>
            <button className="mt-4 text-sm font-semibold text-gray-900 hover:underline">Agregar slot</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingsTab() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reservas</h2>
          <p className="text-sm text-gray-600">Descarga el listado, realiza check-in con QR y marca no-shows.</p>
        </div>
        <button className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">
          Exportar CSV
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">Jugador</th>
              <th scope="col" className="px-4 py-3">Partido</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sampleBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{booking.player}</td>
                <td className="px-4 py-3 text-gray-600">{booking.match}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      booking.status === "Pagado" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {booking.checkIn ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white">
                      <CheckCircle2 className="h-3 w-3" aria-hidden /> Check-in
                    </span>
                  ) : (
                    <button className="text-sm font-semibold text-gray-900 hover:underline">Validar QR</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Resumen financiero</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Metric label="Ingresos brutos" value={formatCurrency(600000)} trend="↑ 12% vs semana anterior" />
          <Metric label="Comisión PichangApp" value={formatCurrency(60000)} trend="Incluye plataforma + pagos" />
          <Metric label="Ingresos netos" value={formatCurrency(540000)} trend="Liquidaciones programadas" />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Liquidaciones</h3>
            <p className="text-sm text-gray-600">Detalle de periodos, montos y comisiones asociadas.</p>
          </div>
          <button className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">
            Descargar conciliación
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {samplePayouts.map((payout) => (
            <div key={payout.id} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{payout.period}</p>
                <p className="text-xs text-gray-500">Comisión cobrada: {formatCurrency(payout.platformFee)}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div className="font-semibold text-gray-900">{formatCurrency(payout.amount)}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500">{payout.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Reportes</h2>
      <p className="mt-2 text-sm text-gray-600">Analiza tasas de asistencia, ingresos netos, cancelaciones y rating promedio.</p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Metric label="Fill rate semanal" value="82%" trend="↑ 6%" />
        <Metric label="Cancelaciones" value="2" trend="↓ 1 vs semana anterior" />
        <Metric label="Rating promedio" value="4.7" trend="Basado en 120 reseñas" />
        <Metric label="Horas más vendidas" value="19:00 - 22:00" trend="Mayor demanda" />
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Datos de la cancha</h2>
        <p className="mt-2 text-sm text-gray-600">Actualiza tu información, staff y políticas de cancelación.</p>
        <button className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">
          Editar perfil
        </button>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Conexión de pagos</h3>
        <p className="mt-2 text-sm text-gray-600">Conecta o actualiza tu cuenta de Mercado Pago. También puedes registrar tus datos de facturación.</p>
        <button className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800">
          Conectar pagos
        </button>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Políticas y niveles aceptados</h3>
        <p className="mt-2 text-sm text-gray-600">Define devoluciones según ventanas de cancelación y los niveles que aceptas en tus partidos.</p>
        <button className="mt-4 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400">
          Configurar políticas
        </button>
      </div>
    </div>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
  trend?: string;
}

function Metric({ label, value, trend }: MetricProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {trend ? <div className="mt-1 text-xs text-gray-500">{trend}</div> : null}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}
