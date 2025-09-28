"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Datos de la cancha",
    description: "Nombre comercial, RUT y datos de contacto.",
  },
  {
    title: "Ubicación y canchas",
    description: "Dirección, comuna, geolocalización y tipos de cancha.",
  },
  {
    title: "Cuenta de pago",
    description: "Conecta tu cuenta de Mercado Pago para recibir depósitos.",
  },
];

interface FormValues {
  venueName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  comuna: string;
  geo: string;
  fields: string;
  accountHolder: string;
  payoutEmail: string;
  bankAccount: string;
  acceptTerms: boolean;
}

const initialValues: FormValues = {
  venueName: "",
  taxId: "",
  email: "",
  phone: "",
  address: "",
  comuna: "",
  geo: "",
  fields: "",
  accountHolder: "",
  payoutEmail: "",
  bankAccount: "",
  acceptTerms: false,
};

export default function CanchaRegisterPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>(initialValues);

  const isLastStep = step === steps.length - 1;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

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

    if (!isLastStep) {
      setStep((value) => Math.min(steps.length - 1, value + 1));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/venue/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...nextValues,
          bankAccount: nextValues.bankAccount.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "No pudimos completar el registro. Intenta nuevamente.");
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 0 || loading) return;
    setError(null);
    setStep((value) => Math.max(0, value - 1));
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
                  <h2 className="text-2xl font-semibold text-gray-900">¡Todo listo!</h2>
                  <p className="text-sm text-gray-600">
                    Revisaremos tu información y te avisaremos por correo cuando tu cancha esté verificada. Luego podrás crear
                    partidos desde el panel.
                  </p>
                  <Link href="/panel/cancha" className="btn-primary btn-mobile sm:px-10 sm:py-4">
                    Ir al panel de cancha
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{currentStep.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{currentStep.description}</p>
                  </div>

                  {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="administracion@cancha.cl"
                        value={formValues.email}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, email: value }))}
                      />
                      <Field
                        label="Teléfono"
                        name="phone"
                        placeholder="+56 9 8765 4321"
                        value={formValues.phone}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, phone: value }))}
                      />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-4">
                      <Field
                        label="Dirección"
                        name="address"
                        placeholder="Av. Siempre Viva 123"
                        value={formValues.address}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, address: value }))}
                      />
                      <Field
                        label="Comuna"
                        name="comuna"
                        placeholder="Providencia"
                        value={formValues.comuna}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, comuna: value }))}
                      />
                      <Field
                        label="Ubicación en mapa (URL o coordenadas)"
                        name="geo"
                        placeholder="-33.437, -70.650"
                        value={formValues.geo}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, geo: value }))}
                      />
                      <Field
                        label="Tipos de cancha"
                        name="fields"
                        placeholder="Fútbol 7 techada, Fútbol 5 exterior"
                        value={formValues.fields}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, fields: value }))}
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
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
                        value={formValues.payoutEmail}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, payoutEmail: value }))}
                      />
                      <Field
                        label="Cuenta bancaria (opcional)"
                        name="bankAccount"
                        placeholder="BancoEstado 12345678"
                        value={formValues.bankAccount}
                        required={false}
                        onChange={(value) => setFormValues((prev) => ({ ...prev, bankAccount: value }))}
                      />
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
                      disabled={loading}
                      className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Enviando…" : isLastStep ? "Enviar registro" : "Continuar"}
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
}

function Field({ label, name, placeholder, type = "text", value, onChange, required = true }: FieldProps) {
  return (
    <label className="space-y-2 text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
      />
    </label>
  );
}
