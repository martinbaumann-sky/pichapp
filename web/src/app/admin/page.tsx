"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  Building2,
  Calendar,
  CalendarRange,
  Check,
  CheckCircle,
  Download,
  DollarSign,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  Globe2,
  LineChart,
  Loader2,
  Mail,
  MailWarning,
  MapPin,
  MessageCircle,
  PauseCircle,
  Phone,
  PieChart,
  PlayCircle,
  Plus,
  RefreshCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Trophy,
  Undo2,
  Upload,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
  X,
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

interface UserMatchRecord {
  id: string;
  name: string;
  date: string;
  venue: string;
  result: "ganado" | "perdido" | "pendiente" | "organizado";
  paymentStatus: "pagado" | "pendiente" | "reembolsado";
  amount: number;
}

interface UserPaymentRecord {
  id: string;
  amount: number;
  concept: string;
  status: "pagado" | "pendiente" | "reembolsado";
  processedAt: string;
}

interface UserLoginRecord {
  timestamp: string;
  city: string;
  country: string;
  device: string;
}

interface AdminUserRecord {
  id: string;
  name: string;
  role: "player" | "organizer";
  comuna: string;
  status: "active" | "suspended";
  rating: number;
  email: string;
  phone: string;
  lastLogin: string;
  lastLocation: string;
  matches: UserMatchRecord[];
  payments: UserPaymentRecord[];
  loginHistory: UserLoginRecord[];
  notes?: string;
  managedVenues?: string[];
  lastPasswordReset?: string;
}

interface VenueRevenueEntry {
  month: string;
  total: number;
  commission: number;
}

interface VenueCalendarEntry {
  date: string;
  matches: {
    id: string;
    name: string;
    status: "activo" | "completado" | "cancelado";
    slotsAvailable: number;
  }[];
}

interface VenuePaymentStatus {
  id: string;
  amount: number;
  status: "pendiente" | "completado" | "observado";
  method: string;
  dueDate: string;
  receiptUrl?: string;
}

type VenuePlan = "Gratis" | "Avanzado" | "Pro";

interface VenueRecord {
  id: string;
  name: string;
  comuna: string;
  owner: string;
  type: string;
  priceRange: string;
  subscription: VenuePlan;
  subscriptionActive: boolean;
  rating: number;
  status: "active" | "inactive";
  createdAt: string;
  contactEmail: string;
  contactPhone: string;
  revenueHistory: VenueRevenueEntry[];
  calendar: VenueCalendarEntry[];
  payments: VenuePaymentStatus[];
  averageTicket: number;
  capacity: number;
  surfaces: string[];
  pendingBalance: number;
  lastAudit: string;
}

interface VenuePayoutControl {
  id: string;
  venueId: string;
  amount: number;
  method: string;
  status: "programado" | "pagado" | "observado";
  scheduledAt: string;
  processedAt?: string;
  receiptUrl?: string;
}

interface AdminMatchRecord {
  id: string;
  title: string;
  date: string;
  comuna: string;
  venueId: string;
  organizerId: string;
  status: "activo" | "completado" | "cancelado";
  slots: {
    total: number;
    taken: number;
  };
  price: number;
  players: string[];
  waitlist: string[];
  notes?: string;
  refundForced?: boolean;
}

type AdminPermission = "lectura" | "finanzas" | "total";

interface AdminAccountRecord {
  id: string;
  name: string;
  email: string;
  role: AdminPermission;
  lastLogin: string;
  active: boolean;
}

interface SupportTicketRecord {
  id: string;
  subject: string;
  requester: string;
  requesterType: "jugador" | "cancha";
  venueId?: string;
  status: "abierto" | "en_progreso" | "cerrado";
  priority: "alta" | "media" | "baja";
  openedAt: string;
  lastReplyAt: string;
  slaHours: number;
  channel: "email" | "app" | "whatsapp";
  satisfaction?: number;
}

interface AutomatedNotificationConfig {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  lastTriggered?: string;
}

interface GlobalConfigState {
  commissionByPlan: Record<VenuePlan, number>;
  mercadoPago: {
    publicKey: string;
    privateKey: string;
    webhookUrl: string;
    sandbox: boolean;
  };
  footerText: string;
  termsUrl: string;
  privacyUrl: string;
  matchSettings: {
    maxPlayers: number;
    defaultDuration: number;
  };
  modules: {
    chat: boolean;
    push: boolean;
    waitlist: boolean;
    stats: boolean;
  };
}

interface AdminActionLog {
  id: string;
  timestamp: string;
  actor: string;
  entity: string;
  action: string;
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

const INITIAL_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: "usr_001",
    name: "Ignacio Rivas",
    role: "player",
    comuna: "Providencia",
    status: "active",
    rating: 4.8,
    email: "ignacio.rivas@email.com",
    phone: "+56 9 5555 0191",
    lastLogin: "2025-02-18T00:34:00.000Z",
    lastLocation: "Providencia, CL",
    matches: [
      {
        id: "mat_7801",
        name: "Mixto Nocturno 8vs8",
        date: "2025-02-17T23:00:00.000Z",
        venue: "Club Deportivo Ñuñoa",
        result: "ganado",
        paymentStatus: "pagado",
        amount: 12000,
      },
      {
        id: "mat_7774",
        name: "Mixto Viernes",
        date: "2025-02-14T23:00:00.000Z",
        venue: "Las Condes Arena",
        result: "ganado",
        paymentStatus: "pagado",
        amount: 11500,
      },
      {
        id: "mat_7704",
        name: "Intermedia Miércoles",
        date: "2025-02-05T23:00:00.000Z",
        venue: "Estadio Lo Barnechea",
        result: "perdido",
        paymentStatus: "pagado",
        amount: 11000,
      },
    ],
    payments: [
      {
        id: "pay_5902",
        amount: 68000,
        concept: "Reservas Febrero",
        status: "pagado",
        processedAt: "2025-02-18T00:45:00.000Z",
      },
      {
        id: "pay_5887",
        amount: 52000,
        concept: "Mixto Viernes",
        status: "reembolsado",
        processedAt: "2025-02-17T20:30:00.000Z",
      },
    ],
    loginHistory: [
      {
        timestamp: "2025-02-18T00:34:00.000Z",
        city: "Providencia",
        country: "Chile",
        device: "iPhone 15 · iOS",
      },
      {
        timestamp: "2025-02-17T15:10:00.000Z",
        city: "Providencia",
        country: "Chile",
        device: "MacBook Pro · Chrome",
      },
      {
        timestamp: "2025-02-16T11:02:00.000Z",
        city: "Valparaíso",
        country: "Chile",
        device: "iPad Air · Safari",
      },
    ],
    notes: "Jugador recurrente, promueve partidos mixtos en redes.",
    lastPasswordReset: "2024-12-12T19:04:00.000Z",
  },
  {
    id: "usr_002",
    name: "Constanza Pereira",
    role: "organizer",
    comuna: "Ñuñoa",
    status: "active",
    rating: 4.6,
    email: "constanza@clubnunoa.cl",
    phone: "+56 9 5555 2020",
    lastLogin: "2025-02-17T22:58:00.000Z",
    lastLocation: "Ñuñoa, CL",
    matches: [
      {
        id: "mat_7819",
        name: "Avanzado Nocturno",
        date: "2025-02-17T23:30:00.000Z",
        venue: "Complejo Sporting Maipú",
        result: "organizado",
        paymentStatus: "pendiente",
        amount: 78000,
      },
      {
        id: "mat_7755",
        name: "Mixto Damas",
        date: "2025-02-12T22:00:00.000Z",
        venue: "Club Deportivo Ñuñoa",
        result: "organizado",
        paymentStatus: "pagado",
        amount: 82000,
      },
    ],
    payments: [
      {
        id: "pay_5901",
        amount: 54000,
        concept: "Liquidación semanal",
        status: "pagado",
        processedAt: "2025-02-17T23:58:00.000Z",
      },
      {
        id: "pay_5866",
        amount: 125000,
        concept: "Ingreso Mercado Pago",
        status: "pagado",
        processedAt: "2025-02-15T18:22:00.000Z",
      },
    ],
    loginHistory: [
      {
        timestamp: "2025-02-17T22:58:00.000Z",
        city: "Ñuñoa",
        country: "Chile",
        device: "Windows · Edge",
      },
      {
        timestamp: "2025-02-16T09:12:00.000Z",
        city: "Ñuñoa",
        country: "Chile",
        device: "iPhone 14 · Safari",
      },
    ],
    notes: "Organizadora premium. Maneja alianzas con colegios.",
    managedVenues: ["venue_001", "venue_003"],
    lastPasswordReset: "2025-01-03T13:11:00.000Z",
  },
  {
    id: "usr_003",
    name: "Felipe Torres",
    role: "player",
    comuna: "La Florida",
    status: "suspended",
    rating: 3.4,
    email: "felipe.torres@email.com",
    phone: "+56 9 5555 9988",
    lastLogin: "2025-02-10T01:42:00.000Z",
    lastLocation: "La Florida, CL",
    matches: [
      {
        id: "mat_7680",
        name: "Mixto Domingo",
        date: "2025-02-02T18:00:00.000Z",
        venue: "Santa Rosa Fútbol Park",
        result: "pendiente",
        paymentStatus: "reembolsado",
        amount: 10000,
      },
    ],
    payments: [
      {
        id: "pay_5831",
        amount: 32000,
        concept: "Suspensión por reporte",
        status: "reembolsado",
        processedAt: "2025-02-10T02:15:00.000Z",
      },
    ],
    loginHistory: [
      {
        timestamp: "2025-02-10T01:42:00.000Z",
        city: "La Florida",
        country: "Chile",
        device: "Android · Chrome",
      },
      {
        timestamp: "2025-02-06T20:19:00.000Z",
        city: "Puente Alto",
        country: "Chile",
        device: "Android · Chrome",
      },
    ],
    notes: "Cuenta suspendida por inasistencias reiteradas (3).",
    lastPasswordReset: "2024-11-08T09:00:00.000Z",
  },
];

