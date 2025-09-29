"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { comunasRM } from "@/lib/comunas-rm";
import { normalizeForDisplay } from "@/lib/phone";
import AddressAutocomplete from "@/components/AddressAutocomplete";

export default function PerfilPage() {
  const { user, loading, signOut, checkSession } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", comuna: "" });
  const [saving, setSaving] = useState(false);
  const hasVenuePrivileges = !!user?.venue || user?.role === "venue";
  const [wantsVenueMode, setWantsVenueMode] = useState(hasVenuePrivileges);
  const showVenueSection = hasVenuePrivileges || wantsVenueMode;
  const [venueForm, setVenueForm] = useState({
    name: "",
    address: "",
    comuna: "",
    lat: "",
    lng: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    displayAddress: "",
  });
  const [venueLoaded, setVenueLoaded] = useState(false);
  const [venueStatus, setVenueStatus] = useState<"PENDING" | "APPROVED" | "BLOCKED" | null>(null);
  const [venueSaving, setVenueSaving] = useState(false);
  const [venueMessage, setVenueMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;

      // Prefill immediately from session user (fast UI feedback)
      try {
        const partsFromUser = (user.name ?? "").split(" ");
        const firstNameUser = partsFromUser.slice(0, -1).join(" ") || partsFromUser[0] || "";
        const lastNameUser = partsFromUser.length > 1 ? partsFromUser.slice(-1).join(" ") : "";
        const digitsFromUser = String(user.phone ?? "").replace(/\D/g, "");
        const phoneFromUser = digitsFromUser.slice(-8);
        setForm((prev) => ({
          ...prev,
          firstName: firstNameUser,
          lastName: lastNameUser,
          comuna: user.comuna ?? "",
          phone: phoneFromUser || prev.phone,
        }));
      } catch {}

      // Then load canonical data from the database
      const res = await fetch("/api/profile", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const { profile } = await res.json();
        const parts = (profile?.name ?? user.name ?? "").split(" ");
        const firstName = parts.slice(0, -1).join(" ") || parts[0] || "";
        const lastName = parts.length > 1 ? parts.slice(-1).join(" ") : "";
        const digits = String(profile?.phone ?? "").replace(/\D/g, "");
        const phone8 = digits.slice(-8);
        setForm({
          firstName,
          lastName,
          phone: phone8,
          comuna: profile?.comuna ?? user.comuna ?? "",
        });
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (hasVenuePrivileges) setWantsVenueMode(true);
  }, [hasVenuePrivileges]);

  useEffect(() => {
    if (!user || !showVenueSection) {
      setVenueLoaded(true);
      return;
    }
    setVenueLoaded(false);
    (async () => {
      try {
        const res = await fetch("/api/venues/me", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        const venue = data?.venue;
        if (venue) {
          setVenueForm({
            name: venue.name ?? "",
            address: venue.address ?? "",
            comuna: venue.comuna ?? "",
            lat: typeof venue.lat === "number" ? String(venue.lat) : "",
            lng: typeof venue.lng === "number" ? String(venue.lng) : "",
            contactName: venue.contactName ?? "",
            contactEmail: venue.contactEmail ?? "",
            contactPhone: venue.contactPhone ?? "",
            displayAddress: [venue.name, venue.address].filter(Boolean).join(" - "),
          });
          setVenueStatus(venue.status ?? null);
        }
      } catch (err) {
        console.error("[perfil] failed to load venue", err);
        setVenueMessage("No pudimos cargar la información de tu cancha.");
      } finally {
        setVenueLoaded(true);
      }
    })();
  }, [user, showVenueSection]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Inicia sesiÃ³n para ver tu perfil.</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Inicia sesiÃ³n para ver tu perfil.</div>;
  }

  const digitsPreview = form.phone.replace(/\D/g, "");
  const phonePreview = digitsPreview.length === 8
    ? normalizeForDisplay(`+569${digitsPreview}`)
    : (user.phone ? normalizeForDisplay(user.phone) : "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // validate phone: fixed +569 XXXXXXXX (8 digits after 9)
    const digits = form.phone.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) {
      alert("Ingresa 8 dÃ­Â­gitos para el celular (formato +569 XXXXXXXX)");
      setSaving(false);
      return;
    }
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      alert("Nombre y apellido son obligatorios");
      setSaving(false);
      return;
    }
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        phone: `+569 ${digits.replace(/(\d{4})(\d{4})/, "$1 $2")}`,
        comuna: form.comuna,
      }),
    });
    setSaving(false);
    if (res.ok) {
      alert("Perfil actualizado");
      checkSession();
    } else {
      alert("No se pudo guardar");
    }
  };

  const buildVenuePayload = () => ({
    name: venueForm.name.trim(),
    address: venueForm.address.trim(),
    comuna: venueForm.comuna.trim(),
    lat: venueForm.lat ? Number(venueForm.lat) : null,
    lng: venueForm.lng ? Number(venueForm.lng) : null,
    contactName: venueForm.contactName.trim() || null,
    contactEmail: venueForm.contactEmail.trim() || null,
    contactPhone: venueForm.contactPhone.trim() || null,
  });

  const submitVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setVenueSaving(true);
    setVenueMessage(null);
    try {
      if (!venueForm.name.trim() || !venueForm.address.trim() || !venueForm.comuna.trim()) {
        setVenueMessage("Nombre, dirección y comuna son obligatorios");
        setVenueSaving(false);
        return;
      }
      const payload = buildVenuePayload();
      const res = await fetch("/api/venues/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(updated?.error || "No se pudo guardar la cancha");
      }
      if (updated?.venue?.status) setVenueStatus(updated.venue.status);
      setVenueMessage("Datos de la cancha actualizados");
    } catch (error: any) {
      setVenueMessage(error?.message || "No se pudo guardar la cancha");
    } finally {
      setVenueSaving(false);
    }
  };

  const sendVenueVerification = async () => {
    setVenueSaving(true);
    setVenueMessage(null);
    try {
      if (!venueForm.name.trim() || !venueForm.address.trim() || !venueForm.comuna.trim()) {
        setVenueMessage("Completa nombre, dirección y comuna antes de solicitar verificación");
        setVenueSaving(false);
        return;
      }
      const payload = buildVenuePayload();
      const res = await fetch("/api/venues/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar la solicitud");
      }
      if (data?.status) setVenueStatus(data.status);
      setVenueMessage("Enviamos tu solicitud. Te contactaremos desde contacto.pichapp@gmail.com.");
      setWantsVenueMode(true);
      checkSession();
    } catch (error: any) {
      setVenueMessage(error?.message || "No se pudo enviar la solicitud");
    } finally {
      setVenueSaving(false);
    }
  };

  const venueStatusLabel = venueStatus === "APPROVED" ? "Verificada" : venueStatus === "PENDING" ? "Pendiente de revisión" : venueStatus === "BLOCKED" ? "Bloqueada" : null;
  const venueStatusTone = venueStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : venueStatus === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">Mi perfil</h1>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} className="w-full border px-3 py-2 rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellido</label>
              <input value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} className="w-full border px-3 py-2 rounded" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Celular</label>
            <div className="flex items-center"><span className="px-3 py-2 border rounded-l bg-gray-50 text-gray-700 border-r-0 whitespace-nowrap w-16 flex items-center justify-center">+569</span><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value.replace(/\D/g, "").slice(0,8)})} className="w-full border px-3 py-2 rounded" placeholder="XXXXXXXX" inputMode="numeric" maxLength={8} required />
            </div>
            <p className="text-xs text-gray-500 mt-1">8 dígitos, ej: 87654321</p>
            {phonePreview && <p className="text-xs text-gray-500 mt-0.5">Se mostrará como {phonePreview}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comuna</label>
            <select value={form.comuna} onChange={e=>setForm({...form, comuna:e.target.value})} className="w-full border px-3 py-2 rounded" required>
              <option value="">Selecciona tu comuna</option>
              {comunasRM.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-black text-white rounded">{saving?"Guardando...":"Guardar cambios"}</button>
            <button type="button" onClick={signOut} className="px-4 py-2 bg-gray-200 rounded">Cerrar sesiÃ³n</button>
          </div>
        </form>
      </section>

      {showVenueSection ? (
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Datos de la cancha</h2>
              <p className="text-sm text-gray-600">Esta información se usará automáticamente al crear partidos como recinto.</p>
            </div>
            {venueStatusLabel && (
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${venueStatusTone}`}>
                {venueStatusLabel}
              </span>
            )}
          </div>

          {!venueLoaded ? (
            <div className="py-10 text-center text-sm text-gray-500">Cargando datos de tu cancha…</div>
          ) : (
            <form onSubmit={submitVenue} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre comercial</label>
                  <input
                    value={venueForm.name}
                    onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Complejo deportivo X"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comuna</label>
                  <select
                    value={venueForm.comuna}
                    onChange={(e) => setVenueForm({ ...venueForm, comuna: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    required
                  >
                    <option value="">Selecciona la comuna</option>
                    {comunasRM.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ubicación</label>
                <AddressAutocomplete
                  value={venueForm.displayAddress}
                  onChange={(value) => {
                    setVenueForm((prev) => ({
                      ...prev,
                      displayAddress: value.display ?? prev.displayAddress,
                      address: value.venueAddress ?? prev.address,
                      comuna: value.comuna ?? prev.comuna,
                      lat: typeof value.lat === 'number' ? String(value.lat) : prev.lat,
                      lng: typeof value.lng === 'number' ? String(value.lng) : prev.lng,
                      name: prev.name || value.venueName || prev.name,
                    }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Selecciona la ubicación exacta para precargar tus partidos.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <input
                    value={venueForm.address}
                    onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Av. Siempre Viva 123"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Latitud</label>
                    <input
                      value={venueForm.lat}
                      onChange={(e) => setVenueForm({ ...venueForm, lat: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="-33.45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Longitud</label>
                    <input
                      value={venueForm.lng}
                      onChange={(e) => setVenueForm({ ...venueForm, lng: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="-70.66"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Persona de contacto</label>
                  <input
                    value={venueForm.contactName}
                    onChange={(e) => setVenueForm({ ...venueForm, contactName: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Nombre y apellido"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Correo de contacto</label>
                  <input
                    type="email"
                    value={venueForm.contactEmail}
                    onChange={(e) => setVenueForm({ ...venueForm, contactEmail: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="cancha@ejemplo.cl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono</label>
                  <input
                    value={venueForm.contactPhone}
                    onChange={(e) => setVenueForm({ ...venueForm, contactPhone: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="+569XXXXXXXX"
                  />
                </div>
              </div>

              {venueMessage && (
                <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">{venueMessage}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={venueSaving} className="px-4 py-2 bg-black text-white rounded">
                  {venueSaving ? "Guardando…" : "Guardar datos de la cancha"}
                </button>
                <button
                  type="button"
                  onClick={sendVenueVerification}
                  disabled={venueSaving}
                  className="px-4 py-2 rounded border border-gray-300 text-sm hover:bg-gray-50"
                >
                  Solicitar verificación
                </button>
                <span className="text-xs text-gray-500">Nuestro equipo revisará tu solicitud en menos de 24h hábiles.</span>
              </div>
            </form>
          )}
        </section>
      ) : (
        <section className="bg-white border border-dashed border-gray-300 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <h2 className="text-xl font-semibold">¿Quieres administrar tu cancha?</h2>
          <p className="text-sm text-gray-600">
            Completa los datos del recinto y enviaremos la verificación a nuestro equipo en contacto.pichapp@gmail.com.
          </p>
          <button
            type="button"
            onClick={() => setWantsVenueMode(true)}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-900"
          >
            Registrar mi cancha
          </button>
        </section>
      )}
    </div>
  );
}



