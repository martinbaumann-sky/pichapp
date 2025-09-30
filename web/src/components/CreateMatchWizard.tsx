"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DateTimePicker from "@/components/DateTimePicker";
import dynamic from "next/dynamic";
import { nivelES } from "@/lib/i18n";
import { staticMapUrl } from "@/lib/maps";
import { streetViewUrl } from "@/lib/places";
import { motion } from "framer-motion";
import LevelBadge from "@/components/LevelBadge";
import { Loader2 } from "lucide-react";

type Form = {
  title: string;
  comuna?: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  venueName: string;
  venueAddress: string;
  fieldNumber?: string;
  lat?: number;
  lng?: number;
  displayAddress?: string;
  place_id?: string;
  photoUrl?: string;
  startsAt: string;
  durationMins: number;
  totalSpots: number;
  minSpotsToConfirm: number;
  occupiedSpots: number;
  pricePerSpot: number;
};

const stepTitles = ["Información básica", "Fecha y hora", "Cupos", "Confirmar"];

export default function CreateMatchWizard() {
  const MiniMap = dynamic(() => import("@/components/MatchMiniMap"), { ssr: false });
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [venueReady, setVenueReady] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>({
    title: "",
    level: "INTERMEDIATE",
    venueName: "",
    venueAddress: "",
    fieldNumber: "",
    startsAt: "",
    durationMins: 90,
    totalSpots: 10,
    minSpotsToConfirm: 6,
    occupiedSpots: 0,
    pricePerSpot: 0,
  } as Form);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/venue/profile", { cache: "no-store" });
        if (!res.ok) throw new Error("No autorizado");
        const data = await res.json().catch(() => null);
        const venue = data?.venue;
        if (!venue) throw new Error("No encontramos la información de tu cancha");
        setForm((prev) => ({
          ...prev,
          venueName: venue.name ?? prev.venueName,
          venueAddress: venue.address ?? prev.venueAddress,
          displayAddress: venue.address ?? prev.displayAddress,
          comuna: venue.comuna ?? prev.comuna,
          lat: typeof venue.lat === "number" ? venue.lat : prev.lat,
          lng: typeof venue.lng === "number" ? venue.lng : prev.lng,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "No pudimos cargar tu cancha";
        setVenueError(message);
      } finally {
        setVenueReady(true);
      }
    })();
  }, []);

  const allowNext = useMemo(() => {
    if (step === 0) return form.title.trim().length > 0 && !!form.level && venueReady;
    if (step === 1) return !!form.startsAt && form.durationMins >= 30;
    if (step === 2)
      return (
        form.totalSpots >= 6 &&
        form.minSpotsToConfirm >= 1 &&
        form.minSpotsToConfirm <= form.totalSpots &&
        form.pricePerSpot >= 0 &&
        form.pricePerSpot <= 50000
      );
    return true;
  }, [step, form, venueReady]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }),
    [],
  );

  const goTo = (next: number) => {
    setStep(next);
  };

  const onSubmit = async () => {
    try {
      setBusy(true);
      let coverImageUrl: string | undefined = form.photoUrl || undefined;
      if (!coverImageUrl && form.lat && form.lng) {
        const sv = streetViewUrl(form.lat, form.lng);
        coverImageUrl = sv || staticMapUrl({ lat: form.lat, lng: form.lng }) || undefined;
      }
      if (coverImageUrl && !/^https?:\/\//i.test(coverImageUrl)) coverImageUrl = undefined;

      const finalTitle = form.fieldNumber ? `${form.title} - ${form.fieldNumber}` : form.title;
      const payload: any = {
        ...form,
        title: finalTitle,
        durationMins: Number(form.durationMins || 0),
        totalSpots: Number(form.totalSpots || 0),
        minSpotsToConfirm: Number(form.minSpotsToConfirm || 0),
        occupiedSpots: 0,
        venueName: form.venueName || "",
        venueAddress: form.venueAddress || form.displayAddress || "",
        coverImageUrl,
        occupiedPlayers: [],
      };

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "Error al crear partido");
        alert(txt || "Error al crear partido");
        return;
      }
      await res.json().catch(() => null);
      router.push("/panel/cancha/partidos");
    } finally {
      setBusy(false);
    }
  };

  const stepper = (
    <div className="mb-6 flex items-center gap-2">
      {stepTitles.map((title, index) => (
        <div key={title} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              index <= step ? "bg-black text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {index + 1}
          </div>
          <div className={`text-sm ${index === step ? "font-semibold text-black" : "text-gray-500"}`}>{title}</div>
          {index < stepTitles.length - 1 && <div className="h-[2px] w-8 bg-gray-300" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold">Organizar partido</h1>
      <p className="mb-6 text-gray-600">Completa los pasos para publicar tu pichanga oficial.</p>
      {stepper}
      {venueError ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{venueError}</div>
      ) : null}

      {step === 0 && (
        <motion.div
          key="step-basic"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm text-gray-700">Título del partido</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Pichanga miércoles noche"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Incluye el formato o nivel para que los jugadores lo reconozcan fácilmente.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nivel</label>
            <div className="flex flex-wrap gap-2">
              {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => {
                const active = form.level === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, level }))}
                    className={`rounded-xl border px-3 py-2 transition-all ${
                      active ? "ring-2 ring-black/20 shadow-sm" : "hover:bg-gray-50"
                    }`}
                  >
                    <LevelBadge level={level as any} withDot size="md" />
                  </button>
                );
              })}
            </div>
            <select
              aria-label="Nivel"
              value={form.level}
              onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value as Form["level"] }))}
              className="sr-only"
            >
              <option value="BEGINNER">{nivelES.BEGINNER}</option>
              <option value="INTERMEDIATE">{nivelES.INTERMEDIATE}</option>
              <option value="ADVANCED">{nivelES.ADVANCED}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">N° de cancha (opcional)</label>
            <input
              value={form.fieldNumber}
              onChange={(event) => setForm((prev) => ({ ...prev, fieldNumber: event.target.value }))}
              placeholder="Cancha 3"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none"
            />
          </div>
          <LocationSummary
            name={form.venueName}
            address={form.venueAddress || form.displayAddress}
            comuna={form.comuna}
            lat={form.lat}
            lng={form.lng}
            MiniMap={MiniMap}
          />
        </motion.div>
      )}

      {step === 1 && (
        <motion.div
          key="step-date"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-sm text-gray-700">Fecha y hora</label>
            <DateTimePicker value={form.startsAt} onChange={(iso) => setForm((prev) => ({ ...prev, startsAt: iso }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Duración (min)</label>
            <input
              type="number"
              min={30}
              max={180}
              step={5}
              value={form.durationMins}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, durationMins: Math.max(30, Number(event.target.value || 0)) }))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Entre 30 y 180 minutos. Puedes ajustar luego desde el panel.</p>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          key="step-spots"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Cupos máximos</label>
              <input
                type="number"
                min={6}
                max={30}
                value={form.totalSpots}
                onChange={(event) => {
                  const total = Math.max(6, Math.min(30, Number(event.target.value || 0)));
                  const suggestedMin = Math.max(1, Math.ceil(total * 0.6));
                  setForm((prev) => ({
                    ...prev,
                    totalSpots: total,
                    minSpotsToConfirm: Math.min(Math.max(prev.minSpotsToConfirm, 1), total) || suggestedMin,
                  }));
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Entre 6 y 30 jugadores.</p>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Mínimo para confirmar</label>
              <input
                type="number"
                min={1}
                max={form.totalSpots}
                value={form.minSpotsToConfirm}
                onChange={(event) => {
                  const value = Math.max(1, Number(event.target.value || 0));
                  setForm((prev) => ({
                    ...prev,
                    minSpotsToConfirm: Math.min(value, prev.totalSpots || value),
                  }));
                }}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 focus:border-black focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Avisamos a los jugadores cuando se alcanza este mínimo.</p>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-gray-700">Precio por cupo (CLP)</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  step={500}
                  value={form.pricePerSpot}
                  onChange={(event) => {
                    const raw = Number(event.target.value || 0);
                    const next = Math.max(0, Math.min(50000, Math.round(raw)));
                    setForm((prev) => ({ ...prev, pricePerSpot: next }));
                  }}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 pl-7 text-gray-900 focus:border-black focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Define el valor que cobran por cada cupo. Recuerda que PichangApp retiene el 10% como comisión.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            El cobro se mostrará a los jugadores al reservar y el pago se procesa mediante Mercado Pago.
          </p>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="step-confirm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <span className="font-medium">Título:</span> {form.title || "-"}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Nivel:</span> <LevelBadge level={form.level as any} />
            </p>
            <p>
              <span className="font-medium">Recinto:</span> {form.venueName || "-"}
            </p>
            <p>
              <span className="font-medium">Dirección:</span> {form.venueAddress || form.displayAddress || "-"}
            </p>
            <p>
              <span className="font-medium">Fecha:</span> {form.startsAt ? new Date(form.startsAt).toLocaleString("es-CL") : "-"}
            </p>
            <p>
              <span className="font-medium">Duración:</span> {form.durationMins} minutos
            </p>
            <p>
              <span className="font-medium">Cupos:</span> {form.totalSpots} jugadores (mínimo {form.minSpotsToConfirm} para confirmar)
            </p>
            <p>
              <span className="font-medium">Precio por cupo:</span> {form.pricePerSpot > 0 ? currencyFormatter.format(form.pricePerSpot) : "Gratis"} (PichangApp retiene 10%)
            </p>
          </div>
          <PreviewCard lat={form.lat} lng={form.lng} photoUrl={form.photoUrl} />
        </motion.div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <button
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 disabled:opacity-50"
          disabled={step === 0 || busy}
          onClick={() => !busy && goTo(Math.max(0, step - 1))}
        >
          Atrás
        </button>
        {step < stepTitles.length - 1 ? (
          <button
            className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-40"
            disabled={!allowNext || busy}
            onClick={() => allowNext && goTo(Math.min(stepTitles.length - 1, step + 1))}
          >
            Siguiente
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-40"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? "Creando…" : "Crear partido"}
          </button>
        )}
      </div>
    </div>
  );
}

function LocationSummary({
  name,
  address,
  comuna,
  lat,
  lng,
  MiniMap,
}: {
  name?: string;
  address?: string;
  comuna?: string;
  lat?: number;
  lng?: number;
  MiniMap: any;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-900">Tu cancha verificada</p>
      <p className="text-sm text-gray-600">{name || "Completa el nombre de tu recinto"}</p>
      <p className="text-xs text-gray-500">{address}</p>
      <p className="text-xs text-gray-400">{comuna}</p>
      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
        <MiniMap lat={lat} lng={lng} title={name || address || "Tu cancha"} />
      </div>
    </div>
  );
}

function PreviewCard({ lat, lng, photoUrl }: { lat?: number; lng?: number; photoUrl?: string }) {
  const computed = useMemo(() => {
    if (photoUrl && /^https?:\/\//i.test(photoUrl)) return photoUrl;
    if (typeof lat === "number" && typeof lng === "number") {
      const sv = streetViewUrl(lat, lng);
      return sv || staticMapUrl({ lat, lng });
    }
    return null;
  }, [lat, lng, photoUrl]);

  return (
    <div>
      <label className="mb-2 block text-sm text-gray-700">Vista previa</label>
      <div className="relative overflow-hidden rounded-xl border bg-gray-50">
        {computed ? (
          <img src={computed} alt="Vista previa de la cancha" className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Selecciona una ubicación para ver el mapa.</div>
        )}
      </div>
    </div>
  );
}