const INITIAL_VENUES: VenueRecord[] = [
  {
    id: "venue_001",
    name: "Club Deportivo Ñuñoa",
    comuna: "Ñuñoa",
    owner: "Constanza Pereira",
    type: "Fútbol 7 techado",
    priceRange: "$45.000 - $65.000",
    subscription: "Pro",
    subscriptionActive: true,
    rating: 4.7,
    status: "active",
    createdAt: "2023-09-12T12:00:00.000Z",
    contactEmail: "contacto@clubnunoa.cl",
    contactPhone: "+56 2 2555 1020",
    revenueHistory: [
      { month: "2024-12", total: 5240000, commission: 452000 },
      { month: "2025-01", total: 5480000, commission: 467000 },
      { month: "2025-02", total: 3248000, commission: 276000 },
    ],
    calendar: [
      {
        date: "2025-02-18",
        matches: [
          { id: "mat_7811", name: "Mixto 7pm", status: "activo", slotsAvailable: 2 },
          { id: "mat_7812", name: "Hombres Avanzado", status: "activo", slotsAvailable: 0 },
        ],
      },
      {
        date: "2025-02-19",
        matches: [
          { id: "mat_7820", name: "Corporativo BancoEstado", status: "activo", slotsAvailable: 6 },
        ],
      },
    ],
    payments: [
      {
        id: "payout_9001",
        amount: 620000,
        status: "completado",
        method: "Transferencia",
        dueDate: "2025-02-15T18:00:00.000Z",
        receiptUrl: "https://pichapp.example/recibos/payout_9001.pdf",
      },
      {
        id: "payout_9004",
        amount: 312000,
        status: "pendiente",
        method: "Mercado Pago",
        dueDate: "2025-02-20T18:00:00.000Z",
      },
    ],
    averageTicket: 87000,
    capacity: 12,
    surfaces: ["Césped sintético", "Iluminación LED"],
    pendingBalance: 312000,
    lastAudit: "2025-02-11T14:00:00.000Z",
  },
  {
    id: "venue_002",
    name: "Estadio Lo Barnechea",
    comuna: "Lo Barnechea",
    owner: "Municipalidad de Lo Barnechea",
    type: "Fútbol 9 exterior",
    priceRange: "$55.000 - $80.000",
    subscription: "Avanzado",
    subscriptionActive: true,
    rating: 4.5,
    status: "active",
    createdAt: "2024-02-01T12:00:00.000Z",
    contactEmail: "deportes@lobarnechea.cl",
    contactPhone: "+56 2 2600 3300",
    revenueHistory: [
      { month: "2024-12", total: 4180000, commission: 334000 },
      { month: "2025-01", total: 4360000, commission: 349000 },
      { month: "2025-02", total: 2875000, commission: 231000 },
    ],
    calendar: [
      {
        date: "2025-02-18",
        matches: [
          { id: "mat_7830", name: "Intermedia Miércoles", status: "activo", slotsAvailable: 4 },
          { id: "mat_7831", name: "Juvenil Municipal", status: "activo", slotsAvailable: 9 },
        ],
      },
      {
        date: "2025-02-19",
        matches: [
          { id: "mat_7835", name: "Liga Empresas", status: "activo", slotsAvailable: 0 },
        ],
      },
    ],
    payments: [
      {
        id: "payout_9002",
        amount: 548000,
        status: "completado",
        method: "Transferencia",
        dueDate: "2025-02-14T18:00:00.000Z",
        processedAt: "2025-02-14T17:22:00.000Z",
      },
      {
        id: "payout_9005",
        amount: 198000,
        status: "observado",
        method: "Webpay",
        dueDate: "2025-02-16T18:00:00.000Z",
        receiptUrl: "https://pichapp.example/recibos/payout_9005.pdf",
      },
    ],
    averageTicket: 91000,
    capacity: 18,
    surfaces: ["Césped natural", "Estacionamientos"],
    pendingBalance: 198000,
    lastAudit: "2025-02-10T13:00:00.000Z",
  },
  {
    id: "venue_003",
    name: "Santa Rosa Fútbol Park",
    comuna: "La Florida",
    owner: "Grupo Santa Rosa",
    type: "Fútbol 5 exterior",
    priceRange: "$35.000 - $50.000",
    subscription: "Gratis",
    subscriptionActive: false,
    rating: 4.1,
    status: "inactive",
    createdAt: "2022-06-18T12:00:00.000Z",
    contactEmail: "administracion@santarosa.cl",
    contactPhone: "+56 2 2455 8800",
    revenueHistory: [
      { month: "2024-12", total: 1890000, commission: 226000 },
      { month: "2025-01", total: 2050000, commission: 246000 },
      { month: "2025-02", total: 2569000, commission: 308000 },
    ],
    calendar: [
      {
        date: "2025-02-18",
        matches: [
          { id: "mat_7840", name: "Mixto Principiantes", status: "cancelado", slotsAvailable: 10 },
        ],
      },
      {
        date: "2025-02-20",
        matches: [
          { id: "mat_7845", name: "Liga Empresas Sur", status: "activo", slotsAvailable: 4 },
        ],
      },
    ],
    payments: [
      {
        id: "payout_9003",
        amount: 402000,
        status: "pendiente",
        method: "Transferencia",
        dueDate: "2025-02-12T18:00:00.000Z",
      },
    ],
    averageTicket: 64000,
    capacity: 10,
    surfaces: ["Césped sintético", "Camarines"],
    pendingBalance: 402000,
    lastAudit: "2025-01-29T11:00:00.000Z",
  },
];

const INITIAL_VENUE_PAYOUTS: VenuePayoutControl[] = [
  {
    id: "ctrl_7001",
    venueId: "venue_001",
    amount: 620000,
    method: "Transferencia",
    status: "pagado",
    scheduledAt: "2025-02-13T10:00:00.000Z",
    processedAt: "2025-02-14T17:22:00.000Z",
    receiptUrl: "https://pichapp.example/comprobantes/ctrl_7001.pdf",
  },
  {
    id: "ctrl_7002",
    venueId: "venue_002",
    amount: 198000,
    method: "Webpay",
    status: "observado",
    scheduledAt: "2025-02-16T09:00:00.000Z",
  },
  {
    id: "ctrl_7003",
    venueId: "venue_003",
    amount: 402000,
    method: "Transferencia",
    status: "programado",
    scheduledAt: "2025-02-20T09:00:00.000Z",
  },
];

const INITIAL_MATCHES: AdminMatchRecord[] = [
  {
    id: "mat_7811",
    title: "Mixto 7pm",
    date: "2025-02-18T19:00:00.000Z",
    comuna: "Ñuñoa",
    venueId: "venue_001",
    organizerId: "usr_002",
    status: "activo",
    slots: { total: 16, taken: 14 },
    price: 9500,
    players: ["usr_001", "usr_003"],
    waitlist: ["usr_004"],
    notes: "Streaming habilitado",
  },
  {
    id: "mat_7830",
    title: "Intermedia Miércoles",
    date: "2025-02-19T01:00:00.000Z",
    comuna: "Lo Barnechea",
    venueId: "venue_002",
    organizerId: "usr_002",
    status: "activo",
    slots: { total: 18, taken: 18 },
    price: 10500,
    players: ["usr_001"],
    waitlist: ["usr_005"],
  },
  {
    id: "mat_7801",
    title: "Mixto Nocturno 8vs8",
    date: "2025-02-17T23:00:00.000Z",
    comuna: "Ñuñoa",
    venueId: "venue_001",
    organizerId: "usr_002",
    status: "completado",
    slots: { total: 16, taken: 16 },
    price: 11000,
    players: ["usr_001"],
    waitlist: [],
    notes: "Partido destacado",
  },
  {
    id: "mat_7680",
    title: "Mixto Domingo",
    date: "2025-02-02T21:00:00.000Z",
    comuna: "La Florida",
    venueId: "venue_003",
    organizerId: "usr_002",
    status: "cancelado",
    slots: { total: 12, taken: 7 },
    price: 8000,
    players: ["usr_003"],
    waitlist: [],
    refundForced: true,
  },
];

const INITIAL_ADMIN_ACCOUNTS: AdminAccountRecord[] = [
  {
    id: "adm_001",
    name: "Valentina Carrasco",
    email: "valentina@pichapp.cl",
    role: "total",
    lastLogin: "2025-02-17T20:14:00.000Z",
    active: true,
  },
  {
    id: "adm_002",
    name: "Rodrigo Soto",
    email: "rodrigo@pichapp.cl",
    role: "finanzas",
    lastLogin: "2025-02-16T18:42:00.000Z",
    active: true,
  },
  {
    id: "adm_003",
    name: "Camila Gutiérrez",
    email: "camila@pichapp.cl",
    role: "lectura",
    lastLogin: "2025-02-15T08:10:00.000Z",
    active: false,
  },
];

const INITIAL_SUPPORT_TICKETS: SupportTicketRecord[] = [
  {
    id: "tick_501",
    subject: "Error al confirmar pago",
    requester: "Las Condes Arena",
    requesterType: "cancha",
    venueId: "venue_001",
    status: "en_progreso",
    priority: "alta",
    openedAt: "2025-02-17T19:30:00.000Z",
    lastReplyAt: "2025-02-17T20:05:00.000Z",
    slaHours: 4,
    channel: "email",
  },
  {
    id: "tick_502",
    subject: "Jugador no se presentó",
    requester: "Laura Díaz",
    requesterType: "jugador",
    venueId: "venue_003",
    status: "abierto",
    priority: "media",
    openedAt: "2025-02-17T17:40:00.000Z",
    lastReplyAt: "2025-02-17T17:41:00.000Z",
    slaHours: 6,
    channel: "app",
    satisfaction: 2.5,
  },
  {
    id: "tick_503",
    subject: "Solicitud de factura",
    requester: "Estadio Lo Barnechea",
    requesterType: "cancha",
    venueId: "venue_002",
    status: "cerrado",
    priority: "baja",
    openedAt: "2025-02-15T09:15:00.000Z",
    lastReplyAt: "2025-02-16T09:45:00.000Z",
    slaHours: 24,
    channel: "whatsapp",
    satisfaction: 4.8,
  },
];

