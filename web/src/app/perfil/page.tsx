"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { comunasRM } from "@/lib/comunas-rm";
import { POSITION_KEYS } from "@/lib/teams";
import { nivelES, posicionES } from "@/lib/i18n";

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

const initialTouchedState: Record<keyof FormState, boolean> = {
  firstName: false,
  lastName: false,
  phone: false,
  comuna: false,
  position: false,
  skillLevel: false,
  bio: false,
};

const requiredFields: Array<keyof FormState> = [
  "firstName",
  "lastName",
  "phone",
  "comuna",
  "position",
  "skillLevel",
];

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
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({ ...initialTouchedState });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = useCallback((state: FormState) => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!state.firstName.trim()) next.firstName = "Ingresa tu nombre";
    if (!state.lastName.trim()) next.lastName = "Ingresa tu apellido";
    const digits = state.phone.replace(/\D/g, "");
    if (digits.length !== 8) next.phone = "Debes ingresar 8 dígitos";
    if (!state.comuna.trim()) next.comuna = "Selecciona tu comuna";
    if (!state.position.trim()) next.position = "Selecciona tu posición";
    if (!state.skillLevel.trim()) next.skillLevel = "Selecciona tu nivel";
    return next;
  }, []);

  useEffect(() => {
    setErrors(validate(form));
  }, [form, validate]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const markTouched = useCallback((field: keyof FormState) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const nextForm: FormState = {
        firstName: "",
        lastName: "",
        phone: "",
        comuna: "",
        position: "",
        skillLevel: "",
        bio: "",
      };

      try {
        const partsFromUser = (user.name ?? "").split(" ").filter(Boolean);
        if (partsFromUser.length > 0) {
          nextForm.firstName = partsFromUser.slice(0, -1).join(" ") || partsFromUser[0] || "";
          nextForm.lastName = partsFromUser.length > 1 ? partsFromUser.slice(-1).join(" ") : "";
        }
        const digitsFromUser = String(user.phone ?? "").replace(/\D/g, "");
        nextForm.phone = digitsFromUser.slice(-8);
        nextForm.comuna = user.comuna ?? "";
        nextForm.position = user.position ?? "";
        nextForm.skillLevel = user.skillLevel ?? "";
        nextForm.bio = user.bio ?? "";
      } catch {}

      try {
        const res = await fetch("/api/profile", { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const profile = data?.profile;
          if (profile) {
            const parts = (profile?.name ?? user?.name ?? "").split(" ").filter(Boolean);
            if (parts.length > 0) {
              nextForm.firstName = parts.slice(0, -1).join(" ") || parts[0] || nextForm.firstName;
              nextForm.lastName = parts.length > 1 ? parts.slice(-1).join(" ") : nextForm.lastName;
            }
            const digitsProfile = String(profile?.phone ?? "").replace(/\D/g, "");
            nextForm.phone = digitsProfile.slice(-8) || nextForm.phone;
            nextForm.comuna = profile?.comuna ?? nextForm.comuna;
            nextForm.position = profile?.position ?? nextForm.position;
            nextForm.skillLevel = profile?.skillLevel ?? nextForm.skillLevel;
            nextForm.bio = profile?.bio ?? nextForm.bio;
          }
        }
      } catch {}

      setForm(nextForm);
      setTouched({ ...initialTouchedState });
      setErrors(validate(nextForm));
      setSubmitted(false);
      setSubmitError(null);
    }
    load();
  }, [user, validate]);

  const displayName = useMemo(() => {
    const composed = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (composed) return composed;
    if (user?.name) return user.name;
    return "Jugador PichangApp";
  }, [form.firstName, form.lastName, user?.name]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "JP";
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }, [displayName]);

  const positionLabel = useMemo(() => {
    if (!form.position) return "Elige tu posición favorita";
    return posicionES[form.position as keyof typeof posicionES];
  }, [form.position]);

  const levelLabel = useMemo(() => {
    if (!form.skillLevel) return "Indica tu nivel de juego";
    return nivelES[form.skillLevel as keyof typeof nivelES];
  }, [form.skillLevel]);

  const bioPreview = useMemo(() => {
    return form.bio?.trim() ? form.bio : "Comparte un resumen para que otros jugadores sepan cómo juegas.";
  }, [form.bio]);

  const fieldError = useCallback(
    (field: keyof FormState) => {
      const message = errors[field];
      if (!message) return "";
      return touched[field] || submitted ? message : "";
    },
    [errors, touched, submitted],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || saving) return;

    setSubmitted(true);
    setTouched((prev) => {
      const next = { ...prev };
      for (const field of requiredFields) {
        next[field] = true;
      }
      return next;
    });

    const validation = validate(form);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      setSubmitError("Revisa los campos marcados en rojo.");
      return;
    }

    setSaving(true);
    setSubmitError(null);

    const digits = form.phone.replace(/\D/g, "");
    const formattedPhone = `+569 ${digits.slice(0, 4)} ${digits.slice(4)}`;
    const payload = {
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      phone: formattedPhone,
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
        const message = data?.error || "No pudimos guardar tus datos.";
        setSubmitError(message);
        return;
      }
      checkSession();
      setToastMessage("Perfil actualizado");
    } catch {
      setSubmitError("Ocurrió un problema al guardar. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-white text-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[#0f172a]/60">
          <div className="h-10 w-10 rounded-full border-2 border-[#06b6d4] border-t-transparent animate-spin" />
          <span>Cargando tu perfil…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Inicia sesión para editar tu perfil.</h1>
          <p className="mt-2 text-sm text-[#0f172a]/60">Redirígete al inicio para ingresar y actualizar tus datos.</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-[#06b6d4] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#0590ad]"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <div className="mx-auto w-full max-w-5xl px-6 py-12 lg:min-h-screen lg:flex lg:flex-col lg:justify-center">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#06b6d4]">Tu perfil de jugador</p>
            <h1 className="mt-3 text-3xl font-bold text-[#0f172a]">Tu perfil de jugador</h1>
            <p className="mt-3 max-w-2xl text-base text-[#0f172a]/70">
              Edita tus datos para que otros jugadores te conozcan mejor.
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.25em] text-[#0f172a]/50">
              Tus datos se actualizan automáticamente en todos tus partidos.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="self-start rounded-full border border-[#06b6d4]/30 bg-white px-4 py-2 text-sm font-semibold text-[#06b6d4] transition hover:border-[#06b6d4] hover:text-[#0590ad]"
          >
            Cerrar sesión
          </button>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] items-start">
          <section className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-white to-[#f8fafc] p-8 shadow-xl backdrop-blur">
            <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#06b6d4]/10 text-2xl font-semibold uppercase text-[#06b6d4]">
                {initials}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-[#0f172a]">{displayName}</h2>
                <p className="text-sm text-[#0f172a]/60">Jugador de PichangApp</p>
              </div>
              <dl className="w-full space-y-5 text-sm text-[#0f172a]/70">
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#0f172a]/40">Comuna</dt>
                  <dd className="mt-1 text-base font-medium text-[#0f172a]">
                    {form.comuna || "Selecciona tu comuna en el formulario"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#0f172a]/40">Posición preferida</dt>
                  <dd className="mt-1 text-base font-medium text-[#0f172a]">{positionLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.25em] text-[#0f172a]/40">Nivel de juego</dt>
                  <dd className="mt-1 text-base font-medium text-[#0f172a]">{levelLabel}</dd>
                </div>
              </dl>
              <div className="w-full rounded-2xl border border-white/60 bg-white/80 p-5 shadow-inner">
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#0f172a]/45">Bio</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0f172a] whitespace-pre-line">{bioPreview}</p>
              </div>
            </div>
          </section>

          <section className="relative rounded-3xl border border-slate-100 bg-white/95 p-8 shadow-lg">
            {submitError ? (
              <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </div>
            ) : null}
            <form onSubmit={submit} className="flex flex-col gap-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#0f172a]">Nombre</label>
                  <input
                    value={form.firstName}
                    onChange={(event) => {
                      markTouched("firstName");
                      setForm((prev) => ({ ...prev, firstName: event.target.value }));
                    }}
                    onBlur={() => markTouched("firstName")}
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-4 ${
                      fieldError("firstName")
                        ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200/70"
                        : "border-slate-200 text-[#0f172a] focus:border-[#06b6d4] focus:ring-[#06b6d4]/20"
                    }`}
                    placeholder="Ej: Ana"
                  />
                  {fieldError("firstName") ? (
                    <p className="mt-1 text-xs text-red-600">{fieldError("firstName")}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0f172a]">Apellido</label>
                  <input
                    value={form.lastName}
                    onChange={(event) => {
                      markTouched("lastName");
                      setForm((prev) => ({ ...prev, lastName: event.target.value }));
                    }}
                    onBlur={() => markTouched("lastName")}
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-4 ${
                      fieldError("lastName")
                        ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200/70"
                        : "border-slate-200 text-[#0f172a] focus:border-[#06b6d4] focus:ring-[#06b6d4]/20"
                    }`}
                    placeholder="Ej: Pérez"
                  />
                  {fieldError("lastName") ? (
                    <p className="mt-1 text-xs text-red-600">{fieldError("lastName")}</p>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#0f172a]">Celular</label>
                <div
                  className={`mt-2 flex items-center rounded-2xl border bg-white px-4 py-2.5 text-sm shadow-sm focus-within:ring-4 ${
                    fieldError("phone")
                      ? "border-red-400 text-red-600 focus-within:border-red-500 focus-within:ring-red-200/70"
                      : "border-slate-200 text-[#0f172a] focus-within:border-[#06b6d4] focus-within:ring-[#06b6d4]/20"
                  }`}
                >
                  <span className="mr-2 font-semibold text-[#0f172a]/60">+56 9</span>
                  <input
                    value={form.phone}
                    onChange={(event) => {
                      markTouched("phone");
                      const value = event.target.value.replace(/\D/g, "").slice(0, 8);
                      setForm((prev) => ({ ...prev, phone: value }));
                    }}
                    onBlur={() => markTouched("phone")}
                    className="h-full w-full bg-transparent focus:outline-none"
                    placeholder="87654321"
                    inputMode="numeric"
                  />
                </div>
                {fieldError("phone") ? (
                  <p className="mt-1 text-xs text-red-600">{fieldError("phone")}</p>
                ) : (
                  <p className="mt-1 text-xs text-[#0f172a]/50">Solo se usa para coordinar partidos. No se muestra públicamente.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-[#0f172a]">Comuna</label>
                <select
                  value={form.comuna}
                  onChange={(event) => {
                    markTouched("comuna");
                    setForm((prev) => ({ ...prev, comuna: event.target.value }));
                  }}
                  onBlur={() => markTouched("comuna")}
                  className={`mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-4 ${
                    fieldError("comuna")
                      ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200/70"
                      : "border-slate-200 text-[#0f172a] focus:border-[#06b6d4] focus:ring-[#06b6d4]/20"
                  }`}
                >
                  <option value="">Selecciona tu comuna</option>
                  {comunasRM.map((comuna) => (
                    <option key={comuna} value={comuna}>
                      {comuna}
                    </option>
                  ))}
                </select>
                {fieldError("comuna") ? (
                  <p className="mt-1 text-xs text-red-600">{fieldError("comuna")}</p>
                ) : null}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-[#0f172a]">Posición preferida</label>
                  <select
                    value={form.position}
                    onChange={(event) => {
                      markTouched("position");
                      setForm((prev) => ({ ...prev, position: event.target.value }));
                    }}
                    onBlur={() => markTouched("position")}
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-4 ${
                      fieldError("position")
                        ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200/70"
                        : "border-slate-200 text-[#0f172a] focus:border-[#06b6d4] focus:ring-[#06b6d4]/20"
                    }`}
                  >
                    <option value="">Selecciona posición</option>
                    {POSITION_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {posicionES[key]}
                      </option>
                    ))}
                  </select>
                  {fieldError("position") ? (
                    <p className="mt-1 text-xs text-red-600">{fieldError("position")}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#0f172a]">Nivel de juego</label>
                  <select
                    value={form.skillLevel}
                    onChange={(event) => {
                      markTouched("skillLevel");
                      setForm((prev) => ({ ...prev, skillLevel: event.target.value }));
                    }}
                    onBlur={() => markTouched("skillLevel")}
                    className={`mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-4 ${
                      fieldError("skillLevel")
                        ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-200/70"
                        : "border-slate-200 text-[#0f172a] focus:border-[#06b6d4] focus:ring-[#06b6d4]/20"
                    }`}
                  >
                    <option value="">Selecciona nivel</option>
                    {skillLevels.map((level) => (
                      <option key={level} value={level}>
                        {nivelES[level]}
                      </option>
                    ))}
                  </select>
                  {fieldError("skillLevel") ? (
                    <p className="mt-1 text-xs text-red-600">{fieldError("skillLevel")}</p>
                  ) : null}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#0f172a]">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, bio: event.target.value.slice(0, 400) }));
                  }}
                  onBlur={() => markTouched("bio")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0f172a] shadow-sm transition focus:border-[#06b6d4] focus:outline-none focus:ring-4 focus:ring-[#06b6d4]/20"
                  rows={4}
                  maxLength={400}
                  placeholder="Cuéntale al resto cómo juegas, tus logros o qué te gusta de las pichangas."
                />
                <div className="mt-1 flex justify-end text-xs text-[#0f172a]/50">{form.bio.length}/400</div>
              </div>

              <div className="sticky bottom-0 -mx-8 mt-6 border-t border-slate-100 bg-white/95 px-8 py-4 shadow-[0_-10px_30px_-24px_rgba(15,23,42,0.35)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[#0f172a]/50">Recuerda mantener tus datos actualizados para futuras invitaciones.</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/explorar"
                      className="rounded-full border border-[#06b6d4]/30 px-4 py-2 text-sm font-semibold text-[#06b6d4] transition hover:border-[#06b6d4] hover:text-[#0590ad]"
                    >
                      Explorar partidos
                    </Link>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0b8f3d] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#0a7c35] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Guardando…
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
      {toastMessage ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#0b8f3d] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
