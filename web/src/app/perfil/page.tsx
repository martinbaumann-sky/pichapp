"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { comunasRM } from "@/lib/comunas-rm";
import { posicionES } from "@/lib/i18n";

export default function PerfilPage() {
  const { user, loading, signOut, checkSession } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", comuna: "", position: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (res.ok) {
        const { profile } = await res.json();
        const parts = (profile?.name ?? user.name ?? "").split(" ");
        const firstName = parts.slice(0, -1).join(" ") || parts[0] || "";
        const lastName = parts.length > 1 ? parts.slice(-1).join(" ") : "";
        setForm({
          firstName,
          lastName,
          phone: profile?.phone ?? "",
          comuna: profile?.comuna ?? user.comuna ?? "",
          position: profile?.position ?? "",
        });
      }
    }
    load();
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Inicia sesión para ver tu perfil.</div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // validate phone: fixed +56 9 XXXXXXXX (8 digits after 9)
    const digits = form.phone.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) {
      alert("Ingresa 8 dígitos para el celular (formato +56 9 XXXXXXXX)");
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
        phone: `+56 9 ${digits.replace(/(\d{4})(\d{4})/, "$1 $2")}`,
        comuna: form.comuna,
        position: form.position || null,
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

  return (
    <div className="max-w-xl mx-auto p-6">
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
          <div className="flex items-center gap-2">
            <span className="px-3 py-2 border rounded bg-gray-50 text-gray-700">+56 9</span>
            <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value.replace(/\D/g, "").slice(0,8)})} className="w-full border px-3 py-2 rounded" placeholder="XXXXXXXX" inputMode="numeric" maxLength={8} required />
          </div>
          <p className="text-xs text-gray-500 mt-1">8 dígitos, ej: 87654321</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comuna</label>
          <select value={form.comuna} onChange={e=>setForm({...form, comuna:e.target.value})} className="w-full border px-3 py-2 rounded" required>
            <option value="">Selecciona tu comuna</option>
            {comunasRM.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Posición</label>
          <select value={form.position} onChange={e=>setForm({...form, position:e.target.value})} className="w-full border px-3 py-2 rounded">
            <option value="">Selecciona tu posición (opcional)</option>
            {Object.entries(posicionES).map(([k,v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-black text-white rounded">{saving?"Guardando...":"Guardar cambios"}</button>
          <button type="button" onClick={signOut} className="px-4 py-2 bg-gray-200 rounded">Cerrar sesión</button>
        </div>
      </form>
    </div>
  );
}


