export type VenuePlanSlug = "gratis" | "avanzado" | "pro";

export interface VenuePlanDefinition {
  slug: VenuePlanSlug;
  name: string;
  priceLabel: string;
  monthlyPriceCLP: number;
  commissionLabel: string;
  commissionRate: number;
  description: string;
  features: string[];
  highlight?: boolean;
  mpReason: string;
}

export const VENUE_PLANS: Record<VenuePlanSlug, VenuePlanDefinition> = {
  gratis: {
    slug: "gratis",
    name: "Gratis",
    priceLabel: "$0 / mes",
    monthlyPriceCLP: 0,
    commissionLabel: "14% comisión por cupo cobrado",
    commissionRate: 0.14,
    description: "Comienza sin costos fijos y valida tus horarios más demandados.",
    features: [
      "Publica partidos ilimitados",
      "Pagos seguros con Mercado Pago",
      "Panel organizador y listas de asistencia",
      "Soporte por email en horario hábil",
    ],
    mpReason: "Plan Gratis PichangApp",
  },
  avanzado: {
    slug: "avanzado",
    name: "Avanzado",
    priceLabel: "$39.990 / mes",
    monthlyPriceCLP: 39990,
    commissionLabel: "7% comisión por cupo cobrado",
    commissionRate: 0.07,
    description: "Reduce tu comisión y automatiza la programación de tus partidos.",
    features: [
      "Slots recurrentes y plantillas automáticas",
      "Recordatorios y waitlists inteligentes",
      "Reportes detallados y exportables",
      "Soporte prioritario por chat",
    ],
    highlight: true,
    mpReason: "Plan Avanzado PichangApp",
  },
  pro: {
    slug: "pro",
    name: "Pro",
    priceLabel: "$99.990 / mes",
    monthlyPriceCLP: 99990,
    commissionLabel: "2% comisión por cupo cobrado",
    commissionRate: 0.02,
    description: "Elige la comisión más baja con soporte dedicado para múltiples sedes.",
    features: [
      "Liquidaciones personalizadas y diarias",
      "Gestión multi-sede y staff ilimitado",
      "Integraciones API y webhooks",
      "Ejecutivo dedicado y capacitaciones",
    ],
    mpReason: "Plan Pro PichangApp",
  },
};

export function getVenuePlan(slug: string | null | undefined): VenuePlanDefinition | null {
  if (!slug) return null;
  const key = slug.toLowerCase() as VenuePlanSlug;
  return VENUE_PLANS[key] ?? null;
}

export function isPaidVenuePlan(slug: VenuePlanSlug): boolean {
  return slug !== "gratis";
}
