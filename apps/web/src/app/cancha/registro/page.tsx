// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MapPin } from "lucide-react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { staticMapUrl } from "@/lib/maps";
import { VENUE_PLANS, getVenuePlan, isPaidVenuePlan, type VenuePlanSlug } from "@/lib/venuePlans";
import { cn } from "@/utils/cn";

const MiniMap = dynamic(() => import("@/components/MatchMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
      Cargando mapa…
    </div>
  ),
});

type AddressSelection = {
  venueName?: string;
  venueAddress?: string;
  lat?: number;
  lng?: number;
  display?: string;
  place_id?: string;
  photoUrl?: string;
  comuna?: string;
};

const steps = [
  {
    title: "Datos de la cancha",
    description: "Nombre comercial, RUT y datos de contacto.",
  },
  {
    title: "Ubicación y canchas",
    description: "Selecciona tu dirección y validamos automáticamente la ubicación en el mapa.",
  },
  {
    title: "Plan de suscripción",
    description: "Elige el plan que mejor se ajusta al volumen de tu complejo deportivo.",
  },
  {
    title: "Cuenta de pago",
    description: "Conecta tu cuenta de Mercado Pago para recibir depósitos y reembolsos automáticos.",
  },
];

interface FormValues {
  venueName: string;
  taxId: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  comuna: string;
  fields: string;
  lat: number | null;
  lng: number | null;
  placeId?: string;
  accountHolder: string;
  payoutEmail: string;
  mpCollectorId: string;
  mpAccountType: string;
  plan: VenuePlanSlug;
  acceptTerms: boolean;
}

const initialValues: FormValues = {
  venueName: "",
  taxId: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  address: "",
  comuna: "",
  fields: "",
  lat: null,
  lng: null,
  accountHolder: "",
  payoutEmail: "",
  mpCollectorId: "",
  mpAccountType: "",
  plan: "gratis",
  acceptTerms: false,
};

