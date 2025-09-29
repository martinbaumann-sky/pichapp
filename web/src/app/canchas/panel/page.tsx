"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ClipboardList, Clock3, MapPin, Phone } from "lucide-react";

import AuthDialog from "@/components/AuthDialog";
import HeroCancha from "@/components/HeroCancha";
import { useAuth } from "@/hooks/useAuth";

type FieldDraft = {
  name: string;
  surface: string;
  pricePerHour: string;
};

export default function CanchasPanelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [form, setForm] = useState({
    venueName: "",
    comuna: "",
    address: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });
  const [fields, setFields] = useState<FieldDraft[]>([
    { name: "Cancha 1", surface: "Sintética", pricePerHour: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setAuthOpen(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (user && authOpen) {
      setAuthOpen(false);
    }
  }, [authOpen, user]);

  const summary = useMemo(
    () => ({
      fields: fields.filter((field) => field.name.trim().length > 0).length,
      hasContact: form.contactName.trim().length > 0 && form.contactPhone.trim().length > 0,
    }),
    [fields, form.contactName, form.contactPhone]
  );

  const handleFieldChange = (index: number, key: keyof FieldDraft, value: string) => {
    setFields((prev) => prev.map((field, i) => (i === index ? { ...field, [key]: value } : field)));
  };

  const handleAddField = () => {
    setFields((prev) => [...prev, { name: "", surface: "Sintética", pricePerHour: "" }]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AuthDialog
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open);
            if (!open) router.replace("/");
          }}
          initialTab="login"
          next="/canchas/panel"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:text-black transition-colors">
              ← Volver a inicio
            </Link>
            <h1 className="text-xl md:text-2xl font-semibold text-black">Panel de canchas</h1>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
            <Clock3 className="w-4 h-4" />
            <span>Onboarding guiado en menos de 5 minutos</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-10">
          <section className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="rounded-2xl bg-black text-white p-3">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-black">Datos del complejo</h2>
                  <p className="text-sm text-gray-600">
                    Cuéntanos sobre tu recinto para habilitarte dentro de la red de PichangApp.
                  </p>
                </div>
              </div>

              {submitted ? (
                <div className="rounded-2xl bg-green-50 border border-green-200 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-700">¡Todo listo!</h3>
                      <p className="text-sm text-green-700">
                        Recibimos tu información. Te contactaremos en las próximas horas para validar los datos y activar tu panel.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Nombre del complejo
                      <input
                        value={form.venueName}
                        onChange={(event) => setForm((prev) => ({ ...prev, venueName: event.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="Ej: Complejo Los Maitenes"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Comuna
                      <input
                        value={form.comuna}
                        onChange={(event) => setForm((prev) => ({ ...prev, comuna: event.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="Ej: Ñuñoa"
                        required
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Dirección
                    <input
                      value={form.address}
                      onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                      placeholder="Av. Principal 1234"
                      required
                    />
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Nombre del administrador
                      <input
                        value={form.contactName}
                        onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="Ej: Carla Pérez"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Teléfono de contacto
                      <input
                        value={form.contactPhone}
                        onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="+56 9 1234 5678"
                        required
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Notas o reglas del complejo
                    <textarea
                      value={form.notes}
                      onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 min-h-[100px]"
                      placeholder="Horarios disponibles, tolerancia de atraso, formato de reservas, etc."
                    />
                  </label>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-black">Canchas disponibles</h3>
                        <p className="text-xs text-gray-500">Detalla cada cancha que quieres habilitar.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddField}
                        className="text-sm font-medium text-black hover:text-gray-700"
                      >
                        + Agregar cancha
                      </button>
                    </div>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={`field-${index}`} className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                          <div className="grid md:grid-cols-[2fr,1fr,1fr] gap-3 text-sm text-gray-700">
                            <label className="flex flex-col gap-1">
                              Nombre
                              <input
                                value={field.name}
                                onChange={(event) => handleFieldChange(index, "name", event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                                placeholder="Cancha techada 1"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              Superficie
                              <input
                                value={field.surface}
                                onChange={(event) => handleFieldChange(index, "surface", event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                                placeholder="Sintética, carpeta, cemento"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              Precio por hora
                              <input
                                value={field.pricePerHour}
                                onChange={(event) => handleFieldChange(index, "pricePerHour", event.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
                                placeholder="$35.000"
                              />
                            </label>
                          </div>
                          {fields.length > 1 && (
                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveField(index)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 md:px-8 py-3 bg-black text-white rounded-lg font-semibold transition-colors duration-200 hover:bg-gray-900 disabled:opacity-60"
                    >
                      {submitting ? "Enviando..." : "Enviar solicitud"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Resumen</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-black" />
                  {summary.fields > 0 ? `${summary.fields} cancha(s) registradas` : "Agrega al menos una cancha"}
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-black" />
                  {form.address ? form.address : "Ingresa la dirección exacta"}
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-black" />
                  {summary.hasContact ? form.contactPhone : "Añade un teléfono de contacto"}
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm p-6 space-y-5">
              <h3 className="text-lg font-semibold text-black">¿Qué sigue?</h3>
              <ol className="space-y-4 text-sm text-gray-600">
                <li className="flex gap-3">
                  <div className="mt-0.5 text-xs font-semibold text-white bg-black rounded-full w-6 h-6 flex items-center justify-center">1</div>
                  Validamos los datos y coordinamos una llamada de activación.
                </li>
                <li className="flex gap-3">
                  <div className="mt-0.5 text-xs font-semibold text-white bg-black rounded-full w-6 h-6 flex items-center justify-center">2</div>
                  Configuramos horarios, reglas y conectamos tus canchas al marketplace.
                </li>
                <li className="flex gap-3">
                  <div className="mt-0.5 text-xs font-semibold text-white bg-black rounded-full w-6 h-6 flex items-center justify-center">3</div>
                  Empiezas a recibir reservas confirmadas y pagos protegidos.
                </li>
              </ol>
            </div>

            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 space-y-3">
              <p className="font-semibold text-black">¿Necesitas ayuda inmediata?</p>
              <p>Escríbenos a <a className="underline" href="mailto:canchas@pichangapp.cl">canchas@pichangapp.cl</a> o al <a className="underline" href="tel:+56987654321">+56 9 8765 4321</a>.</p>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <HeroCancha className="w-full h-auto" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
