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
      isDark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>{teamLabel}</p>
          <h4 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{formationName}</h4>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
          isDark ? "border border-slate-700 bg-slate-800 text-slate-200" : "border border-slate-200 bg-slate-50 text-slate-600"
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
                    ? "border-emerald-400 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/40"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : player
                    ? isDark
                      ? "border-slate-700 bg-slate-800 text-slate-100"
                      : "border-slate-200 bg-slate-100"
                    : isDark
                      ? "border-dashed border-slate-700 bg-slate-900 text-slate-400"
                      : "border-dashed border-slate-200 bg-white text-slate-500"
              } ${isSelected ? "ring-2 ring-emerald-400" : ""}`.trim()}
            >
              <div className="flex flex-col">
                <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>{posicionES[slot.position]}</span>
                <span className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  {player ? player.displayName : slot.isAvailable ? "Disponible" : ""}
                </span>
              </div>
              {player
                ? null
                : canSelect
                  ? (
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Tomar</span>
                  )
                  : slot.isAvailable
                    ? null
                    : (
                      <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>No disponible</span>
                    )}
            </button>
          );
        })}
      </div>

      {bench.length > 0 ? (
        <div className={`rounded-xl border border-dashed px-4 py-3 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-slate-300" : "text-slate-500"}`}>Suplentes</p>
          <ul className={`mt-2 space-y-1 text-sm ${isDark ? "text-slate-200" : "text-slate-600"}`}>
            {bench.map((player, idx) => (
              <li key={player.userId ?? player.spotId ?? idx}>{player.displayName}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