export default function CanchaRegisterPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [planRedirecting, setPlanRedirecting] = useState(false);
  const [mpConnectLoading, setMpConnectLoading] = useState(false);
  const [mpConnectError, setMpConnectError] = useState<string | null>(null);
  const [completedPlan, setCompletedPlan] = useState<VenuePlanSlug | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(initialValues);

  const planOptions = useMemo(() => Object.values(VENUE_PLANS), []);
  const selectedPlanInfo = useMemo(
    () => getVenuePlan(formValues.plan) ?? VENUE_PLANS.gratis,
    [formValues.plan],
  );
  const successPlanInfo = useMemo(
    () => getVenuePlan(completedPlan ?? formValues.plan) ?? VENUE_PLANS.gratis,
    [completedPlan, formValues.plan],
  );

  useEffect(() => {
    const planParam = searchParams.get("plan");
    const info = getVenuePlan(planParam);
    if (info) {
      setFormValues((prev) => (prev.plan === info.slug ? prev : { ...prev, plan: info.slug }));
    }
  }, [searchParams]);

  const handleAddressChange = (value: AddressSelection) => {
    setFormValues((prev) => {
      const next = { ...prev };
      const display = typeof value.display === "string" ? value.display : undefined;

      if (display !== undefined) {
        next.address = display;
        if (display.trim().length === 0) {
          next.lat = null;
          next.lng = null;
          next.placeId = undefined;
        }
      }

      if (value.venueAddress && value.venueAddress.trim().length > 0) {
        next.address = value.venueAddress;
      }

      if (value.comuna && value.comuna.trim().length > 0) {
        next.comuna = value.comuna;
      }

      if (value.venueName && (!prev.venueName || prev.venueName.trim().length === 0)) {
        next.venueName = value.venueName;
      }

      if (typeof value.lat === "number" && typeof value.lng === "number") {
        next.lat = value.lat;
        next.lng = value.lng;
      }

      if (value.place_id) {
        next.placeId = value.place_id;
      }

      return next;
    });
  };

  const isLastStep = step === steps.length - 1;

  const hasCoordinates = typeof formValues.lat === "number" && typeof formValues.lng === "number";
  const mapPreviewUrl = hasCoordinates
    ? staticMapUrl({ lat: formValues.lat as number, lng: formValues.lng as number })
    : null;
  const googleMapsLink = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${formValues.lat},${formValues.lng}`
    : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMpConnectError(null);

    const formData = new FormData(event.currentTarget);
    const stepValues: Partial<FormValues> = {};

    formData.forEach((value, key) => {
      if (key === "acceptTerms") {
        stepValues.acceptTerms = true;
        return;
      }

      const typedKey = key as keyof FormValues;
      stepValues[typedKey] = value.toString();
    });

    const nextValues: FormValues = {
      ...formValues,
      ...stepValues,
    };

    setFormValues(nextValues);

    if (step === 0) {
      if (!nextValues.password || nextValues.password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (nextValues.password !== nextValues.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    if (step === 1) {
      if (!nextValues.address || !nextValues.comuna) {
        setError("Completa la dirección y la comuna de tu cancha.");
        return;
      }
      if (nextValues.lat == null || nextValues.lng == null) {
        setError("Selecciona una dirección del listado para geolocalizar tu cancha en el mapa.");
        return;
      }
    }

    if (step === 2) {
      if (!nextValues.plan || !getVenuePlan(nextValues.plan)) {
        setError("Selecciona un plan para continuar.");
        return;
      }
    }

    if (!isLastStep) {
      setStep((value) => Math.min(steps.length - 1, value + 1));
      return;
    }

    if (!nextValues.accountHolder || !nextValues.payoutEmail) {
      setError("Completa los datos del titular y el correo de Mercado Pago para continuar.");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword: _confirm, ...payload } = nextValues;

      const response = await fetch("/api/venue/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "No pudimos completar el registro. Intenta nuevamente.");
      }

      setCompletedPlan(nextValues.plan);

      if (isPaidVenuePlan(nextValues.plan)) {
        setPlanRedirecting(true);
        const returnUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/panel/cancha?tab=billing&planStatus=${nextValues.plan}&planSuccess=1`
            : undefined;
        const checkoutRes = await fetch("/api/venue/plans/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: nextValues.plan, returnUrl }),
        });
        if (!checkoutRes.ok) {
          const data = await checkoutRes.json().catch(() => ({}));
          throw new Error(data?.error ?? "No pudimos iniciar el pago del plan.");
        }
        const checkoutData = (await checkoutRes.json()) as {
          checkoutUrl?: string | null;
          redirectUrl?: string | null;
        };
        if (checkoutData.checkoutUrl && typeof window !== "undefined") {
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
        if (checkoutData.redirectUrl && typeof window !== "undefined") {
          window.location.href = checkoutData.redirectUrl;
          return;
        }
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
      setPlanRedirecting(false);
    }
  };

  const handleBack = () => {
    if (step === 0 || loading) return;
    setError(null);
    setStep((value) => Math.max(0, value - 1));
  };

  const handleConnectMp = async () => {
    try {
      setMpConnectError(null);
      setMpConnectLoading(true);
      const response = await fetch("/api/mp/oauth/init", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error ?? "No pudimos iniciar la conexión con Mercado Pago.");
      }
      const url = typeof data?.url === "string" ? data.url : null;
      if (!url) {
        throw new Error("No recibimos el enlace de Mercado Pago. Intenta nuevamente.");
      }
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos iniciar la conexión con Mercado Pago.";
      setMpConnectError(message);
    } finally {
      setMpConnectLoading(false);
    }
  };

  const currentStep = steps[step];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registra tu cancha</h1>
            <p className="mt-2 text-sm text-gray-600">
              Configura tu perfil de cancha verificada y comienza a publicar partidos oficiales.
            </p>
          </div>
          <Link href="/cancha/ingresar" className="text-sm font-semibold text-gray-900 hover:underline">
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <aside className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Onboarding guiado</h2>
              <p className="mt-3 text-sm text-gray-600">
                Completa los datos básicos y conecta tu cuenta de pago. Puedes invitar a tu staff más tarde.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Verificación básica incluida.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Define políticas de cancelación por cancha.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Programa tu plan Gratis o Pro en cualquier momento.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              ¿Necesitas ayuda? Escríbenos a{" "}
              <a href="mailto:soporte@pichangapp.cl" className="font-semibold text-gray-900">
                soporte@pichangapp.cl
              </a>{" "}
              o revisa la documentación en{" "}
              <Link href="/ayuda" className="font-semibold text-gray-900">
                Ayuda
              </Link>
              .
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center gap-3 text-sm text-gray-500">
              {steps.map((item, index) => (
                <div key={item.title} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                      index <= step ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="hidden sm:inline">{item.title}</span>
                  {index < steps.length - 1 ? <span className="hidden sm:inline text-gray-300">→</span> : null}
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-lg p-6 sm:p-10">
              {success ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" aria-hidden />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">¡Registro enviado!</h2>
                  <p className="text-sm text-gray-600">
                    Revisaremos tu información y te avisaremos por correo cuando tu cancha esté verificada. Mientras tanto,
                    conecta Mercado Pago y activa tu plan desde el panel.
                  </p>
                  <div className="mx-auto max-w-sm rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Plan seleccionado</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{successPlanInfo.name}</p>
                    <p className="text-sm text-gray-600">
                      {successPlanInfo.priceLabel} · {successPlanInfo.commissionLabel}
                    </p>
                  </div>
                  {mpConnectError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {mpConnectError}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleConnectMp}
                      disabled={mpConnectLoading}
                      className="rounded-xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {mpConnectLoading ? "Conectando…" : "Conectar Mercado Pago"}
                    </button>
                    <Link
                      href="/panel/cancha?tab=billing"
                      className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800"
                    >
                      Ir al panel y gestionar plan
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">
                    Desde el panel podrás publicar partidos oficiales, conectar staff y cambiar de plan cuando quieras.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{currentStep.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{currentStep.description}</p>
                  </div>

                  {step === 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field
                        label="Nombre de la cancha"
                        name="venueName"
                        placeholder="Complejo Deportivo Central"
                        value={formValues.venueName}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, venueName: value }))}
                      />
                      <Field
                        label="RUT o identificación"
                        name="taxId"
                        placeholder="76.123.456-7"
                        value={formValues.taxId}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, taxId: value }))}
                      />
                      <Field
                        label="Correo administrativo"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="administracion@cancha.cl"
                        value={formValues.email}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, email: value }))}
                      />
                      <Field
                        label="Teléfono"
                        name="phone"
                        placeholder="+56 9 8765 4321"
                        autoComplete="tel"
                        value={formValues.phone}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, phone: value }))}
                      />
                      <Field
                        label="Contraseña"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        hint="Mínimo 8 caracteres."
                        value={formValues.password}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, password: value }))}
                      />
                      <Field
                        label="Confirmar contraseña"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repite tu contraseña"
                        value={formValues.confirmPassword}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, confirmPassword: value }))}
                      />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-gray-700">Dirección</span>
                        <AddressAutocomplete value={formValues.address} onChange={handleAddressChange} />
                        <p className="text-xs text-gray-500">Selecciona una sugerencia para ubicar automáticamente tu cancha en el mapa.</p>
                        {formValues.address ? (
                          <div className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            <MapPin className="mt-1 h-4 w-4 text-emerald-600" />
                            <div>
                              <p className="font-medium text-gray-900">{formValues.address}</p>
                              {formValues.comuna ? <p className="text-xs text-gray-500">{formValues.comuna}</p> : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <Field
                        label="Comuna"
                        name="comuna"
                        placeholder="Providencia"
                        value={formValues.comuna}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, comuna: value }))}
                      />
                      <Field
                        label="Tipos de cancha"
                        name="fields"
                        multiline
                        rows={3}
                        placeholder="Fútbol 7 techada, Fútbol 5 exterior"
                        hint="Separa cada superficie o tipo con coma o salto de línea."
                        value={formValues.fields}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, fields: value }))}
                      />
                      <div className="overflow-hidden rounded-3xl border border-gray-200">
                        {hasCoordinates ? (
                          <>
                            <MiniMap
                              lat={formValues.lat ?? undefined}
                              lng={formValues.lng ?? undefined}
                              title={formValues.venueName || formValues.address}
                            />
                            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                              Ubicación referencial basada en OpenStreetMap. Ajusta la dirección si el marcador no coincide.
                            </div>
                          </>
                        ) : (
                          <div className="flex h-48 items-center justify-center bg-gray-50 text-sm text-gray-500">
                            Selecciona una dirección para ver el mapa.
                          </div>
                        )}
                      </div>
                      {hasCoordinates && mapPreviewUrl ? (
                        <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                          <img
                            src={mapPreviewUrl}
                            alt="Mapa estático de la cancha"
                            className="h-40 w-full rounded-xl object-cover"
                          />
                          <p>
                            Vista previa estática generada automáticamente.
                            {googleMapsLink ? (
                              <>
                                {" "}
                                <a
                                  href={googleMapsLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-gray-900 underline"
                                >
                                  Abrir en Google Maps
                                </a>
                              </>
                            ) : null}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Selecciona el plan que activa mejor tus cobros. Los planes pagados generan una suscripción mensual con
                        renovación automática.
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {planOptions.map((plan) => {
                          const isSelected = formValues.plan === plan.slug;
                          return (
                            <button
                              key={plan.slug}
                              type="button"
                              onClick={() => setFormValues((prev) => ({ ...prev, plan: plan.slug }))}
                              className={cn(
                                "rounded-2xl border px-5 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-emerald-400",
                                plan.highlight
                                  ? isSelected
                                    ? "border-gray-900 bg-gray-900 text-white shadow-xl"
                                    : "border-gray-900/60 bg-white"
                                  : isSelected
                                    ? "border-gray-900 bg-gray-900/90 text-white shadow-lg"
                                    : "border-gray-200 bg-white hover:border-gray-400",
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500/90">
                                  {plan.name}
                                </span>
                                {isSelected ? (
                                  <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white">
                                    Seleccionado
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-3 text-2xl font-bold">
                                <span>{plan.priceLabel}</span>
                              </div>
                              <p className="mt-1 text-sm font-semibold text-emerald-500">
                                {plan.commissionLabel}
                              </p>
                              <p className="mt-3 text-xs text-gray-500">{plan.description}</p>
                              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                                {plan.features.slice(0, 3).map((feature) => (
                                  <li key={feature} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {feature}
                                  </li>
                                ))}
                              </ul>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500">
                        Podrás cambiar o cancelar tu plan cuando quieras desde el panel de canchas.
                      </p>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Conectamos depósitos y devoluciones automáticas a través de Mercado Pago. Completa estos datos del
                        titular para activar tus liquidaciones.
                      </div>
                      <Field
                        label="Nombre titular de cuenta"
                        name="accountHolder"
                        placeholder="Complejo Deportivo Central"
                        value={formValues.accountHolder}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, accountHolder: value }))}
                      />
                      <Field
                        label="Correo Mercado Pago"
                        name="payoutEmail"
                        type="email"
                        placeholder="pagos@cancha.cl"
                        autoComplete="email"
                        value={formValues.payoutEmail}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, payoutEmail: value }))}
                      />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2 text-sm text-gray-700">
                          <span className="font-medium">Tipo de cuenta en Mercado Pago</span>
                          <select
                            name="mpAccountType"
                            value={formValues.mpAccountType}
                            onChange={(event) =>
                              setFormValues((prev) => ({ ...prev, mpAccountType: event.target.value }))
                            }

                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                          >
                            <option value="">Selecciona una opción</option>
                            <option value="Persona">Persona natural</option>
                            <option value="Empresa">Empresa / Sociedad</option>
                            <option value="Fundación">Fundación u ONG</option>
                          </select>
                          <span className="block text-xs text-gray-500">
                            Al conectar tu cuenta desde el panel detectaremos este dato automaticamente. Ajusta la opcion solo si no coincide.
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-700">
                          <span className="font-medium">Collector ID de Mercado Pago</span>
                          <input
                            name="mpCollectorId"
                            value={formValues.mpCollectorId}
                            onChange={(event) =>
                              setFormValues((prev) => ({ ...prev, mpCollectorId: event.target.value }))
                            }
                            placeholder="123456789"
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                          />
                          <span className="block text-xs text-gray-500">
                            Este campo se completara automaticamente tras autorizar Mercado Pago en tu panel. Solo indicalo manualmente si necesitas usar otro ID.
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-start gap-3 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            name="acceptTerms"
                            required
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                            checked={formValues.acceptTerms}
                            onChange={(event) =>
                              setFormValues((prev) => ({ ...prev, acceptTerms: event.target.checked }))
                            }
                          />
                          <span>
                            Acepto los <Link href="/terminos" className="underline">términos y condiciones</Link> y la{" "}
                            <Link href="/privacidad" className="underline">
                              política de privacidad
                            </Link>
                            .
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={step === 0 || loading}
                      className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Volver
                    </button>
                    <button
                      type="submit"
                      disabled={loading || planRedirecting}
                      className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {planRedirecting
                        ? "Redirigiendo a pago…"
                        : loading
                          ? "Enviando…"
                          : isLastStep
                            ? "Enviar registro"
                            : "Continuar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  required = true,
  autoComplete,
  multiline = false,
  rows = 3,
  hint,
}: FieldProps) {
  return (
    <label className="space-y-2 text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          required={required}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
        />
      )}
      {hint ? <span className="block text-xs text-gray-500">{hint}</span> : null}
    </label>
  );
}
