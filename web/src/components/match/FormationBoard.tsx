"use client";

import type { PositionKey } from "@/lib/teams";
import { posicionES } from "@/lib/i18n";

export type FormationPlayer = {
  spotId?: string | null;
  userId?: string | null;
  displayName: string;
  position?: PositionKey | null;
};

export type FormationSlotView = {
  index: number;
  position: PositionKey;
  player: FormationPlayer | null;
  isAvailable: boolean;
};

export type FormationBoardProps = {
  teamLabel: string;
  formationName: string;
  slots: FormationSlotView[];
  bench?: FormationPlayer[];
  selectedSlotIndex?: number | null;
  onSelectSlot?: (slot: FormationSlotView) => void;
  variant?: "light" | "dark";
};

export function FormationBoard({ teamLabel, formationName, slots, bench = [], selectedSlotIndex = null, onSelectSlot, variant = "light" }: FormationBoardProps) {
  const isDark = variant === "dark";
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm ${
      isDark ? "border-brand-700 bg-brand-700 text-white" : "border-[color:var(--border)]/80 bg-white"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-brand-light" : "text-[color:var(--brand-1)]"}`}>{teamLabel}</p>
          <h4 className={`text-lg font-semibold ${isDark ? "text-white" : "text-[color:var(--fg)]"}`}>{formationName}</h4>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isDark ? "border border-brand-700 bg-brand-700 text-white/80" : "border border-[color:var(--border)]/80 bg-[color:var(--bg)] text-[color:var(--fg-muted)]"
        }`}>{slots.length} jugadores</span>
      </div>

      <div className="grid gap-3">
        {slots.map((slot) => {
          const isSelected = selectedSlotIndex === slot.index;
          const player = slot.player;
          const canSelect = slot.isAvailable && !!onSelectSlot;
          return (
            <button
              key={slot.index}
              type="button"
              disabled={!canSelect}
              onClick={() => {
                if (!canSelect || !onSelectSlot) return;
                onSelectSlot(slot);
              }}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition disabled:cursor-default ${
                canSelect
                  ? isDark
                    ? "border-[color:var(--brand-1)]/40 bg-brand-700/30 text-brand-light hover:bg-brand-700/40"
                    : "border-[color:var(--brand-1)]/20 bg-[color:var(--brand-soft)] text-brand-600 hover:bg-[color:var(--brand-soft)]"
                  : player
                    ? isDark
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-[color:var(--border)]/80 bg-[color:var(--bg-subtle)]"
                    : isDark
                      ? "border-dashed border-brand-700 bg-brand-700 text-[color:var(--fg-subtle)]"
                      : "border-dashed border-[color:var(--border)]/80 bg-white text-[color:var(--fg-subtle)]"
              } ${isSelected ? "ring-2 ring-[color:var(--brand-1)]/40" : ""}`.trim()}
            >
              <div className="flex flex-col">
                <span className={`text-xs uppercase tracking-wide ${isDark ? "text-[color:var(--fg-subtle)]" : "text-[color:var(--fg-subtle)]"}`}>{posicionES[slot.position]}</span>
                <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-[color:var(--fg)]"}`}>
                  {player ? player.displayName : slot.isAvailable ? "Disponible" : ""}
                </span>
              </div>
              {player
                ? null
                : canSelect
                  ? (
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-brand-light" : "text-[color:var(--brand-1)]"}`}>Tomar</span>
                  )
                  : slot.isAvailable
                    ? null
                    : (
                      <span className={`text-xs ${isDark ? "text-[color:var(--fg-subtle)]" : "text-[color:var(--fg-subtle)]"}`}>No disponible</span>
                    )}
            </button>
          );
        })}
      </div>

      {bench.length > 0 ? (
        <div className={`rounded-xl border border-dashed px-4 py-3 ${isDark ? "border-brand-700 bg-brand-700" : "border-[color:var(--border)]/80 bg-[color:var(--bg)]"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[color:var(--fg-subtle)]" : "text-[color:var(--fg-subtle)]"}`}>Suplentes</p>
          <ul className={`mt-2 space-y-1 text-sm ${isDark ? "text-white/80" : "text-[color:var(--fg-muted)]"}`}>
            {bench.map((player, idx) => (
              <li key={player.userId ?? player.spotId ?? idx}>{player.displayName}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

