"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import DateTimePicker from "@/components/DateTimePicker";
import dynamic from "next/dynamic";
import { nivelES } from "@/lib/i18n";
import { staticMapUrl } from "@/lib/maps";
import { streetViewUrl } from "@/lib/places";
import LevelBadge from "@/components/LevelBadge";

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
};

type CreateMatchWizardProps = {
  accountType?: "player" | "venue";
};

export default function CreateMatchWizard({ accountType = "player" }: CreateMatchWizardProps) {
  const MiniMap = dynamic(() => import("@/components/MatchMiniMap"), { ssr: false });
  const isVenue = accountType === "venue";
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
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
  } as any);

  const [venueInfo, setVenueInfo] = useState<any | null>(null);
  const [venueLoading, setVenueLoading] = useState(isVenue);
  const [venueError, setVenueError] = useState<string | null>(null);

  const steps = useMemo(
    () =>
      [
        { id: "info", title: "Información Básica" },
        { id: "location", title: "Ubicación" },
        { id: "datetime", title: "Fecha y Hora" },
        { id: "spots", title: "Cupos" },
        { id: "confirm", title: "Confirmar" },
      ].filter((step) => (isVenue ? step.id !== "location" : true)),
    [isVenue]
  );

  const currentStep = steps[step] ?? steps[0];
  const currentStepId = currentStep?.id ?? "info";

  const allowNext = useMemo(() => {
    if (currentStepId === "info") return !!form.title && !!form.level;
    if (currentStepId === "location") return !!(form.displayAddress || form.venueAddress || form.venueName);
    if (currentStepId === "datetime") return !!form.startsAt && form.durationMins >= 30;
    if (currentStepId === "spots")
      return form.totalSpots >= 6 && form.minSpotsToConfirm >= 1 && form.minSpotsToConfirm <= form.totalSpots;
    return true;
  }, [currentStepId, form]);

  const onAddress = useCallback((v: any) => {
    setForm((prev) => ({
      ...prev,
      displayAddress: v.display ?? prev.displayAddress,
      venueName: v.venueName ?? prev.venueName,
      venueAddress: v.venueAddress ?? prev.venueAddress,
      lat: v.lat ?? prev.lat,
      lng: v.lng ?? prev.lng,
      place_id: v.place_id ?? prev.place_id,
      photoUrl: v.photoUrl ?? prev.photoUrl,
      comuna: v.comuna ?? prev.comuna,
    }));
  }, []);

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
        venueName: form.venueName || "",
        venueAddress: form.venueAddress || form.displayAddress || "",
        // let backend derive comuna from address if missing
        coverImageUrl,
        venueId: venueInfo?.id,
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
      const data = await res.json().catch(() => null);
      const id = data?.match?.id;
      if (id) {
        window.location.href = `/match/${id}`;
      } else {
        window.location.href = "/explorar";
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isVenue) return;
    let active = true;
    setVenueLoading(true);
    setVenueError(null);
    (async () => {
      try {
        const res = await fetch('/api/venues/me', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('HTTP ' + res.status);
        }
        const data = await res.json().catch(() => ({}));
        const venue = data?.venue || null;
        if (!active) return;
        if (!venue) {
          setVenueInfo(null);
          setVenueError('Aún no completaste los datos de tu cancha. Actualiza tu perfil para continuar.');
          return;
        }
        setVenueInfo(venue);
        if (venue.status !== 'APPROVED') {
          setVenueError('Tu cuenta de cancha está pendiente de verificación. Te avisaremos por correo cuando esté aprobada.');
        }
        const labelParts = [venue.name, venue.address].filter((part: string | null | undefined) => !!part && String(part).trim().length > 0);
        setForm((prev) => ({
          ...prev,
          venueName: venue.name ?? prev.venueName,
          venueAddress: venue.address ?? prev.venueAddress,
          displayAddress: labelParts.join(' - '),
          lat: typeof venue.lat === 'number' ? venue.lat : prev.lat,
          lng: typeof venue.lng === 'number' ? venue.lng : prev.lng,
          comuna: venue.comuna ?? prev.comuna,
        }));
      } catch (error) {
        if (!active) return;
        console.error('[CreateMatchWizard] venue fetch failed', error);
        setVenueError('No pudimos cargar tu perfil de cancha. Intenta nuevamente desde tu perfil.');
      } finally {
        if (active) setVenueLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isVenue]);

  useEffect(() => {
    if (!isVenue) return;
    setStep(0);
  }, [isVenue]);

  const stepper = (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {steps.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              i <= step ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {i + 1}
          </div>
          <div className={`text-sm ${item.id === currentStepId ? 'font-semibold text-black' : 'text-gray-500'}`}>
            {item.title}
          </div>
          {i < steps.length - 1 && <div className="w-8 h-[2px] bg-gray-300" />}
        </div>
      ))}
    </div>
  );

  if (isVenue && venueLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center text-gray-600">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-500 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Cargando datos de tu cancha
        </div>
        <p className="text-base">Estamos preparando tu panel para que puedas crear partidos.</p>
      </div>
    );
  }

  if (isVenue && venueError) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-5">
        <h1 className="text-2xl font-semibold">Tu cuenta de cancha</h1>
        <p className="text-gray-600">{venueError}</p>
        <div className="flex justify-center">
          <Link href="/perfil" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-900">
            Ir a mi perfil
          </Link>
        </div>
        {venueInfo && (
          <p className="text-xs text-gray-500">
            Estado actual: {venueInfo.status === 'APPROVED' ? 'verificada' : venueInfo.status === 'PENDING' ? 'pendiente' : 'bloqueada'}.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Organizar Partido</h1>
      <p className="text-gray-600 mb-6">Completa los pasos para publicar tu pichanga.</p>
      {stepper}

      {/* Step content */}
      {currentStepId === "info" && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Título del partido</label>
            <input value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Pichanga en ..." className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            {/* Comuna is now derived from address selection (Step 1) */}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nivel</label>
            <div className="flex flex-wrap gap-2">
              {(["BEGINNER","INTERMEDIATE","ADVANCED"] as const).map((lv) => {
                const active = form.level === lv;
                return (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setForm({ ...form, level: lv })}
                    className={
                      "rounded-xl border px-3 py-2 transition-all " +
                      (active ? "ring-2 ring-black/20 shadow-sm" : "hover:bg-gray-50")
                    }
                  >
                    <LevelBadge level={lv as any} withDot size="md" />
                  </button>
                );
              })}
            </div>
            <select aria-label="Nivel" value={form.level} onChange={(e)=>setForm({...form,level:e.target.value as any})} className="sr-only">
              <option value="BEGINNER">{nivelES.BEGINNER}</option>
              <option value="INTERMEDIATE">{nivelES.INTERMEDIATE}</option>
              <option value="ADVANCED">{nivelES.ADVANCED}</option>
            </select>
          </div>
        </div>
      )}

      {currentStepId === "location" && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <AddressAutocomplete value={form.displayAddress || ""} onChange={onAddress} />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nombre del recinto</label>
              <input value={form.venueName} onChange={(e)=>setForm({...form,venueName:e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">N° de cancha (opcional)</label>
              <input value={form.fieldNumber} onChange={(e)=>setForm({...form,fieldNumber:e.target.value})} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          {/* Vista previa con el mismo mapa de "Explorar" */}
          <div className="mt-2">
            <label className="block text-sm text-gray-700 mb-2">Vista previa</label>
            <div className="relative overflow-hidden rounded-xl border bg-gray-50">
              <MiniMap lat={form.lat} lng={form.lng} title={form.venueName || form.displayAddress || form.title} />
            </div>
          </div>
        </div>
      )}

      {currentStepId === "datetime" && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Fecha y hora</label>
            <DateTimePicker value={form.startsAt} onChange={(iso)=>setForm({...form, startsAt: iso})} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Duración (min)</label>
            <input type="number" min={30} max={180} step={5} value={form.durationMins} onChange={(e)=>setForm({...form, durationMins: Number(e.target.value)})} className="w-full border px-3 py-2 rounded" />
          </div>
        </div>
      )}

      {currentStepId === "spots" && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Cupos máximos disponibles</label>
              <input
                type="number"
                min={6}
                max={30}
                value={form.totalSpots}
                onChange={(e)=>{
                  const total = Math.max(1, Number(e.target.value || 0));
                  const suggestedMin = total > 0 ? Math.max(1, Math.ceil(total * 0.6)) : 1;
                  const nextMin = total > 0 ? Math.min(Math.max(1, form.minSpotsToConfirm || suggestedMin), total) : suggestedMin;
                  setForm({ ...form, totalSpots: total, minSpotsToConfirm: nextMin });
                }}
                className="w-full border px-3 py-2 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Entre 6 y 30 jugadores</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Mínimo de cupos para confirmar</label>
              <input
                type="number"
                min={1}
                max={form.totalSpots || 1}
                value={form.minSpotsToConfirm}
                onChange={(e)=>{
                  const minValue = Math.max(1, Number(e.target.value || 0));
                  const clamped = form.totalSpots > 0 ? Math.min(minValue, form.totalSpots) : minValue;
                  setForm({ ...form, minSpotsToConfirm: clamped });
                }}
                className="w-full border px-3 py-2 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Avisamos a los jugadores cuando se alcance este mínimo.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            Todos los cupos quedan disponibles para que los jugadores reserven su puesto. Si necesitas bloquear lugares
            específicos contáctanos para configurarlo con el equipo de soporte.
          </div>
          <p className="text-sm text-gray-500">Todas las reservas son gratuitas durante este lanzamiento.</p>
        </div>
      )}

      {currentStepId === "confirm" && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <div className="text-sm text-gray-700">
            <p><span className="font-medium">Título:</span> {form.title}</p>
            <p><span className="font-medium">Comuna:</span> {form.comuna || venueInfo?.comuna || '—'}</p>
            <p className="flex items-center gap-2"><span className="font-medium">Nivel:</span> <LevelBadge level={form.level as any} /></p>
            <p><span className="font-medium">Recinto:</span> {form.venueName || "-"}</p>
            <p><span className="font-medium">Dirección:</span> {form.venueAddress || form.displayAddress || "-"}</p>
            <p><span className="font-medium">Fecha:</span> {form.startsAt ? new Date(form.startsAt).toLocaleString() : "-"}</p>
            <p><span className="font-medium">Duración:</span> {form.durationMins} min</p>
            <p><span className="font-medium">Cupos:</span> {form.totalSpots} (mínimo {form.minSpotsToConfirm})</p>
            <p><span className="font-medium">Costo:</span> Reservas gratuitas en este lanzamiento</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <button className="px-4 py-2 rounded border" disabled={step===0 || busy} onClick={()=>setStep((s)=>Math.max(0,s-1))}>Atrás</button>
        {step < steps.length-1 ? (
          <button className="px-6 py-2 rounded bg-black text-white disabled:opacity-50" disabled={!allowNext || busy} onClick={()=>setStep((s)=>Math.min(steps.length-1,s+1))}>Siguiente</button>
        ) : (
          <button className="px-6 py-2 rounded bg-black text-white disabled:opacity-50" disabled={busy} onClick={onSubmit}>{busy? 'Creando…' : 'Crear partido'}</button>
        )}
      </div>
    </div>
  );
}