const AUTOMATED_NOTIFICATIONS: AutomatedNotificationConfig[] = [
  {
    id: "notif_venues_pending",
    label: "Pagos pendientes de canchas",
    description: "Alerta automática cuando una cancha supera 48h sin liquidación.",
    enabled: true,
    lastTriggered: "2025-02-17T11:32:00.000Z",
  },
  {
    id: "notif_reported_players",
    label: "Jugadores reportados",
    description: "Escalada cuando un jugador recibe 2 reportes en 7 días.",
    enabled: true,
    lastTriggered: "2025-02-16T22:18:00.000Z",
  },
  {
    id: "notif_webhook_failures",
    label: "Fallo de webhook",
    description: "Se envía cuando el webhook de Mercado Pago responde error 500.",
    enabled: false,
  },
];

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
  const [usersData, setUsersData] = useState<AdminUserRecord[]>(INITIAL_ADMIN_USERS);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "player" | "organizer">("all");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>(INITIAL_ADMIN_USERS[0]?.id ?? "");
  const [messageType, setMessageType] = useState<"email" | "push">("email");
  const [messageText, setMessageText] = useState("");
  const [venues, setVenues] = useState<VenueRecord[]>(INITIAL_VENUES);
  const [venueSearch, setVenueSearch] = useState("");
  const [venueStatusFilter, setVenueStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedVenueId, setSelectedVenueId] = useState<string>(INITIAL_VENUES[0]?.id ?? "");
  const [csvInput, setCsvInput] = useState(
    "nombre,comuna,dueno,tipo,precio\nCancha Municipal Peñalolén,Peñalolén,Oficina Deportes,Fútbol 7 exterior,$38.000 - $52.000",
  );
  const [newVenueForm, setNewVenueForm] = useState({
    name: "",
    comuna: "",
    owner: "",
    type: "",
    subscription: "Gratis" as VenuePlan,
    priceRange: "",
  });
  const [payoutControls, setPayoutControls] = useState<VenuePayoutControl[]>(INITIAL_VENUE_PAYOUTS);
  const [matches, setMatches] = useState<AdminMatchRecord[]>(INITIAL_MATCHES);
  const [matchStatusFilter, setMatchStatusFilter] = useState<"todos" | "activo" | "completado" | "cancelado">("todos");
  const [matchVenueFilter, setMatchVenueFilter] = useState<string | "all">("all");
  const [matchDateRange, setMatchDateRange] = useState<"hoy" | "semana" | "mes">("semana");
  const [selectedMatchId, setSelectedMatchId] = useState<string>(INITIAL_MATCHES[0]?.id ?? "");
  const [admins, setAdmins] = useState<AdminAccountRecord[]>(INITIAL_ADMIN_ACCOUNTS);
  const [newAdminForm, setNewAdminForm] = useState({
    name: "",
    email: "",
    role: "lectura" as AdminPermission,
  });
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(INITIAL_SUPPORT_TICKETS);
  const [ticketFilter, setTicketFilter] = useState<"todos" | "abierto" | "en_progreso" | "cerrado">("todos");
  const [broadcastMessage, setBroadcastMessage] = useState(
    "Hola equipo, recuerden actualizar la info de promociones antes del viernes.",
  );
  const [automations, setAutomations] = useState<AutomatedNotificationConfig[]>(AUTOMATED_NOTIFICATIONS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(SYSTEM_ALERTS);
  const [globalConfig, setGlobalConfig] = useState<GlobalConfigState>({
    commissionByPlan: {
      Gratis: 0.12,
      Avanzado: 0.09,
      Pro: 0.06,
    },
    mercadoPago: {
      publicKey: "APP_USR-813c5b2-public",
      privateKey: "APP_USR-5129a-private",
      webhookUrl: "https://pichapp.cl/api/mercadopago/webhook",
      sandbox: false,
    },
    footerText: "© 2025 PichangApp · Todos los derechos reservados",
    termsUrl: "https://pichapp.cl/terminos",
    privacyUrl: "https://pichapp.cl/privacidad",
    matchSettings: {
      maxPlayers: 14,
      defaultDuration: 90,
    },
    modules: {
      chat: true,
      push: true,
      waitlist: true,
      stats: true,
    },
  });
  const [actionLog, setActionLog] = useState<AdminActionLog[]>([]);
  const [financeRange, setFinanceRange] = useState<"mes" | "trimestre">("mes");
  const [reportRange, setReportRange] = useState<"30" | "90">("30");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const sessionActor = user?.email ?? "admin@pichapp.cl";

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return usersData.filter((candidate) => {
      const matchesRole = userRoleFilter === "all" || candidate.role === userRoleFilter;
      const matchesStatus = userStatusFilter === "all" || candidate.status === userStatusFilter;
      const matchesQuery =
        query.length === 0 ||
        [candidate.name, candidate.email, candidate.comuna, candidate.phone]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      return matchesRole && matchesStatus && matchesQuery;
    });
  }, [userRoleFilter, userSearch, userStatusFilter, usersData]);

  useEffect(() => {
    if (!usersData.some((candidate) => candidate.id === selectedUserId) && usersData[0]) {
      setSelectedUserId(usersData[0].id);
    }
  }, [selectedUserId, usersData]);

  useEffect(() => {
    if (filteredUsers.length > 0 && !filteredUsers.some((candidate) => candidate.id === selectedUserId)) {
      setSelectedUserId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedUserId]);

  const selectedUser = useMemo(() => {
    return usersData.find((candidate) => candidate.id === selectedUserId) ?? filteredUsers[0] ?? null;
  }, [filteredUsers, selectedUserId, usersData]);

  const filteredVenues = useMemo(() => {
    const query = venueSearch.trim().toLowerCase();
    return venues.filter((venue) => {
      const matchesStatus = venueStatusFilter === "all" || venue.status === venueStatusFilter;
      const matchesQuery =
        query.length === 0 ||
        [venue.name, venue.comuna, venue.owner, venue.type]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [venueSearch, venueStatusFilter, venues]);

  useEffect(() => {
    if (!venues.some((venue) => venue.id === selectedVenueId) && venues[0]) {
      setSelectedVenueId(venues[0].id);
    }
  }, [selectedVenueId, venues]);

  useEffect(() => {
    if (filteredVenues.length > 0 && !filteredVenues.some((venue) => venue.id === selectedVenueId)) {
      setSelectedVenueId(filteredVenues[0].id);
    }
  }, [filteredVenues, selectedVenueId]);

  const selectedVenue = useMemo(() => {
    return venues.find((venue) => venue.id === selectedVenueId) ?? filteredVenues[0] ?? null;
  }, [filteredVenues, selectedVenueId, venues]);

  const filteredMatches = useMemo(() => {
    const now = new Date();
    return matches.filter((match) => {
      const matchDate = new Date(match.date);
      let matchesRangeFilter = true;
      if (matchDateRange === "hoy") {
        matchesRangeFilter =
          matchDate.getFullYear() === now.getFullYear() &&
          matchDate.getMonth() === now.getMonth() &&
          matchDate.getDate() === now.getDate();
      } else if (matchDateRange === "semana") {
        const diff = Math.abs(matchDate.getTime() - now.getTime());
        matchesRangeFilter = diff <= 7 * 24 * 60 * 60 * 1000;
      }

      if (matchDateRange === "mes") {
        matchesRangeFilter =
          matchDate.getFullYear() === now.getFullYear() && matchDate.getMonth() === now.getMonth();
      }

      const matchesStatus = matchStatusFilter === "todos" || match.status === matchStatusFilter;
      const matchesVenue = matchVenueFilter === "all" || match.venueId === matchVenueFilter;
      return matchesRangeFilter && matchesStatus && matchesVenue;
    });
  }, [matchDateRange, matchStatusFilter, matchVenueFilter, matches]);

  useEffect(() => {
    if (!matches.some((match) => match.id === selectedMatchId) && matches[0]) {
      setSelectedMatchId(matches[0].id);
    }
  }, [matches, selectedMatchId]);

  useEffect(() => {
    if (filteredMatches.length > 0 && !filteredMatches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(filteredMatches[0].id);
    }
  }, [filteredMatches, selectedMatchId]);

  const selectedMatch = useMemo(() => {
    return matches.find((match) => match.id === selectedMatchId) ?? filteredMatches[0] ?? null;
  }, [filteredMatches, matches, selectedMatchId]);

  const userLookup = useMemo(() => {
    const map = new Map<string, AdminUserRecord>();
    usersData.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [usersData]);

  const venueLookup = useMemo(() => {
    const map = new Map<string, VenueRecord>();
    venues.forEach((venue) => {
      map.set(venue.id, venue);
    });
    return map;
  }, [venues]);

  const planStats = useMemo(() => {
    const totals: Record<VenuePlan, number> = { Gratis: 0, Avanzado: 0, Pro: 0 };
    const revenueByPlan: Record<VenuePlan, number> = { Gratis: 0, Avanzado: 0, Pro: 0 };
    venues.forEach((venue) => {
      totals[venue.subscription] += 1;
      const latest = venue.revenueHistory[venue.revenueHistory.length - 1];
      if (latest) {
        revenueByPlan[venue.subscription] += latest.total;
      }
    });
    return { totals, revenueByPlan };
  }, [venues]);

  const financeSummary = useMemo(() => {
    const revenueByVenue = venues.map((venue) => {
      const relevantEntries =
        financeRange === "mes"
          ? [venue.revenueHistory[venue.revenueHistory.length - 1]].filter(Boolean)
          : venue.revenueHistory.slice(-3);
      const revenue = relevantEntries.reduce((sum, entry) => sum + (entry?.total ?? 0), 0);
      const commission = relevantEntries.reduce((sum, entry) => sum + (entry?.commission ?? 0), 0);
      return { venue, revenue, commission };
    });

    const totalByOrganizer = matches.reduce<Record<string, number>>((acc, match) => {
      if (match.status === "cancelado") return acc;
      const generated = match.price * match.slots.taken;
      acc[match.organizerId] = (acc[match.organizerId] ?? 0) + generated;
      return acc;
    }, {});

    const trendDataMap = new Map<string, { gross: number; commission: number }>();
    venues.forEach((venue) => {
      venue.revenueHistory.forEach((entry) => {
        const current = trendDataMap.get(entry.month) ?? { gross: 0, commission: 0 };
        current.gross += entry.total;
        current.commission += entry.commission;
        trendDataMap.set(entry.month, current);
      });
    });

    const trendData = Array.from(trendDataMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, values]) => ({ period, ...values }));

    return {
      totalGlobal: revenueByVenue.reduce((sum, item) => sum + item.revenue, 0),
      totalCommissions: revenueByVenue.reduce((sum, item) => sum + item.commission, 0),
      totalByVenue: revenueByVenue.reduce<Record<string, number>>((acc, item) => {
        acc[item.venue.id] = item.revenue;
        return acc;
      }, {}),
      totalByOrganizer,
      totalRetained: revenueByVenue.reduce((sum, item) => sum + item.commission, 0),
      withdrawals: payoutControls,
      trendData,
    };
  }, [financeRange, matches, payoutControls, venues]);

  const matchStats = useMemo(() => {
    let activos = 0;
    let completados = 0;
    let cancelados = 0;
    let totalSlots = 0;
    let totalTaken = 0;

    matches.forEach((match) => {
      if (match.status === "activo") activos += 1;
      if (match.status === "completado") completados += 1;
      if (match.status === "cancelado") cancelados += 1;
      totalSlots += match.slots.total;
      totalTaken += match.slots.taken;
    });

    const fillRate = totalSlots > 0 ? totalTaken / totalSlots : 0;

    return {
      activos,
      completados,
      cancelados,
      fillRate,
      total: matches.length,
    };
  }, [matches]);

  const analyticsSummary = useMemo(() => {
    const activePlayers = usersData.filter((user) => user.role === "player" && user.status === "active").length;
    const newPlayersLast30Days = usersData.filter((user) => {
      const firstLogin = user.loginHistory[user.loginHistory.length - 1]?.timestamp;
      if (!firstLogin) return false;
      return Date.now() - new Date(firstLogin).getTime() <= 30 * 24 * 60 * 60 * 1000;
    }).length;
    const recurrentPlayers = usersData.filter((user) => user.matches.length >= 4).length;
    const totalPlayers = usersData.filter((user) => user.role === "player").length;
    const cancellationRate = matchStats.total > 0 ? matchStats.cancelados / matchStats.total : 0;
    const averageSatisfaction =
      tickets.filter((ticket) => typeof ticket.satisfaction === "number").reduce((sum, ticket) => sum + (ticket.satisfaction ?? 0), 0) /
      Math.max(1, tickets.filter((ticket) => typeof ticket.satisfaction === "number").length);

    return {
      activePlayers,
      newPlayersLast30Days,
      recurrentPlayers,
      newVsRecurrentRate: totalPlayers > 0 ? recurrentPlayers / totalPlayers : 0,
      cancellationRate,
      averageSatisfaction,
    };
  }, [matchStats, tickets, usersData]);

  const supportStats = useMemo(() => {
    const openTickets = tickets.filter((ticket) => ticket.status !== "cerrado");
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "cerrado");
    const averageResponseMinutes = openTickets.reduce((sum, ticket) => {
      const opened = new Date(ticket.openedAt).getTime();
      const lastReply = new Date(ticket.lastReplyAt).getTime();
      return sum + (lastReply - opened) / (1000 * 60);
    }, 0);

    return {
      openCount: openTickets.length,
      resolvedCount: resolvedTickets.length,
      averageResponseMinutes: openTickets.length > 0 ? averageResponseMinutes / openTickets.length : 0,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => ticketFilter === "todos" || ticket.status === ticketFilter);
  }, [ticketFilter, tickets]);

  const totalPlayers = useMemo(() => usersData.filter((user) => user.role === "player").length, [usersData]);
  const totalOrganizers = useMemo(() => usersData.filter((user) => user.role === "organizer").length, [usersData]);
  const suspendedUsers = useMemo(() => usersData.filter((user) => user.status === "suspended").length, [usersData]);
  const activeVenues = useMemo(() => venues.filter((venue) => venue.status === "active").length, [venues]);
  const inactiveVenues = useMemo(() => venues.filter((venue) => venue.status === "inactive").length, [venues]);
  const pendingVenueBalance = useMemo(() => venues.reduce((sum, venue) => sum + venue.pendingBalance, 0), [venues]);
  const financeTrendMax = useMemo(() => {
    return Math.max(1, ...financeSummary.trendData.map((item) => item.gross));
  }, [financeSummary.trendData]);
  const averageTicketValue = useMemo(() => {
    const totals = matches.reduce(
      (acc, match) => {
        acc.revenue += match.price * match.slots.taken;
        acc.attendees += match.slots.taken;
        return acc;
      },
      { revenue: 0, attendees: 0 },
    );
    return totals.attendees > 0 ? totals.revenue / totals.attendees : 0;
  }, [matches]);
  const broadcastTargets = usersData.length + venues.length;
  const subscriptionPayments = useMemo(() => {
    return venues.flatMap((venue) =>
      venue.payments.map((payment) => ({
        ...payment,
        venueId: venue.id,
        venueName: venue.name,
      })),
    );
  }, [venues]);
  const topVenuesByRevenue = useMemo(() => {
    return [...venues]
      .map((venue) => ({
        venue,
        latestRevenue: venue.revenueHistory[venue.revenueHistory.length - 1]?.total ?? 0,
      }))
      .sort((a, b) => b.latestRevenue - a.latestRevenue)
      .slice(0, 3);
  }, [venues]);

  const appendActionLog = (entity: string, action: string) => {
    const id = `log_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
    setActionLog((prev) => [
      {
        id,
        timestamp: new Date().toISOString(),
        actor: sessionActor,
        entity,
        action,
      },
      ...prev,
    ]);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => {
      setToast(null);
    }, 3600);
  };

  const updateUser = (userId: string, updates: Partial<AdminUserRecord>) => {
    setUsersData((prev) => prev.map((user) => (user.id === userId ? { ...user, ...updates } : user)));
  };

  const handleToggleUserStatus = (userRecord: AdminUserRecord) => {
    const nextStatus = userRecord.status === "active" ? "suspended" : "active";
    updateUser(userRecord.id, { status: nextStatus });
    appendActionLog("usuarios", `${nextStatus === "active" ? "Reactivaste" : "Suspendiste"} la cuenta de ${userRecord.name}`);
    showToast(`Cuenta ${nextStatus === "active" ? "reactivada" : "suspendida"} correctamente.`);
  };

  const handleManualPasswordReset = (userRecord: AdminUserRecord) => {
    const timestamp = new Date().toISOString();
    updateUser(userRecord.id, { lastPasswordReset: timestamp });
    appendActionLog("usuarios", `Forzaste reset de contraseña para ${userRecord.name}`);
    showToast("Enlace de reseteo enviado manualmente.");
  };

  const handleSendUserMessage = () => {
    if (!selectedUser) {
      showToast("Selecciona un usuario para enviar mensajes.", "error");
      return;
    }
    if (messageText.trim().length === 0) {
      showToast("El mensaje no puede ir vacío.", "error");
      return;
    }
    const content = messageText.trim();
    const noteEntry = `[${new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date())}] Aviso ${messageType === "email" ? "email" : "push"}: ${content}`;
    const mergedNotes = selectedUser.notes ? `${selectedUser.notes}\n${noteEntry}` : noteEntry;
    updateUser(selectedUser.id, { notes: mergedNotes });
    appendActionLog(
      "usuarios",
      `Enviaste un ${messageType === "email" ? "correo" : "push"} a ${selectedUser.name}: "${content.slice(0, 60)}${
        content.length > 60 ? "…" : ""
      }"`,
    );
    setMessageText("");
    showToast(`Mensaje ${messageType === "email" ? "email" : "push"} enviado.`);
  };

  const handleImportVenues = () => {
    try {
      const [headerLine, ...rows] = csvInput.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (!headerLine || rows.length === 0) {
        showToast("No hay filas para importar.", "error");
        return;
      }
      const imported = rows.map((row, index) => {
        const [name, comuna, owner, type, priceRange] = row.split(",");
        return {
          id: `venue_import_${Date.now()}_${index}`,
          name: name?.trim() ?? `Cancha ${index + 1}`,
          comuna: comuna?.trim() ?? "",
          owner: owner?.trim() ?? "",
          type: type?.trim() ?? "",
          priceRange: priceRange?.trim() ?? "$0",
          subscription: "Gratis" as VenuePlan,
          subscriptionActive: false,
          rating: 0,
          status: "inactive" as const,
          createdAt: new Date().toISOString(),
          contactEmail: "",
          contactPhone: "",
          revenueHistory: [],
          calendar: [],
          payments: [],
          averageTicket: 0,
          capacity: 10,
          surfaces: [],
          pendingBalance: 0,
          lastAudit: new Date().toISOString(),
        } satisfies VenueRecord;
      });
      setVenues((prev) => [...prev, ...imported]);
      appendActionLog("canchas", `Importaste ${imported.length} canchas desde CSV.`);
      showToast("Importación completada.");
    } catch (error) {
      console.error(error);
      showToast("No se pudo procesar el CSV.", "error");
    }
  };

  const handleCreateVenue = () => {
    if (newVenueForm.name.trim().length === 0 || newVenueForm.comuna.trim().length === 0) {
      showToast("Completa al menos nombre y comuna.", "error");
      return;
    }
    const newVenue: VenueRecord = {
      id: `venue_${Date.now()}`,
      name: newVenueForm.name.trim(),
      comuna: newVenueForm.comuna.trim(),
      owner: newVenueForm.owner.trim() || "Sin asignar",
      type: newVenueForm.type.trim() || "Fútbol 5",
      priceRange: newVenueForm.priceRange.trim() || "$30.000 - $45.000",
      subscription: newVenueForm.subscription,
      subscriptionActive: newVenueForm.subscription !== "Gratis",
      rating: 0,
      status: "active",
      createdAt: new Date().toISOString(),
      contactEmail: "",
      contactPhone: "",
      revenueHistory: [],
      calendar: [],
      payments: [],
      averageTicket: 0,
      capacity: 10,
      surfaces: [],
      pendingBalance: 0,
      lastAudit: new Date().toISOString(),
    };
    setVenues((prev) => [...prev, newVenue]);
    setNewVenueForm({ name: "", comuna: "", owner: "", type: "", subscription: "Gratis", priceRange: "" });
    appendActionLog("canchas", `Creaste manualmente la cancha ${newVenue.name}.`);
    showToast("Cancha creada correctamente.");
  };

  const updateVenue = (venueId: string, updates: Partial<VenueRecord>) => {
    setVenues((prev) => prev.map((venue) => (venue.id === venueId ? { ...venue, ...updates } : venue)));
  };

  const handleToggleVenueStatus = (venue: VenueRecord) => {
    const nextStatus = venue.status === "active" ? "inactive" : "active";
    updateVenue(venue.id, { status: nextStatus });
    appendActionLog("canchas", `${nextStatus === "active" ? "Reactivaste" : "Suspendiste"} ${venue.name}`);
    showToast(`Cancha ${nextStatus === "active" ? "reactivada" : "suspendida"}.`);
  };

  const handleChangeVenuePlan = (venue: VenueRecord, plan: VenuePlan) => {
    updateVenue(venue.id, { subscription: plan, subscriptionActive: plan !== "Gratis" });
    appendActionLog("planes", `Actualizaste el plan de ${venue.name} a ${plan}.`);
    showToast("Plan actualizado.");
  };

  const handleToggleVenueSubscription = (venue: VenueRecord, active: boolean) => {
    updateVenue(venue.id, { subscriptionActive: active });
    appendActionLog(
      "planes",
      `${active ? "Reactivaste" : "Cancelaste"} la suscripción de ${venue.name}.`,
    );
    showToast(active ? "Suscripción activada." : "Suscripción cancelada.");
  };

  const handleUpdateVenuePaymentStatus = (venueId: string, payoutId: string, status: VenuePaymentStatus["status"]) => {
    setVenues((prev) =>
      prev.map((venue) => {
        if (venue.id !== venueId) return venue;
        return {
          ...venue,
          payments: venue.payments.map((payment) =>
            payment.id === payoutId ? { ...payment, status } : payment,
          ),
        };
      }),
    );
    appendActionLog("pagos", `Actualizaste el estado del pago ${payoutId} a ${status}.`);
    showToast("Estado de pago actualizado.");
  };

  const handleFinanceExport = (format: "csv" | "excel") => {
    const headers = ["periodo", "ingreso_bruto", "comision"];
    const rows = financeSummary.trendData.map((item) => [
      item.period,
      item.gross.toString(),
      item.commission.toString(),
    ]);
    const csv = [headers, ...rows]
      .map((line) => line.map((cell) => cell.replace(/"/g, '""')).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-finanzas-${new Date().toISOString().slice(0, 10)}.${format === "csv" ? "csv" : "xlsx"}`;
    link.click();
    URL.revokeObjectURL(link.href);
    appendActionLog("finanzas", `Exportaste ingresos en formato ${format.toUpperCase()}.`);
    showToast("Reporte exportado.");
  };

  const updateMatch = (matchId: string, updates: Partial<AdminMatchRecord>) => {
    setMatches((prev) => prev.map((match) => (match.id === matchId ? { ...match, ...updates } : match)));
  };

  const handleCancelMatch = (match: AdminMatchRecord) => {
    updateMatch(match.id, { status: "cancelado" });
    appendActionLog("partidos", `Cancelaste el partido ${match.title}.`);
    showToast("Partido cancelado.");
  };

  const handleMoveMatch = (match: AdminMatchRecord, minutes: number) => {
    const nextDate = new Date(match.date);
    nextDate.setMinutes(nextDate.getMinutes() + minutes);
    updateMatch(match.id, { date: nextDate.toISOString() });
    appendActionLog("partidos", `Moviste ${match.title} ${minutes > 0 ? "adelante" : "atrás"} ${Math.abs(minutes)} minutos.`);
    showToast("Horario actualizado.");
  };

  const handleForceRefund = (match: AdminMatchRecord) => {
    updateMatch(match.id, { refundForced: true });
    appendActionLog("partidos", `Marcaste devolución manual para ${match.title}.`);
    showToast("Devolución forzada registrada.");
  };

  const handleAutomationToggle = (id: string, enabled: boolean) => {
    setAutomations((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
    appendActionLog("alertas", `${enabled ? "Activaste" : "Desactivaste"} la automatización ${id}.`);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    appendActionLog("alertas", `Marcaste como resuelta la alerta ${alertId}.`);
    showToast("Alerta archivada.");
  };

  const handleAddAdmin = (admin: Omit<AdminAccountRecord, "id">) => {
    const id = `adm_${Date.now()}`;
    setAdmins((prev) => [...prev, { ...admin, id }]);
    appendActionLog("administradores", `Creaste el administrador ${admin.email}.`);
    showToast("Administrador agregado.");
  };

  const handleUpdateAdmin = (adminId: string, updates: Partial<AdminAccountRecord>) => {
    setAdmins((prev) => prev.map((admin) => (admin.id === adminId ? { ...admin, ...updates } : admin)));
  };

  const handleRemoveAdmin = (adminId: string) => {
    const admin = admins.find((item) => item.id === adminId);
    setAdmins((prev) => prev.filter((item) => item.id !== adminId));
    appendActionLog("administradores", `Eliminaste el admin ${admin?.email ?? adminId}.`);
    showToast("Administrador eliminado.");
  };

  const handleTicketUpdate = (ticketId: string, updates: Partial<SupportTicketRecord>) => {
    setTickets((prev) => prev.map((ticket) => (ticket.id === ticketId ? { ...ticket, ...updates } : ticket)));
  };

  const handleUpdatePayoutControl = (controlId: string, status: VenuePayoutControl["status"]) => {
    setPayoutControls((prev) => prev.map((control) => (control.id === controlId ? { ...control, status } : control)));
    appendActionLog("finanzas", `Actualizaste el control ${controlId} a ${status}.`);
    showToast("Estado de pago actualizado.");
  };

  const handleBroadcast = () => {
    appendActionLog("soporte", `Enviaste un broadcast: "${broadcastMessage.slice(0, 60)}${
      broadcastMessage.length > 60 ? "…" : ""
    }"`);
    showToast("Broadcast enviado a la base de usuarios.");
  };

  const handleExportAnalytics = (format: "csv" | "pdf") => {
    if (format === "csv") {
      const csvLines = [
        ["metric", "valor"],
        ["jugadores_activos", analyticsSummary.activePlayers.toString()],
        ["jugadores_nuevos_30d", analyticsSummary.newPlayersLast30Days.toString()],
        ["jugadores_recurrentes", analyticsSummary.recurrentPlayers.toString()],
        ["tasa_cancelacion", analyticsSummary.cancellationRate.toFixed(3)],
        ["satisfaccion_promedio", analyticsSummary.averageSatisfaction.toFixed(2)],
      ]
        .map((line) => line.join(","))
        .join("\n");
      const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `analytics-${reportRange}d.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      appendActionLog("reportes", "Exportaste analítica en CSV.");
      showToast("Reporte CSV generado.");
      return;
    }

    const popup = window.open("", "reportes", "width=1024,height=768");
    if (popup) {
      popup.document.write(`<!doctype html><html><head><title>Reporte PichangApp</title></head><body>`);
      popup.document.write(`<h1>Reporte de analítica (${reportRange} días)</h1>`);
      popup.document.write(`<p>Generado: ${new Date().toLocaleString("es-CL")}</p>`);
      popup.document.write("<ul>");
      popup.document.write(`<li>Jugadores activos: ${analyticsSummary.activePlayers}</li>`);
      popup.document.write(`<li>Nuevos últimos 30 días: ${analyticsSummary.newPlayersLast30Days}</li>`);
      popup.document.write(`<li>Recurrentes: ${analyticsSummary.recurrentPlayers}</li>`);
      popup.document.write(`<li>Tasa de cancelación: ${(analyticsSummary.cancellationRate * 100).toFixed(1)}%</li>`);
      popup.document.write(
        `<li>Satisfacción promedio: ${analyticsSummary.averageSatisfaction.toFixed(2)} / 5</li>`,
      );
      popup.document.write("</ul>");
      popup.document.write("<p>Puedes usar Ctrl/Cmd+P para guardar como PDF.</p>");
      popup.document.write("</body></html>");
      popup.document.close();
      appendActionLog("reportes", "Abriste reporte en ventana imprimible.");
      showToast("Reporte listo para exportar a PDF.");
    } else {
      showToast("Tu navegador bloqueó la ventana emergente.", "error");
    }
  };

  const handleCommissionChange = (plan: VenuePlan, value: number) => {
    const normalized = Math.max(0, Math.min(0.3, value / 100));
    setGlobalConfig((prev) => ({
      ...prev,
      commissionByPlan: { ...prev.commissionByPlan, [plan]: Number(normalized.toFixed(4)) },
    }));
    appendActionLog("configuracion", `Comisión ${plan} actualizada a ${(normalized * 100).toFixed(1)}%`);
    showToast("Comisión actualizada.");
  };

  const handleConfigTextChange = (field: "footerText" | "termsUrl" | "privacyUrl", value: string) => {
    setGlobalConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleModule = (module: keyof GlobalConfigState["modules"], value: boolean) => {
    setGlobalConfig((prev) => ({
      ...prev,
      modules: { ...prev.modules, [module]: value },
    }));
    appendActionLog("configuracion", `${value ? "Activaste" : "Desactivaste"} el módulo ${module}`);
  };

  const handleUpdateMercadoPago = (field: keyof GlobalConfigState["mercadoPago"], value: string | boolean) => {
    setGlobalConfig((prev) => ({
      ...prev,
      mercadoPago: { ...prev.mercadoPago, [field]: value },
    }));
  };

  const handleMatchSettingChange = (field: keyof GlobalConfigState["matchSettings"], value: number) => {
    setGlobalConfig((prev) => ({
      ...prev,
      matchSettings: { ...prev.matchSettings, [field]: value },
    }));
  };

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
      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur",
            toast.type === "success"
              ? "border-emerald-200 bg-white/90 text-emerald-800"
              : "border-rose-200 bg-white/90 text-rose-700",
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-xs text-gray-500 hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
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

        <section id="usuarios" className="grid gap-6 lg:grid-cols-[2fr,1.15fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gestión de usuarios</h2>
                <p className="text-sm text-gray-600">Buscar, filtrar y editar jugadores y organizadores.</p>
              </div>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Jugadores</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{totalPlayers}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Organizadores</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{totalOrganizers}</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-700">Suspendidos</p>
                <p className="mt-1 text-2xl font-semibold text-amber-900">{suspendedUsers}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Buscar por nombre, correo o comuna"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-black focus:outline-none"
                  type="search"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filtrar por rol y estado</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Todos" },
                  { key: "player", label: "Jugadores" },
                  { key: "organizer", label: "Organizadores" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setUserRoleFilter(option.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    userRoleFilter === option.key
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Todos" },
                  { key: "active", label: "Activos" },
                  { key: "suspended", label: "Suspendidos" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setUserStatusFilter(option.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    userStatusFilter === option.key
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Usuario</th>
                    <th className="px-4 py-3 text-left font-medium">Rol</th>
                    <th className="px-4 py-3 text-left font-medium">Rating</th>
                    <th className="px-4 py-3 text-left font-medium">Partidos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        No encontramos usuarios con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((item) => {
                      const isSelected = selectedUser?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedUserId(item.id)}
                          className={cn(
                            "cursor-pointer bg-white transition hover:bg-gray-50",
                            isSelected && "bg-emerald-50/70",
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.email}</div>
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <MapPin className="h-3 w-3" /> {item.comuna}
                              <span
                                className={cn(
                                  "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                  item.status === "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700",
                                )}
                              >
                                {item.status === "active" ? "Activo" : "Suspendido"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.role === "player" ? "Jugador" : "Organizador"}
                          </td>
                          <td className="px-4 py-3 text-gray-900">{item.rating.toFixed(1)}</td>
                          <td className="px-4 py-3 text-gray-900">{item.matches.length}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {selectedUser ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                    <p className="text-xs text-gray-400">Último acceso: {new Date(selectedUser.lastLogin).toLocaleString("es-CL")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 font-medium",
                        selectedUser.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700",
                      )}
                    >
                      {selectedUser.status === "active" ? "Cuenta activa" : "Cuenta suspendida"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" /> Rating {selectedUser.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Phone className="h-4 w-4" /> Teléfono
                    </span>
                    <input
                      value={selectedUser.phone}
                      onChange={(event) => updateUser(selectedUser.id, { phone: event.target.value })}
                      className="w-48 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Globe2 className="h-4 w-4" /> Comuna
                    </span>
                    <input
                      value={selectedUser.comuna}
                      onChange={(event) => updateUser(selectedUser.id, { comuna: event.target.value })}
                      className="w-48 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Star className="h-4 w-4 text-amber-500" /> Ajustar rating
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={selectedUser.rating}
                      onChange={(event) => updateUser(selectedUser.id, { rating: Number(event.target.value) })}
                      className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => handleToggleUserStatus(selectedUser)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium",
                      selectedUser.status === "active"
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    )}
                  >
                    {selectedUser.status === "active" ? (
                      <PauseCircle className="h-4 w-4" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    {selectedUser.status === "active" ? "Suspender cuenta" : "Reactivar cuenta"}
                  </button>
                  <button
                    onClick={() => handleManualPasswordReset(selectedUser)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <Undo2 className="h-4 w-4" /> Reset contraseña
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Último reset manual</span>
                    <span>
                      {selectedUser.lastPasswordReset
                        ? new Date(selectedUser.lastPasswordReset).toLocaleString("es-CL")
                        : "Nunca"}
                    </span>
                  </div>
                  <label className="text-xs font-medium text-gray-700" htmlFor="user-notes">
                    Notas internas
                  </label>
                  <textarea
                    id="user-notes"
                    value={selectedUser.notes ?? ""}
                    onChange={(event) => updateUser(selectedUser.id, { notes: event.target.value })}
                    className="h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Enviar aviso directo</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="h-4 w-4" /> Email
                    <BellRing className="h-4 w-4" /> Push
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={messageType}
                        onChange={(event) => setMessageType(event.target.value as "email" | "push")}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="email">Enviar email</option>
                        <option value="push">Notificación push</option>
                      </select>
                      <button
                        onClick={handleSendUserMessage}
                        className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                      >
                        <Send className="h-4 w-4" /> Enviar
                      </button>
                    </div>
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      className="h-24 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
                      placeholder="Mensaje para el usuario"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Partidos recientes</h4>
                  <div className="space-y-2 text-sm">
                    {selectedUser.matches.map((match) => (
                      <div key={match.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{match.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(match.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" /> {match.venue}
                          <span className="inline-flex items-center gap-1">
                            <Check className="h-3 w-3 text-emerald-500" /> Resultado: {match.result}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-emerald-500" /> {formatCurrencyCLP(match.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Historial de pagos</h4>
                  <div className="rounded-lg border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 text-xs">
                      <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Concepto</th>
                          <th className="px-3 py-2 text-left font-medium">Monto</th>
                          <th className="px-3 py-2 text-left font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedUser.payments.map((payment) => (
                          <tr key={payment.id} className="bg-white">
                            <td className="px-3 py-2 text-gray-600">{payment.concept}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{formatCurrencyCLP(payment.amount)}</td>
                            <td className="px-3 py-2 text-gray-500">{payment.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Logins recientes</h4>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                    <ul className="space-y-2">
                      {selectedUser.loginHistory.map((login) => (
                        <li key={`${login.timestamp}-${login.device}`} className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 text-gray-500">
                            <MapPin className="h-3.5 w-3.5" /> {login.city}, {login.country}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(login.timestamp).toLocaleString("es-CL")}
                          </span>
                          <span className="hidden text-[11px] text-gray-400 sm:inline">{login.device}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                <Users className="h-10 w-10 text-gray-300" />
                <p>Selecciona un usuario para ver su detalle.</p>
              </div>
            )}
          </div>
        </section>

        <section id="canchas" className="grid gap-6 xl:grid-cols-[2fr,1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Gestión de canchas</h2>
                  <p className="text-sm text-gray-600">Controla planes, pagos y calendarios.</p>
                </div>
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Activas</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{activeVenues}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Inactivas</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{inactiveVenues}</p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-amber-700">Saldo pendiente</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-900">{formatCurrencyCLP(pendingVenueBalance)}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={venueSearch}
                    onChange={(event) => setVenueSearch(event.target.value)}
                    placeholder="Buscar por nombre, comuna o dueño"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-black focus:outline-none"
                    type="search"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Filter className="h-4 w-4" />
                  <span>Filtrar por estado</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: "Todas" },
                    { key: "active", label: "Activas" },
                    { key: "inactive", label: "Suspendidas" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setVenueStatusFilter(option.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      venueStatusFilter === option.key
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Cancha</th>
                      <th className="px-4 py-3 text-left font-medium">Plan</th>
                      <th className="px-4 py-3 text-left font-medium">Comuna</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVenues.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                          No hay canchas con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredVenues.map((venue) => {
                        const isSelected = selectedVenue?.id === venue.id;
                        return (
                          <tr
                            key={venue.id}
                            onClick={() => setSelectedVenueId(venue.id)}
                            className={cn(
                              "cursor-pointer bg-white transition hover:bg-gray-50",
                              isSelected && "bg-indigo-50/70",
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{venue.name}</div>
                              <div className="text-xs text-gray-500">{venue.owner}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{venue.subscription}</td>
                            <td className="px-4 py-3 text-gray-600">{venue.comuna}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                                  venue.status === "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700",
                                )}
                              >
                                {venue.status === "active" ? "Activa" : "Suspendida"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Crear nueva cancha</h3>
              <p className="mt-1 text-sm text-gray-600">Carga manual o importa un listado desde CSV.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  value={newVenueForm.name}
                  onChange={(event) => setNewVenueForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nombre"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={newVenueForm.comuna}
                  onChange={(event) => setNewVenueForm((prev) => ({ ...prev, comuna: event.target.value }))}
                  placeholder="Comuna"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={newVenueForm.owner}
                  onChange={(event) => setNewVenueForm((prev) => ({ ...prev, owner: event.target.value }))}
                  placeholder="Dueño / contacto"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  value={newVenueForm.type}
                  onChange={(event) => setNewVenueForm((prev) => ({ ...prev, type: event.target.value }))}
                  placeholder="Tipo de cancha"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <select
                  value={newVenueForm.subscription}
                  onChange={(event) =>
                    setNewVenueForm((prev) => ({ ...prev, subscription: event.target.value as VenuePlan }))
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="Gratis">Gratis</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Pro">Pro</option>
                </select>
                <input
                  value={newVenueForm.priceRange}
                  onChange={(event) => setNewVenueForm((prev) => ({ ...prev, priceRange: event.target.value }))}
                  placeholder="Rango de precios"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleCreateVenue}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                >
                  <Plus className="h-4 w-4" /> Crear cancha
                </button>
                <button
                  onClick={handleImportVenues}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Upload className="h-4 w-4" /> Importar CSV
                </button>
              </div>
              <textarea
                value={csvInput}
                onChange={(event) => setCsvInput(event.target.value)}
                className="mt-4 h-24 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {selectedVenue ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedVenue.name}</h3>
                    <p className="text-sm text-gray-500">{selectedVenue.type}</p>
                    <p className="text-xs text-gray-400">Alta desde {new Date(selectedVenue.createdAt).toLocaleDateString("es-CL")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Star className="h-3.5 w-3.5 text-amber-500" /> Rating {selectedVenue.rating.toFixed(1)}
                    </span>
                    <select
                      value={selectedVenue.subscription}
                      onChange={(event) => handleChangeVenuePlan(selectedVenue, event.target.value as VenuePlan)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs"
                    >
                      <option value="Gratis">Plan Gratis</option>
                      <option value="Avanzado">Plan Avanzado</option>
                      <option value="Pro">Plan Pro</option>
                    </select>
                    <button
                      onClick={() => handleToggleVenueStatus(selectedVenue)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
                        selectedVenue.status === "active"
                          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                      )}
                    >
                      {selectedVenue.status === "active" ? "Suspender cancha" : "Reactivar cancha"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Mail className="h-4 w-4" /> Correo admin
                    </span>
                    <input
                      value={selectedVenue.contactEmail}
                      onChange={(event) => updateVenue(selectedVenue.id, { contactEmail: event.target.value })}
                      className="w-52 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Phone className="h-4 w-4" /> Teléfono
                    </span>
                    <input
                      value={selectedVenue.contactPhone}
                      onChange={(event) => updateVenue(selectedVenue.id, { contactPhone: event.target.value })}
                      className="w-40 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Users className="h-4 w-4" /> Capacidad por partido
                    </span>
                    <input
                      type="number"
                      value={selectedVenue.capacity}
                      onChange={(event) => updateVenue(selectedVenue.id, { capacity: Number(event.target.value) })}
                      className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Ingresos por cancha</h4>
                  <div className="flex items-end gap-3">
                    {selectedVenue.revenueHistory.map((entry) => {
                      const max = Math.max(...selectedVenue.revenueHistory.map((item) => item.total));
                      const height = max > 0 ? Math.round((entry.total / max) * 100) : 20;
                      return (
                        <div key={entry.month} className="flex flex-1 flex-col items-center">
                          <div
                            className="flex h-32 w-full items-end justify-center rounded-t-lg bg-gradient-to-t from-indigo-500 via-indigo-400 to-indigo-300"
                            style={{ height: `${Math.max(20, height)}%` }}
                          >
                            <span className="px-2 text-[10px] font-semibold text-white/90">{formatCurrencyCLP(entry.total)}</span>
                          </div>
                          <span className="mt-1 text-[11px] text-gray-500">{entry.month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Comisión promedio: {selectedVenue.revenueHistory.length > 0
                      ? formatPercentage(
                          selectedVenue.revenueHistory.reduce((sum, item) => sum + item.commission, 0) /
                            Math.max(1, selectedVenue.revenueHistory.reduce((sum, item) => sum + item.total, 0)),
                        )
                      : "0%"}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Calendario</h4>
                  <div className="space-y-2 text-sm">
                    {selectedVenue.calendar.map((day) => (
                      <div key={day.date} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> {new Date(day.date).toLocaleDateString("es-CL", {
                              weekday: "short",
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span>{day.matches.length} partidos</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {day.matches.map((match) => (
                            <div key={match.id} className="flex items-center justify-between rounded-lg border border-white bg-white px-3 py-2 text-xs text-gray-600">
                              <span className="font-medium text-gray-900">{match.name}</span>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5",
                                  match.status === "activo"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : match.status === "cancelado"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-gray-100 text-gray-600",
                                )}
                              >
                                {match.status}
                              </span>
                              <span className="text-[11px] text-gray-400">{match.slotsAvailable} cupos libres</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Pagos y liquidaciones</h4>
                  <div className="rounded-lg border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-100 text-xs">
                      <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">ID</th>
                          <th className="px-3 py-2 text-left font-medium">Monto</th>
                          <th className="px-3 py-2 text-left font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedVenue.payments.map((payment) => (
                          <tr key={payment.id} className="bg-white">
                            <td className="px-3 py-2 text-gray-600">{payment.id}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">{formatCurrencyCLP(payment.amount)}</td>
                            <td className="px-3 py-2 text-gray-600">
                              <select
                                value={payment.status}
                                onChange={(event) =>
                                  handleUpdateVenuePaymentStatus(selectedVenue.id, payment.id, event.target.value as VenuePaymentStatus["status"])
                                }
                                className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="completado">Completado</option>
                                <option value="observado">Observado</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500">Balance pendiente: {formatCurrencyCLP(selectedVenue.pendingBalance)}</p>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                <Building2 className="h-10 w-10 text-gray-300" />
                <p>Selecciona una cancha para ver su actividad.</p>
              </div>
            )}
          </div>
        </section>

        <section id="finanzas" className="grid gap-6 xl:grid-cols-[1.7fr,1.1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Finanzas y comisiones</h2>
                <p className="text-sm text-gray-600">Seguimiento de ingresos por cancha y organizador.</p>
              </div>
              <div className="flex items-center gap-2">
                {(
                  [
                    { key: "mes", label: "Mes actual" },
                    { key: "trimestre", label: "Últimos 3 meses" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFinanceRange(option.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      financeRange === option.key
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Total global</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrencyCLP(financeSummary.totalGlobal)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Comisiones retenidas</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrencyCLP(financeSummary.totalRetained)}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Ticket promedio</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{formatCurrencyCLP(Math.round(averageTicketValue))}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Evolución de ingresos</h3>
              <div className="mt-3 flex items-end gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                {financeSummary.trendData.map((item) => (
                  <div key={item.period} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="flex h-32 w-full items-end justify-center rounded-t-lg bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300"
                      style={{ height: `${Math.max(18, Math.round((item.gross / financeTrendMax) * 100))}%` }}
                    >
                      <span className="px-2 text-[10px] font-semibold text-white/90">{formatCurrencyCLP(item.gross)}</span>
                    </div>
                    <span className="text-[11px] text-gray-500">{item.period}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Ingresos por cancha</h4>
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(financeSummary.totalByVenue).map(([venueId, total]) => (
                    <div key={venueId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
                      <span className="text-gray-600">{venueLookup.get(venueId)?.name ?? venueId}</span>
                      <span className="font-medium text-gray-900">{formatCurrencyCLP(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Ingresos por organizador</h4>
                <div className="mt-3 space-y-2 text-sm">
                  {Object.entries(financeSummary.totalByOrganizer).map(([organizerId, total]) => (
                    <div key={organizerId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
                      <span className="text-gray-600">{userLookup.get(organizerId)?.name ?? organizerId}</span>
                      <span className="font-medium text-gray-900">{formatCurrencyCLP(total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Control de pagos a canchas</h3>
                  <p className="text-sm text-gray-600">Estado de liquidaciones programadas.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFinanceExport("csv")}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="h-4 w-4" /> Exportar CSV
                  </button>
                  <button
                    onClick={() => handleFinanceExport("excel")}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-900"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Excel
                  </button>
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-xs">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Pago</th>
                      <th className="px-3 py-2 text-left font-medium">Cancha</th>
                      <th className="px-3 py-2 text-left font-medium">Monto</th>
                      <th className="px-3 py-2 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payoutControls.map((control) => (
                      <tr key={control.id} className="bg-white">
                        <td className="px-3 py-2 text-gray-600">{control.id}</td>
                        <td className="px-3 py-2 text-gray-600">{venueLookup.get(control.venueId)?.name ?? control.venueId}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{formatCurrencyCLP(control.amount)}</td>
                        <td className="px-3 py-2 text-gray-600">
                          <select
                            value={control.status}
                            onChange={(event) => handleUpdatePayoutControl(control.id, event.target.value as VenuePayoutControl["status"])}
                            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                          >
                            <option value="programado">Programado</option>
                            <option value="pagado">Pagado</option>
                            <option value="observado">Observado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Desglose de retiros</h3>
              <div className="mt-4 space-y-3 text-sm">
                {payoutControls.map((control) => (
                  <div key={`${control.id}-summary`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{venueLookup.get(control.venueId)?.name ?? control.venueId}</span>
                      <span className="text-xs text-gray-500">{control.method}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(control.scheduledAt).toLocaleDateString("es-CL")}
                      </span>
                      {control.processedAt && (
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          {new Date(control.processedAt).toLocaleDateString("es-CL")}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                        <DollarSign className="h-3.5 w-3.5" /> {formatCurrencyCLP(control.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="partidos" className="grid gap-6 xl:grid-cols-[2fr,1.1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gestión de partidos</h2>
                <p className="text-sm text-gray-600">Tabla de partidos activos, completados y cancelados.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <LineChart className="h-4 w-4" /> Fill rate: {(matchStats.fillRate * 100).toFixed(1)}%
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Activos</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{matchStats.activos}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Completados</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{matchStats.completados}</p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
                <p className="text-xs uppercase tracking-wide text-rose-700">Cancelados</p>
                <p className="mt-1 text-2xl font-semibold text-rose-900">{matchStats.cancelados}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "todos", label: "Todos" },
                    { key: "activo", label: "Activos" },
                    { key: "completado", label: "Completados" },
                    { key: "cancelado", label: "Cancelados" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setMatchStatusFilter(option.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      matchStatusFilter === option.key
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "hoy", label: "Hoy" },
                    { key: "semana", label: "7 días" },
                    { key: "mes", label: "Mes" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setMatchDateRange(option.key)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      matchDateRange === option.key
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div>
                <select
                  value={matchVenueFilter}
                  onChange={(event) => setMatchVenueFilter(event.target.value as typeof matchVenueFilter)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="all">Todas las canchas</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Partido</th>
                    <th className="px-4 py-3 text-left font-medium">Cancha</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Cupos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMatches.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                        No hay partidos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMatches.map((match) => (
                      <tr
                        key={match.id}
                        onClick={() => setSelectedMatchId(match.id)}
                        className={cn(
                          "cursor-pointer bg-white transition hover:bg-gray-50",
                          selectedMatch?.id === match.id && "bg-sky-50/70",
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{match.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(match.date).toLocaleString("es-CL", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{venueLookup.get(match.venueId)?.name ?? match.venueId}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              match.status === "activo"
                                ? "bg-emerald-50 text-emerald-700"
                                : match.status === "completado"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-rose-50 text-rose-700",
                            )}
                          >
                            {match.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {match.slots.taken}/{match.slots.total}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {selectedMatch ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedMatch.title}</h3>
                    <p className="text-sm text-gray-500">
                      {venueLookup.get(selectedMatch.venueId)?.name ?? selectedMatch.venueId} · {userLookup.get(selectedMatch.organizerId)?.name ?? selectedMatch.organizerId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedMatch.date).toLocaleString("es-CL")}
                  </div>
                </div>

                <div className="grid gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <label className="space-y-1 text-xs text-gray-500">
                    Hora y fecha
                    <input
                      type="datetime-local"
                      value={new Date(selectedMatch.date).toISOString().slice(0, 16)}
                      onChange={(event) => updateMatch(selectedMatch.id, { date: new Date(event.target.value).toISOString() })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-gray-500">
                    Precio por jugador
                    <input
                      type="number"
                      value={selectedMatch.price}
                      onChange={(event) => updateMatch(selectedMatch.id, { price: Number(event.target.value) })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-xs text-gray-500">
                    Notas para los jugadores
                    <textarea
                      value={selectedMatch.notes ?? ""}
                      onChange={(event) => updateMatch(selectedMatch.id, { notes: event.target.value })}
                      className="h-20 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="space-y-3 text-sm">
                  <h4 className="text-sm font-semibold text-gray-900">Jugadores inscritos</h4>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {selectedMatch.players.map((playerId) => (
                      <span key={playerId} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                        <Users className="h-3.5 w-3.5" /> {userLookup.get(playerId)?.name ?? playerId}
                      </span>
                    ))}
                    {selectedMatch.players.length === 0 && <span className="text-gray-400">Sin jugadores confirmados</span>}
                  </div>
                  {selectedMatch.waitlist.length > 0 && (
                    <p className="text-xs text-gray-500">Lista de espera: {selectedMatch.waitlist.length}</p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Estado de cupos</span>
                    <span>
                      {selectedMatch.slots.taken}/{selectedMatch.slots.total}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.round((selectedMatch.slots.taken / selectedMatch.slots.total) * 100))}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    onClick={() => handleMoveMatch(selectedMatch, -30)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" /> -30 min
                  </button>
                  <button
                    onClick={() => handleMoveMatch(selectedMatch, 30)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700 hover:bg-gray-100"
                  >
                    +30 min <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleForceRefund(selectedMatch)}
                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 font-medium text-amber-900 hover:bg-amber-100"
                  >
                    <RefreshCcw className="h-4 w-4" /> Forzar devolución
                  </button>
                  <button
                    onClick={() => handleCancelMatch(selectedMatch)}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 font-medium text-white hover:bg-rose-700"
                  >
                    <X className="h-4 w-4" /> Cancelar partido
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
                <Calendar className="h-10 w-10 text-gray-300" />
                <p>Selecciona un partido para editar sus detalles.</p>
              </div>
            )}
          </div>
        </section>

        <section id="planes" className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Suscripciones y planes</h2>
                <p className="text-sm text-gray-600">Controla planes activos, facturación y estadísticas.</p>
              </div>
              <Settings2 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(Object.entries(planStats.totals) as [VenuePlan, number][]).map(([plan, total]) => (
                <div key={plan} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{plan}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{total}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Cancha</th>
                    <th className="px-4 py-3 text-left font-medium">Plan</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {venues.map((venue) => (
                    <tr key={`${venue.id}-plan`} className="bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{venue.name}</div>
                        <div className="text-xs text-gray-500">{venue.owner}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <select
                          value={venue.subscription}
                          onChange={(event) => handleChangeVenuePlan(venue, event.target.value as VenuePlan)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        >
                          <option value="Gratis">Gratis</option>
                          <option value="Avanzado">Avanzado</option>
                          <option value="Pro">Pro</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                            venue.subscriptionActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {venue.subscriptionActive ? "Activa" : "Cancelada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleToggleVenueSubscription(venue, !venue.subscriptionActive)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                            venue.subscriptionActive
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                          )}
                        >
                          {venue.subscriptionActive ? "Cancelar" : "Reactivar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Facturación por plan</h3>
            <div className="mt-4 space-y-3 text-sm">
              {(Object.entries(planStats.revenueByPlan) as [VenuePlan, number][]).map(([plan, amount]) => (
                <div key={`${plan}-revenue`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span className="text-gray-600">{plan}</span>
                  <span className="font-medium text-gray-900">{formatCurrencyCLP(amount)}</span>
                </div>
              ))}
            </div>

            <h4 className="mt-6 text-sm font-semibold text-gray-900">Registro de pagos y vencimientos</h4>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-xs">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Cancha</th>
                    <th className="px-3 py-2 text-left font-medium">Monto</th>
                    <th className="px-3 py-2 text-left font-medium">Vence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptionPayments.map((payment) => (
                    <tr key={`${payment.id}-subscription`} className="bg-white">
                      <td className="px-3 py-2 text-gray-600">{payment.venueName}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{formatCurrencyCLP(payment.amount)}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {new Date(payment.dueDate).toLocaleDateString("es-CL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="configuracion" className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Configuración global</h2>
                <p className="text-sm text-gray-600">Actualiza comisiones, parámetros de Mercado Pago y módulos activos.</p>
              </div>
              <Settings2 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Porcentajes de comisión</h3>
                {(Object.entries(globalConfig.commissionByPlan) as [VenuePlan, number][]).map(([plan, value]) => (
                  <label key={`commission-${plan}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span>{plan}</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      step={0.5}
                      value={Math.round(value * 1000) / 10}
                      onChange={(event) => handleCommissionChange(plan, Number(event.target.value))}
                      className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm"
                    />
                  </label>
                ))}

                <h3 className="text-sm font-semibold text-gray-900">Módulos disponibles</h3>
                <div className="space-y-2 text-sm">
                  {(Object.entries(globalConfig.modules) as [keyof GlobalConfigState["modules"], boolean][]).map(([module, enabled]) => (
                    <label key={`module-${module}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <span className="capitalize">{module}</span>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) => handleToggleModule(module, event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Parámetros Mercado Pago</h3>
                <label className="text-xs text-gray-500">
                  Public Key
                  <input
                    value={globalConfig.mercadoPago.publicKey}
                    onChange={(event) => handleUpdateMercadoPago("publicKey", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Access Token
                  <input
                    value={globalConfig.mercadoPago.privateKey}
                    onChange={(event) => handleUpdateMercadoPago("privateKey", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Webhook URL
                  <input
                    value={globalConfig.mercadoPago.webhookUrl}
                    onChange={(event) => handleUpdateMercadoPago("webhookUrl", event.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={globalConfig.mercadoPago.sandbox}
                    onChange={(event) => handleUpdateMercadoPago("sandbox", event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  Usar credenciales sandbox
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Textos y parámetros</h3>
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <label className="block text-xs text-gray-500">
                Texto footer
                <textarea
                  value={globalConfig.footerText}
                  onChange={(event) => handleConfigTextChange("footerText", event.target.value)}
                  className="mt-1 h-20 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-gray-500">
                URL Términos y condiciones
                <input
                  value={globalConfig.termsUrl}
                  onChange={(event) => handleConfigTextChange("termsUrl", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs text-gray-500">
                URL Política de privacidad
                <input
                  value={globalConfig.privacyUrl}
                  onChange={(event) => handleConfigTextChange("privacyUrl", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-gray-500">
                  Cupos máximos por partido
                  <input
                    type="number"
                    min={8}
                    max={30}
                    value={globalConfig.matchSettings.maxPlayers}
                    onChange={(event) => handleMatchSettingChange("maxPlayers", Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-500">
                  Duración estándar (min)
                  <input
                    type="number"
                    min={60}
                    max={120}
                    step={15}
                    value={globalConfig.matchSettings.defaultDuration}
                    onChange={(event) => handleMatchSettingChange("defaultDuration", Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section id="analitica" className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Análisis y reportes</h2>
                <p className="text-sm text-gray-600">Actividad de usuarios, desempeño de canchas y tasa de cancelación.</p>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Jugadores activos</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsSummary.activePlayers}</p>
                <p className="text-[11px] text-gray-500">Nuevos 30d: {analyticsSummary.newPlayersLast30Days}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Recurrentes vs nuevos</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {(analyticsSummary.newVsRecurrentRate * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-gray-500">Recurrentes: {analyticsSummary.recurrentPlayers}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Tasa de cancelación</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {(analyticsSummary.cancellationRate * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-gray-500">Partidos analizados: {matchStats.total}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Satisfacción promedio</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsSummary.averageSatisfaction.toFixed(1)}/5</p>
                <p className="text-[11px] text-gray-500">Tickets con encuesta: {tickets.filter((t) => t.satisfaction).length}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Actividad por hora</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {activity.slice(-6).map((entry) => (
                    <div key={`activity-${entry.hour}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span>{entry.hour}</span>
                      <span className="text-xs text-gray-500">{entry.players} jugadores / {entry.organizers} orgs</span>
                      <span className="font-medium text-gray-900">{entry.total}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Canchas con mejor desempeño</h3>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  {topVenuesByRevenue.map(({ venue, latestRevenue }) => (
                    <div key={`top-${venue.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span>{venue.name}</span>
                      <span className="text-xs text-gray-500">Rating {venue.rating.toFixed(1)}</span>
                      <span className="font-medium text-gray-900">{formatCurrencyCLP(latestRevenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Reportes descargables</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mt-1 text-sm text-gray-600">Exporta métricas para comités o inversionistas.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              {(
                [
                  { key: "30", label: "30 días" },
                  { key: "90", label: "90 días" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setReportRange(option.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5",
                    reportRange === option.key
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleExportAnalytics("csv")}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" /> CSV {reportRange} días
              </button>
              <button
                onClick={() => handleExportAnalytics("pdf")}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-900"
              >
                <FileSpreadsheet className="h-4 w-4" /> Exportar a PDF
              </button>
            </div>
            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <h4 className="text-sm font-semibold text-gray-900">Ingresos netos por período</h4>
              {financeSummary.trendData.map((entry) => (
                <div key={`trend-${entry.period}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  <span>{entry.period}</span>
                  <span className="font-medium text-gray-900">{formatCurrencyCLP(entry.gross - entry.commission)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="alertas" className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Alertas y notificaciones</h2>
                <p className="text-sm text-gray-600">Monitorea incidentes críticos y notificaciones automáticas.</p>
              </div>
              <BellRing className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-5 space-y-4">
              {alerts.length === 0 && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  No hay alertas activas.
                </div>
              )}
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertIcon severity={alert.severity} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                          <AlertBadge severity={alert.severity} />
                        </div>
                        <p className="text-xs text-gray-600">{alert.detail}</p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {new Date(alert.timestamp).toLocaleString("es-CL")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      <Check className="h-3.5 w-3.5" /> Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Automatizaciones</h3>
              <p className="mt-1 text-sm text-gray-600">Activa o pausa reglas automáticas.</p>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                {automations.map((automation) => (
                  <div key={automation.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <div>
                      <p className="font-medium text-gray-900">{automation.label}</p>
                      <p className="text-xs text-gray-500">{automation.description}</p>
                      {automation.lastTriggered && (
                        <p className="text-[11px] text-gray-400">Última ejecución {new Date(automation.lastTriggered).toLocaleString("es-CL")}</p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={automation.enabled}
                      onChange={(event) => handleAutomationToggle(automation.id, event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Logs del sistema</h3>
              <p className="mt-1 text-sm text-gray-600">Acciones recientes registradas por el equipo admin.</p>
              <div className="mt-3 max-h-56 overflow-y-auto text-sm text-gray-600">
                {actionLog.length === 0 && <p className="text-xs text-gray-400">Aún no hay eventos registrados.</p>}
                <ul className="space-y-2">
                  {actionLog.slice(0, 10).map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{entry.entity}</span>
                        <span>{new Date(entry.timestamp).toLocaleString("es-CL")}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{entry.action}</p>
                      <p className="text-[11px] text-gray-400">{entry.actor}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="administradores" className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Administradores y roles</h2>
                <p className="text-sm text-gray-600">Gestiona accesos y permisos del panel interno.</p>
              </div>
              <UserCog className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Administrador</th>
                    <th className="px-4 py-3 text-left font-medium">Rol</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{admin.name}</div>
                        <div className="text-xs text-gray-500">{admin.email}</div>
                        <div className="text-[11px] text-gray-400">Último login {new Date(admin.lastLogin).toLocaleString("es-CL")}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <select
                          value={admin.role}
                          onChange={(event) => {
                            handleUpdateAdmin(admin.id, { role: event.target.value as AdminPermission });
                            appendActionLog("administradores", `Cambiaste rol de ${admin.email} a ${event.target.value}`);
                            showToast("Permisos actualizados.");
                          }}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        >
                          <option value="lectura">Solo lectura</option>
                          <option value="finanzas">Finanzas</option>
                          <option value="total">Full acceso</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <button
                          onClick={() => {
                            handleUpdateAdmin(admin.id, { active: !admin.active });
                            appendActionLog(
                              "administradores",
                              `${!admin.active ? "Reactivaste" : "Suspendiste"} a ${admin.email}`,
                            );
                            showToast(!admin.active ? "Administrador activado." : "Administrador suspendido.");
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium",
                            admin.active
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-gray-200 text-gray-500 hover:bg-gray-100",
                          )}
                        >
                          {admin.active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveAdmin(admin.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <UserMinus className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Agregar administrador</h3>
            <p className="mt-1 text-sm text-gray-600">Asigna rápidamente nuevas cuentas administrativas.</p>
            <div className="mt-4 space-y-3 text-sm">
              <input
                value={newAdminForm.name}
                onChange={(event) => setNewAdminForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
              <input
                value={newAdminForm.email}
                onChange={(event) => setNewAdminForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Correo corporativo"
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
              <select
                value={newAdminForm.role}
                onChange={(event) => setNewAdminForm((prev) => ({ ...prev, role: event.target.value as AdminPermission }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              >
                <option value="lectura">Solo lectura</option>
                <option value="finanzas">Finanzas</option>
                <option value="total">Full acceso</option>
              </select>
              <button
                onClick={() => {
                  if (!newAdminForm.email || !newAdminForm.name) {
                    showToast("Completa nombre y correo.", "error");
                    return;
                  }
                  handleAddAdmin({
                    name: newAdminForm.name,
                    email: newAdminForm.email,
                    role: newAdminForm.role,
                    lastLogin: new Date().toISOString(),
                    active: true,
                  });
                  setNewAdminForm({ name: "", email: "", role: "lectura" });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                <UserPlus className="h-4 w-4" /> Crear admin
              </button>
            </div>
          </div>
        </section>

        <section id="soporte" className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Soporte y feedback</h2>
                <p className="text-sm text-gray-600">Gestiona tickets, SLA y comunicaciones masivas.</p>
              </div>
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {(
                [
                  { key: "todos", label: "Todos" },
                  { key: "abierto", label: "Abiertos" },
                  { key: "en_progreso", label: "En progreso" },
                  { key: "cerrado", label: "Cerrados" },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  onClick={() => setTicketFilter(option.key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5",
                    ticketFilter === option.key
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Ticket</th>
                    <th className="px-4 py-3 text-left font-medium">Prioridad</th>
                    <th className="px-4 py-3 text-left font-medium">Estado</th>
                    <th className="px-4 py-3 text-left font-medium">Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{ticket.subject}</div>
                        <div className="text-xs text-gray-500">{ticket.requester} · SLA {ticket.slaHours}h</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{ticket.priority}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <select
                          value={ticket.status}
                          onChange={(event) => {
                            handleTicketUpdate(ticket.id, { status: event.target.value as SupportTicketRecord["status"] });
                            appendActionLog("soporte", `Actualizaste ticket ${ticket.id} a ${event.target.value}`);
                          }}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        >
                          <option value="abierto">Abierto</option>
                          <option value="en_progreso">En progreso</option>
                          <option value="cerrado">Cerrado</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{ticket.channel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Estadísticas de soporte</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tickets abiertos</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{supportStats.openCount}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Resueltos</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{supportStats.resolvedCount}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Tiempo respuesta</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{Math.round(supportStats.averageResponseMinutes)} min</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Satisfacción</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsSummary.averageSatisfaction.toFixed(1)}/5</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <h4 className="text-sm font-semibold text-gray-900">Encuestas recientes</h4>
                {tickets
                  .filter((ticket) => typeof ticket.satisfaction === "number")
                  .map((ticket) => (
                    <div key={`feedback-${ticket.id}`} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <span>{ticket.requester}</span>
                      <span className="text-xs text-gray-500">{ticket.satisfaction?.toFixed(1)} / 5</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Broadcast a usuarios</h3>
              <p className="text-sm text-gray-600">Mensaje enviado a {broadcastTargets} contactos.</p>
              <textarea
                value={broadcastMessage}
                onChange={(event) => setBroadcastMessage(event.target.value)}
                className="mt-3 h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Comparte novedades, mantenimientos o comunicados generales"
              />
              <button
                onClick={handleBroadcast}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                <Send className="h-4 w-4" /> Enviar broadcast
              </button>
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
