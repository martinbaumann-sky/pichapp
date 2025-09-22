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
};

export function FormationBoard({ teamLabel, formationName, slots, bench = [], selectedSlotIndex = null, onSelectSlot }: FormationBoardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{teamLabel}</p>
          <h4 className="text-lg font-semibold text-slate-900">{formationName}</h4>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          {slots.length} jugadores
        </span>
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
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : player
                    ? "border-slate-200 bg-slate-50"
                    : "border-dashed border-slate-200 bg-white text-slate-500"
              } ${isSelected ? "ring-2 ring-emerald-400" : ""}`.trim()}
            >
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-slate-500">{posicionES[slot.position]}</span>
                <span className="text-sm font-semibold text-slate-900">
                  {player ? player.displayName : slot.isAvailable ? "Disponible" : ""}
                </span>
              </div>
              {player ? (
                <span className="text-xs font-medium text-slate-500">{player.position ? posicionES[player.position] : "Sin posicion"}</span>
              ) : canSelect ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Tomar</span>
              ) : (
                <span className="text-xs text-slate-400">No disponible</span>
              )}
            </button>
          );
        })}
      </div>

      {bench.length > 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suplentes</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {bench.map((player, idx) => (
              <li key={player.userId ?? player.spotId ?? idx}>{player.displayName}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

