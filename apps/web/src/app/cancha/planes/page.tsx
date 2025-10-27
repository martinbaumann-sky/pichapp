"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { VENUE_PLANS, getVenuePlan, type VenuePlanSlug } from "@/lib/venuePlans";
import { useAuth, resolveUserRole } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

type VenueStatus = {
  id: string;
  name: string;
  plan: string;
  payoutEmail?: string | null;
  subscriptions: Array<{
    id: string;
    plan: string;
    status: string;
    createdAt: string;
  }>;
};

const planList = Object.values(VENUE_PLANS);

type StatusResponse = {
  venue: VenueStatus;
};

export default function CanchaPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const role = resolveUserRole(user);
  const [status, setStatus] = useState<VenueStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const requestedPlan = useMemo(() => getVenuePlan(searchParams.get("plan")), [searchParams]);
  const currentPlan = useMemo(() => getVenuePlan(status?.plan ?? "gratis"), [status?.plan]);

  useEffect(() => {
    if (authLoading) return;
    if (role === "venue_admin" || role === "superadmin") {
      (async () => {
        try {
          setLoadingStatus(true);
          const res = await fetch("/api/venue/plans/status", { cache: "no-store" });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || "No pudimos cargar tu plan");
          }
          const data = (await res.json()) as StatusResponse;
          setStatus(data.venue);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Error inesperado";
          setError(message);
        } finally {
          setLoadingStatus(false);
        }
      })();
    }
  }, [role, authLoading]);

  useEffect(() => {
    const success = searchParams.get("planSuccess");
    const planSlug = searchParams.get("planStatus");
    if (success === "1" && planSlug) {
      const info = getVenuePlan(planSlug);
      if (info) {
        setMessage(`Plan ${info.name} activado correctamente.`);
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("planSuccess");
          params.delete("planStatus");
          const next = params.toString();
          window.history.replaceState({}, "", next ? `?${next}` : window.location.pathname);
        }
      }
    }
  }, [searchParams]);

  const handleSelect = async (planSlug: VenuePlanSlug) => {
    setError(null);
    setMessage(null);
    if (role !== "venue_admin" && role !== "superadmin") {
      router.push(`/cancha/registro?plan=${planSlug}`);
      return;
    }
    if (currentPlan?.slug === planSlug && planSlug !== "gratis") {
      setMessage("Ya estás en este plan.");
      return;
    }
    try {
      setProcessing(planSlug);
      const payload = {
        plan: planSlug,
        returnUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/cancha/planes?plan=${planSlug}&planStatus=${planSlug}&planSuccess=1`
            : undefined,
      };
      const res = await fetch("/api/venue/plans/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "No pudimos iniciar el pago");
      }
      const data = (await res.json()) as { checkoutUrl?: string | null; redirectUrl?: string | null };
      if (data.checkoutUrl) {
        if (typeof window !== "undefined") {
          window.location.href = data.checkoutUrl;
        }
      } else {
        setMessage("Tu plan gratis quedó activo.");
        if (data.redirectUrl && typeof window !== "undefined") {
          window.history.replaceState({}, "", data.redirectUrl);
        }
        setStatus((prev) => (prev ? { ...prev, plan: planSlug } : prev));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setProcessing(null);
    }
  };

  const heroPlan = requestedPlan ?? currentPlan ?? VENUE_PLANS.gratis;

  return (
    <div className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Planes para canchas verificadas
            </span>
            <h1 className="text-4xl font-bold text-gray-900">Contrata el plan ideal para tu complejo deportivo</h1>
            <p className="text-lg text-gray-600">
              Optimiza tus reservas y automatiza cobros con una suscripción mensual que se adapta al volumen de tu cancha.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Mercado Pago integrado
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                <CreditCard className="h-3.5 w-3.5" /> Cobros recurrentes automáticos
              </span>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {role === "venue_admin" || role === "superadmin"
                ? "Selecciona un plan y confirmaremos la suscripción en Mercado Pago. Puedes administrarla luego en el panel."
                : "Registra tu cancha para activar un plan. El plan Gratis no tiene costos fijos."}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/cancha/registro" className="btn-primary btn-mobile">
                Registrar mi cancha
              </Link>
              <Link href="/cancha/ingresar" className="btn-secondary btn-mobile">
                Ingresar al panel
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Plan destacado</h2>
            <p className="mt-2 text-sm text-gray-600">{heroPlan.description}</p>
            <div className="mt-4 rounded-3xl border border-gray-900 bg-gray-50 p-6">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">{heroPlan.name}</span>
              <div className="mt-2 text-3xl font-bold text-gray-900">{heroPlan.priceLabel}</div>
              <div className="text-sm font-semibold text-emerald-600">{heroPlan.commissionLabel}</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {heroPlan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {message ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">Compara planes</h2>
          <p className="mt-2 text-sm text-gray-600">Suscripción mensual con renovación automática. Puedes cambiar o cancelar cuando quieras.</p>
          {loadingStatus ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Actualizando estado de tu cancha…
            </div>
          ) : null}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {planList.map((plan) => {
              const isCurrent = currentPlan?.slug === plan.slug;
              const isProcessing = processing === plan.slug;
              const isAdmin = role === "venue_admin" || role === "superadmin";
              const disabled = isAdmin ? (processing !== null && processing !== plan.slug) || loadingStatus : false;
              return (
                <div
                  key={plan.slug}
                  className={cn(
                    "rounded-3xl border p-6 shadow-sm transition",
                    plan.highlight ? "border-gray-900 bg-white shadow-xl" : "border-gray-200 bg-white",
                    isCurrent ? "ring-2 ring-emerald-400" : "",
                  )}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">{plan.name}</span>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Plan actual
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
                    onClick={() => handleSelect(plan.slug)}
                    disabled={disabled}
                    className={cn(
                      "mt-6 w-full rounded-full px-4 py-2 text-sm font-semibold transition",
                      plan.highlight
                        ? "bg-gray-900 text-white hover:bg-gray-800"
                        : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20",
                    )}
                  >
                    {isProcessing ? "Redirigiendo…" : isAdmin ? "Contratar plan" : "Elegir plan"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {status && status.subscriptions.length > 0 ? (
          <div className="mt-12 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg backdrop-blur">
            <h3 className="text-lg font-semibold text-gray-900">Suscripciones recientes</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {status.subscriptions.map((sub) => {
                const plan = getVenuePlan(sub.plan);
                return (
                  <li key={sub.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{plan ? plan.name : sub.plan}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase tracking-widest text-gray-500">
                      {sub.status}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(sub.createdAt).toLocaleString("es-CL")}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-gray-500">
              Administra tu facturación en el <Link href="/panel/cancha?tab=billing" className="font-semibold text-emerald-700">panel de cancha</Link>.
            </p>
          </div>
        ) : null}

        <div className="mt-12 rounded-3xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          <h3 className="text-lg font-semibold text-gray-900">Preguntas frecuentes</h3>
          <ul className="mt-4 space-y-2 list-disc pl-5">
            <li>Los cobros recurrentes se realizan con Mercado Pago y se renuevan automáticamente cada mes.</li>
            <li>El plan Gratis no tiene costo fijo y solo retenemos la comisión correspondiente por cupo cobrado.</li>
            <li>Para asistencia personalizada escríbenos a soporte@pichangapp.cl.</li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            Al contratar un plan aceptas nuestras <Link href="/terminos" className="font-semibold text-gray-900">políticas y términos de servicio</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
