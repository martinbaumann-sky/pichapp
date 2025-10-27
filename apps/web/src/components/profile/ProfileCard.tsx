"use client";

import { ReactNode } from "react";
import { MapPin, Phone } from "lucide-react";
import clsx from "clsx";
import { nivelES, posicionES } from "@/lib/i18n";

type BaseKey = keyof typeof nivelES | keyof typeof posicionES;

type ProfileCardProps = {
  name: string;
  comuna?: string | null;
  phoneDisplay?: string | null;
  position?: string | null;
  skillLevel?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  stats?: Array<{ label: string; value: number | string }>;
  actions?: ReactNode;
  secondaryActions?: ReactNode;
  highlight?: string | null;
  isOwnProfile?: boolean;
};

function initialsFromName(name: string) {
  if (!name) return "JP";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "JP";
}

function renderChip(label: string, variant: "primary" | "secondary" = "primary") {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variant === "primary"
          ? "bg-white/15 text-white"
          : "bg-white/10 text-white/80 border border-white/20",
      )}
    >
      {label}
    </span>
  );
}

export default function ProfileCard({
  name,
  comuna,
  phoneDisplay,
  position,
  skillLevel,
  bio,
  avatarUrl,
  stats,
  actions,
  secondaryActions,
  highlight,
  isOwnProfile,
}: ProfileCardProps) {
  const normalizedPosition = position && posicionES[position as BaseKey] ? posicionES[position as keyof typeof posicionES] : null;
  const normalizedSkill = skillLevel && nivelES[skillLevel as keyof typeof nivelES]
    ? nivelES[skillLevel as keyof typeof nivelES]
    : null;
  const locationLabel = comuna || "Comuna por definir";
  const infoChips: string[] = [];
  if (normalizedPosition) infoChips.push(normalizedPosition);
  if (normalizedSkill) infoChips.push(normalizedSkill);

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 rounded-[36px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-slate-900 opacity-70 blur-2xl" />
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_rgba(15,23,42,0.35))]" />
        <div className="relative p-6 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/30 bg-white/10 shadow-lg">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`Foto de ${name}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-400/70 to-slate-900/70 text-2xl font-bold">
                    {initialsFromName(name)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  {highlight || (isOwnProfile ? "Tu perfil" : "Jugador PichangApp")}
                </p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight">{name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
                  <MapPin className="h-4 w-4 text-emerald-200" />
                  <span>{locationLabel}</span>
                </p>
              </div>
            </div>
            {secondaryActions ? <div className="flex flex-col items-end gap-2">{secondaryActions}</div> : null}
          </div>

          {bio ? (
            <p className="text-sm leading-relaxed text-white/85">
              {bio}
            </p>
          ) : (
            <p className="text-sm text-white/60">
              {isOwnProfile
                ? "Cuenta quién eres en la cancha: tu estilo de juego, equipo favorito o un dato entretenido."
                : "Este jugador aún no ha escrito una bio."}
            </p>
          )}

          {infoChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {infoChips.map((chip) => (
                <div key={chip}>{renderChip(chip)}</div>
              ))}
            </div>
          ) : null}

          {phoneDisplay ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80">
              <Phone className="h-4 w-4 text-emerald-200" />
              <span>{phoneDisplay}</span>
            </div>
          ) : null}

          {stats && stats.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-widest text-white/50">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {actions ? <div className="mt-2 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
