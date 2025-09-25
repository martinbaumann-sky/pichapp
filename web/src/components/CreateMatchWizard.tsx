"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import DateTimePicker from "@/components/DateTimePicker";
import dynamic from "next/dynamic";
import { nivelES } from "@/lib/i18n";
import { TEAM_KEYS, TEAM_LABELS } from "@/lib/teams";
import { staticMapUrl } from "@/lib/maps";
import { streetViewUrl } from "@/lib/places";
import { AnimatePresence, motion } from "framer-motion";
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
  occupiedSpots: number;
};

const stepTitles = [
  "Información Básica",
  "Ubicación",
  "Fecha y Hora",
  "Cupos",
  "Confirmar",
];

export default function CreateMatchWizard() {
  const MiniMap = dynamic(() => import("@/components/MatchMiniMap"), { ssr: false });
  const [step, setStep] = useState(0);
  const [prevStep, setPrevStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [occupiedDetails, setOccupiedDetails] = useState<Array<{ name: string; email: string; position: string; team?: string }>>([]);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
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
  } as any);

  const allowNext = useMemo(() => {
    if (step === 0) return !!form.title && !!form.level;
    if (step === 1) return !!(form.displayAddress || form.venueAddress || form.venueName);
    if (step === 2) return !!form.startsAt && form.durationMins >= 30;
    if (step === 3) return form.totalSpots >= 6 && form.minSpotsToConfirm >= 1 && form.minSpotsToConfirm <= form.totalSpots;
    return true;
  }, [step, form]);

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
        occupiedSpots: Number(form.occupiedSpots || 0) || 0,
        venueName: form.venueName || "",
        venueAddress: form.venueAddress || form.displayAddress || "",
        // let backend derive comuna from address if missing
        coverImageUrl,
        occupiedPlayers: occupiedDetails,
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
    if (!friendsOpen) return;
    (async () => {
      try {
        const res = await fetch('/api/friends?status=ACCEPTED', { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        setFriends(Array.isArray(data?.items) ? data.items : []);
      } catch {}
    })();
  }, [friendsOpen]);

  const stepper = (
    <div className="flex items-center gap-2 mb-6">
      {stepTitles.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${i<=step? 'bg-black text-white':'bg-gray-200 text-gray-600'}`}>{i+1}</div>
          <div className={`text-sm ${i===step? 'font-semibold text-black':'text-gray-500'}`}>{t}</div>
          {i<stepTitles.length-1 && <div className="w-8 h-[2px] bg-gray-300" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Organizar Partido</h1>
      <p className="text-gray-600 mb-6">Completa los pasos para publicar tu pichanga.</p>
      {stepper}

      {/* Step content */}
      {step === 0 && (
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

      {step === 1 && (
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

      {step === 2 && (
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

      {step === 3 && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Cupos maximos disponibles</label>
              <input
                type="number"
                min={6}
                max={30}
                value={form.totalSpots}
                onChange={(e)=>{
                  const total = Math.max(1, Number(e.target.value || 0));
                  const suggestedMin = total > 0 ? Math.max(1, Math.ceil(total * 0.6)) : 1;
                  const nextMin = total > 0 ? Math.min(Math.max(1, form.minSpotsToConfirm || suggestedMin), total) : suggestedMin;
                  const nextOccupied = Math.min(form.occupiedSpots, total);
                  setForm({ ...form, totalSpots: total, minSpotsToConfirm: nextMin, occupiedSpots: nextOccupied });
                  setOccupiedDetails((prev)=>{
                    const next = [...prev];
                    if (nextOccupied > next.length) {
                      while(next.length < nextOccupied) next.push({ name: "", email: "", position: "" });
                    } else if (nextOccupied < next.length) {
                      next.length = nextOccupied;
                    }
                    return next;
                  });
                }}
                className="w-full border px-3 py-2 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Entre 6 y 30 jugadores</p>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Minimo de cupos para confirmar</label>
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
            <div>
              <label className="block text-sm text-gray-700 mb-1">Ocupados por el organizador</label>
              <input
                type="number"
                min={0}
                max={form.totalSpots}
                value={form.occupiedSpots}
                onChange={(e)=>{
                  const v = Math.max(0, Math.min(Number(e.target.value || 0), form.totalSpots));
                  setForm({ ...form, occupiedSpots: v });
                  setOccupiedDetails((prev)=>{
                    const next = [...prev];
                    if (v > next.length) {
                      while(next.length < v) next.push({ name: "", email: "", position: "" });
                    } else if (v < next.length) {
                      next.length = v;
                    }
                    return next;
                  });
                }}
                className="w-full border px-3 py-2 rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Estos cupos quedan confirmados desde el inicio.</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Todas las reservas son gratuitas durante este lanzamiento.</p>
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700 font-medium">Agregar desde amigos</div>
              <button type="button" className="px-3 py-1.5 text-sm rounded-lg border" onClick={()=>setFriendsOpen((v)=>!v)}>{friendsOpen? 'Ocultar' : 'Ver amigos'}</button>
            </div>
            {friendsOpen && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">También puedes invitar manualmente a alguien que no esté en tu lista.</div>
                  <button
                    type="button"
                    onClick={()=>{
                      setOccupiedDetails((prev)=>{
                        const next = [...prev, { name: '', email: '', position: '', team: '' }];
                        return next;
                      });
                      setForm((prev)=>({ ...prev, occupiedSpots: Math.min((prev.occupiedSpots||0)+1, prev.totalSpots) }));
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border bg-white hover:bg-gray-50"
                  >
                    Agregar invitado
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {friends.map((f:any)=> {
                    const id = String(f.id);
                    const isSelected = selectedFriendIds.has(id);
                    const name = f.user?.name || 'Amigo';
                    const email = f.user?.email || f.email || '';
                    const position = f.user?.position || '';
                    return (
                      <div key={id} className={`flex items-center justify-between p-3 rounded-xl border ${isSelected? 'bg-emerald-50 border-emerald-200' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">⚽</div>
                          <div>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-gray-500">{f.user?.comuna || '—'}{position ? ` • ${position}`: ''}</div>
                          </div>
                        </div>
                        {isSelected ? (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                            onClick={()=>{
                              setSelectedFriendIds((prev)=>{
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                              });
                              setOccupiedDetails((prev)=>{
                                const idx = prev.findIndex((p:any)=> p.friendId === id);
                                if (idx >= 0) {
                                  const next = [...prev];
                                  next.splice(idx,1);
                                  return next;
                                }
                                return prev;
                              });
                              setForm((prev)=>({ ...prev, occupiedSpots: Math.max(0, (prev.occupiedSpots||0) - 1) }));
                            }}
                          >Quitar</button>
                        ) : (
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={()=>{
                              setSelectedFriendIds((prev)=>{
                                const next = new Set(prev);
                                if (next.has(id)) return next;
                                next.add(id);
                                return next;
                              });
                              setOccupiedDetails((prev)=>[...prev, { friendId: id, name, email, position, team: '' } as any]);
                              setForm((prev)=>({ ...prev, occupiedSpots: Math.min((prev.occupiedSpots||0)+1, prev.totalSpots) }));
                            }}
                          >Agregar</button>
                        )}
                      </div>
                    );
                  })}
                  {friends.length === 0 && <div className="text-xs text-gray-500">Aún no tienes amigos. Agrégalos por su número en la pestaña “Amigos”.</div>}
                </div>
              </div>
            )}
          </div>
          {form.occupiedSpots > 0 && (
            <div className="mt-2 space-y-3">
              <div className="text-sm text-gray-700 font-medium">Datos de jugadores ocupados por el organizador</div>
              {Array.from({ length: form.occupiedSpots }).map((_, idx) => (
                <div key={idx} className="grid md:grid-cols-3 gap-3 border rounded-2xl p-4 bg-white">
                  <input
                    type="text"
                    placeholder={`Nombre jugador ${idx+1}`}
                    value={occupiedDetails[idx]?.name || ""}
                    onChange={(e)=>{
                      const next = [...occupiedDetails];
                      next[idx] = { ...(next[idx]||{ name:"", email:"", position:"", team: "" }), name: e.target.value };
                      setOccupiedDetails(next);
                    }}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="email"
                    placeholder="email@ejemplo.com"
                    value={occupiedDetails[idx]?.email || ""}
                    onChange={(e)=>{
                      const next = [...occupiedDetails];
                      next[idx] = { ...(next[idx]||{ name:"", email:"", position:"", team: "" }), email: e.target.value };
                      setOccupiedDetails(next);
                    }}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={occupiedDetails[idx]?.team || ""}
                      onChange={(e)=>{
                        const next = [...occupiedDetails];
                        next[idx] = { ...(next[idx]||{ name:"", email:"", position:"", team: "" }), team: e.target.value };
                        setOccupiedDetails(next);
                      }}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="">Equipo</option>
                      {TEAM_KEYS.map((key)=> (
                        <option key={key} value={key}>{TEAM_LABELS[key]}</option>
                      ))}
                    </select>
                    <select
                      value={occupiedDetails[idx]?.position || ""}
                      onChange={(e)=>{
                        const next = [...occupiedDetails];
                        next[idx] = { ...(next[idx]||{ name:"", email:"", position:"", team: "" }), position: e.target.value };
                        setOccupiedDetails(next);
                      }}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="">Posición</option>
                      <option value="ARQUERO">Arquero</option>
                      <option value="DEFENSA">Defensa</option>
                      <option value="LATERAL">Lateral</option>
                      <option value="VOLANTE">Volante</option>
                      <option value="DELANTERO">Delantero</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      onClick={()=>{
                        setOccupiedDetails((prev)=>{
                          const next = [...prev];
                          next.splice(idx,1);
                          return next;
                        });
                        setForm((prev)=>({ ...prev, occupiedSpots: Math.max(0, (prev.occupiedSpots||0) - 1) }));
                      }}
                    >Quitar jugador</button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">Estos datos no son obligatorios en esta etapa.</p>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 bg-white border rounded-xl p-6">
          <div className="text-sm text-gray-700">
            <p><span className="font-medium">Título:</span> {form.title}</p>
            <p><span className="font-medium">Comuna:</span> {form.comuna}</p>
            <p className="flex items-center gap-2"><span className="font-medium">Nivel:</span> <LevelBadge level={form.level as any} /></p>
            <p><span className="font-medium">Recinto:</span> {form.venueName || "-"}</p>
            <p><span className="font-medium">Dirección:</span> {form.venueAddress || form.displayAddress || "-"}</p>
            <p><span className="font-medium">Fecha:</span> {form.startsAt ? new Date(form.startsAt).toLocaleString() : "-"}</p>
            <p><span className="font-medium">Duración:</span> {form.durationMins} min</p>
            <p><span className="font-medium">Cupos:</span> {form.totalSpots} (mínimo {form.minSpotsToConfirm}, ocupados {form.occupiedSpots})</p>
            <p><span className="font-medium">Costo:</span> Reservas gratuitas en este lanzamiento</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <div className="mt-6 flex items-center justify-between">
        <button className="px-4 py-2 rounded border" disabled={step===0 || busy} onClick={()=>setStep((s)=>Math.max(0,s-1))}>Atrás</button>
        {step < stepTitles.length-1 ? (
          <button className="px-6 py-2 rounded bg-black text-white disabled:opacity-50" disabled={!allowNext || busy} onClick={()=>setStep((s)=>Math.min(stepTitles.length-1,s+1))}>Siguiente</button>
        ) : (
          <button className="px-6 py-2 rounded bg-black text-white disabled:opacity-50" disabled={busy} onClick={onSubmit}>{busy? 'Creando…' : 'Crear partido'}</button>
        )}
      </div>
    </div>
  );
}

// Tarjeta de vista previa con imagen del lugar
function PreviewCard({ lat, lng, photoUrl }: { lat?: number; lng?: number; photoUrl?: string }) {
  const computed = useMemo(() => {
    if (photoUrl && /^https?:\/\//i.test(photoUrl)) return photoUrl;
    if (typeof lat === 'number' && typeof lng === 'number') {
      const sv = streetViewUrl(lat, lng);
      return sv || staticMapUrl({ lat, lng });
    }
    return null;
  }, [lat, lng, photoUrl]);

  return (
    <div className="mt-2">
      <label className="block text-sm text-gray-700 mb-2">Vista previa</label>
      <div className="relative overflow-hidden rounded-xl border bg-gray-50">
        {computed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={computed} alt="Vista previa del lugar" className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 flex items-center justify-center text-gray-400">Selecciona una dirección para ver la vista previa</div>
        )}
      </div>
    </div>
  );
}
