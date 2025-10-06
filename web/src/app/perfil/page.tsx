"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { comunasRM } from "@/lib/comunas-rm";
import { normalizeForDisplay } from "@/lib/phone";
import ProfileCard from "@/components/profile/ProfileCard";
import { POSITION_KEYS } from "@/lib/teams";
import { nivelES, posicionES } from "@/lib/i18n";
import { ShinyHoverCard } from "@/components/ui/shiny-hover-card";

const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  comuna: string;
  position: string;
  skillLevel: string;
  bio: string;
};

export default function PerfilPage() {
  const { user, loading, signOut, checkSession } = useAuth();
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    comuna: "",
    position: "",
    skillLevel: "",
    bio: "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;

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
          position: user.position ?? prev.position,
          skillLevel: user.skillLevel ?? prev.skillLevel,
          bio: user.bio ?? prev.bio,
        }));
        setAvatarUrl(user.avatarUrl ?? null);
      } catch {}

      const res = await fetch("/api/profile", { cache: "no-store", credentials: "include" });
      if (res.ok) {
        const { profile } = await res.json();
        if (profile) {
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
            position: profile?.position ?? "",
            skillLevel: profile?.skillLevel ?? "",
            bio: profile?.bio ?? "",
          });
          setAvatarUrl(profile?.avatarUrl ?? user.avatarUrl ?? null);
        }
      }
    }
    load();
  }, [user]);

  const digitsPreview = form.phone.replace(/\D/g, "");
  const phonePreview = digitsPreview.length === 8
    ? normalizeForDisplay(`+569${digitsPreview}`)
    : (user?.phone ? normalizeForDisplay(user.phone) : "");

  const displayName = useMemo(() => {
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (fullName) return fullName;
    return user?.name ?? "Jugador PichangApp";
  }, [form.firstName, form.lastName, user?.name]);

  const fallbackInitials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "JP";
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase().padEnd(2, "P");
    return `${parts[0]![0] ?? "J"}${parts[1]![0] ?? "P"}`.toUpperCase();
  }, [displayName]);

  const previewActions = user
    ? [
        <Link
          key="public"
          href={`/usuarios/${user.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-100 transition"
        >
          Ver perfil público
        </Link>,
      ]
    : undefined;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setAvatarError(null);

    const digits = form.phone.replace(/\D/g, "");
    if (!/^\d{8}$/.test(digits)) {
      alert("Ingresa 8 dígitos para el celular (formato +569 XXXXXXXX)");
      setSaving(false);
      return;
    }
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      alert("Nombre y apellido son obligatorios");
      setSaving(false);
      return;
    }

    const payload = {
      name: fullName,
      phone: `+569 ${digits.replace(/(\d{4})(\d{4})/, "$1 $2")}`,
      comuna: form.comuna,
      position: form.position || null,
      skillLevel: form.skillLevel || null,
      bio: form.bio,
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "No se pudo guardar");
        setSaving(false);
        return;
      }
      checkSession();
      alert("Perfil actualizado");
    } catch (err) {
      console.error("[profile] save error", err);
      alert("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Inicia sesión para ver tu perfil.</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Inicia sesión para ver tu perfil.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-400">Mi perfil</h1>
            <p className="mt-2 text-3xl font-semibold text-white">Así te ven otros jugadores en Pichangapp.</p>
          </div>
          <ShinyHoverCard className="rounded-[36px]">
            <ProfileCard
              name={displayName}
              comuna={form.comuna}
              phoneDisplay={phonePreview}
              position={form.position || null}
              skillLevel={form.skillLevel || null}
              bio={form.bio}
              avatarUrl={avatarUrl}
              actions={previewActions}
              isOwnProfile
              highlight="Vista previa"
            />
          </ShinyHoverCard>
          <ShinyHoverCard className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-white/80">
            <p className="leading-relaxed">
              Mantén tu perfil fresco: comparte cómo juegas, qué posición disfrutas y qué te hace único en la cancha. Así tus amigos
              pueden invitarte más rápido.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.3em] text-emerald-300/80">
              La foto de perfil se administra directamente con el equipo de Pichangapp.
            </p>
          </ShinyHoverCard>
        </div>

        <ShinyHoverCard className="flex-1 rounded-3xl">
          <form onSubmit={submit} className="rounded-3xl bg-white/95 p-8 shadow-2xl space-y-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">Editar información</h2>
              <button type="button" onClick={signOut} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                Cerrar sesión
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-slate-50/60 p-4 shadow-inner">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-emerald-200/60 bg-white shadow">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={`Foto de ${displayName}`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-emerald-600">{fallbackInitials}</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-700">Tu foto se mantiene impecable.</p>
                      <p className="text-xs text-slate-500">Nuestro equipo actualiza las fotos verificadas para que siempre se vean profesionales.</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                    Gestión asistida
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nombre</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Apellido</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Celular</label>
              <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-200">
                <span className="flex items-center justify-center bg-slate-100 px-4 text-sm font-medium text-slate-600">
                  +569
                </span>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 8) }))
                  }
                  className="w-full px-3 py-2 text-slate-900 focus:outline-none"
                  placeholder="XXXXXXXX"
                  inputMode="numeric"
                  maxLength={8}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">8 dígitos, ej: 87654321</p>
              {phonePreview && <p className="text-xs text-slate-500">Se mostrará como {phonePreview}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Comuna</label>
              <select
                value={form.comuna}
                onChange={(e) => setForm((prev) => ({ ...prev, comuna: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                required
              >
                <option value="">Selecciona tu comuna</option>
                {comunasRM.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Posición preferida</label>
                <select
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Selecciona posición</option>
                  {POSITION_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {posicionES[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Nivel de juego</label>
                <select
                  value={form.skillLevel}
                  onChange={(e) => setForm((prev) => ({ ...prev, skillLevel: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">Selecciona nivel</option>
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {nivelES[level]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value.slice(0, 400) }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                rows={4}
                maxLength={400}
                placeholder="Cuéntale al resto cómo juegas, tus logros o qué te gusta de las pichangas."
              />
              <p className="mt-1 text-xs text-slate-500">{form.bio.length}/400 caracteres</p>
            </div>
          </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <Link
                href="/"
                className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </ShinyHoverCard>
      </div>
    </div>
  );
}
