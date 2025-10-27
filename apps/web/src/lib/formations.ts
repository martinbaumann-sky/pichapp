import { POSITION_KEYS, type PositionKey } from "@/lib/teams";

export type FormationPreset = {
  code: string;
  name: string;
  slots: PositionKey[];
};

function makePreset(code: string, slots: PositionKey[]): FormationPreset {
  return {
    code,
    name: describeOutfieldFormation(slots),
    slots,
  };
}

const PRESETS: Record<number, FormationPreset> = {
  4: makePreset("1-1-1", ["ARQUERO", "DEFENSA", "VOLANTE", "DELANTERO"]),
  5: makePreset("2-1-1", ["ARQUERO", "DEFENSA", "DEFENSA", "VOLANTE", "DELANTERO"]),
  6: makePreset("2-2-1", ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"]),
  7: makePreset("2-2-2", ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "LATERAL", "VOLANTE", "VOLANTE", "DELANTERO"]),
  8: makePreset("3-2-2", ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO"]),
  9: makePreset("3-3-2", ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO"]),
  10: makePreset("3-4-2", ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO"]),
  11: makePreset("4-3-3", ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO", "DELANTERO"]),
};

const FALLBACK_SLOTS = Array.from(POSITION_KEYS) as PositionKey[];
const FALLBACK: FormationPreset = {
  code: "flex",
  name: describeOutfieldFormation(FALLBACK_SLOTS),
  slots: FALLBACK_SLOTS,
};

export function getFormationPreset(teamSize: number): FormationPreset {
  const normalizedSize = Number.isFinite(teamSize) ? Math.max(1, Math.floor(teamSize)) : 1;
  if (PRESETS[normalizedSize]) return PRESETS[normalizedSize];
  if (normalizedSize < 4) {
    const slots = Array.from({ length: normalizedSize }).map((_, idx) => {
      if (idx === 0) return "ARQUERO";
      if (idx === normalizedSize - 1) return "DELANTERO";
      return "VOLANTE";
    }) as PositionKey[];
    return {
      code: "basico",
      name: describeOutfieldFormation(slots),
      slots,
    };
  }
  const slots = repeatAndTrim(POSITION_KEYS, normalizedSize);
  return {
    code: FALLBACK.code,
    slots,
    name: describeOutfieldFormation(slots),
  };
}

function repeatAndTrim(source: readonly PositionKey[], length: number): PositionKey[] {
  const out: PositionKey[] = [];
  let i = 0;
  while (out.length < length) {
    out.push(source[i % source.length]);
    i += 1;
  }
  return out;
}

type FormationLine = "GK" | "DEF" | "MID" | "ATT";

function categorizePosition(position: PositionKey): FormationLine {
  switch (position) {
    case "ARQUERO":
      return "GK";
    case "DEFENSA":
    case "LATERAL":
      return "DEF";
    case "DELANTERO":
      return "ATT";
    case "VOLANTE":
    default:
      return "MID";
  }
}

export function describeOutfieldFormation(slots: PositionKey[]): string {
  const counts: Record<FormationLine, number> = {
    GK: 0,
    DEF: 0,
    MID: 0,
    ATT: 0,
  };

  for (const slot of slots) {
    const category = categorizePosition(slot);
    counts[category] += 1;
  }

  const outfieldLines: number[] = [counts.DEF, counts.MID, counts.ATT];
  const first = outfieldLines.findIndex((value) => value > 0);
  const last = (() => {
    for (let idx = outfieldLines.length - 1; idx >= 0; idx -= 1) {
      if (outfieldLines[idx] > 0) return idx;
    }
    return -1;
  })();

  if (first === -1 || last === -1) {
    return counts.GK > 0 ? "Solo arquero" : "Formación";
  }

  const trimmed = outfieldLines.slice(first, last + 1);
  return trimmed.join("-");
}

export type FormationAssignment<TPlayer extends { position?: PositionKey | null }> = {
  slots: Array<{
    index: number;
    position: PositionKey;
    player: TPlayer | null;
  }>;
  bench: TPlayer[];
};

export function assignPlayersToFormation<TPlayer extends { position?: PositionKey | null }>(players: TPlayer[], preset: FormationPreset): FormationAssignment<TPlayer> {
  // Copiamos para no mutar el arreglo original
  const remaining: TPlayer[] = [...players];

  // 1) Asignar coincidencias exactas por posición
  const slots = preset.slots.map((slotPosition, index) => {
    const exactIdx = remaining.findIndex((p) => p.position === slotPosition);
    const player = exactIdx >= 0 ? remaining.splice(exactIdx, 1)[0] : null;
    return { index, position: slotPosition, player } as const;
  }).map((s) => ({ ...s }));

  // 2) Rellenar los slots restantes, priorizando NO poner jugadores de campo en ARQUERO
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i].player) continue;
    const isGoalkeeperSlot = slots[i].position === "ARQUERO";

    if (isGoalkeeperSlot) {
      // Intentar encontrar un arquero; si no hay, dejar vacío (que quede libre)
      const gkIdx = remaining.findIndex((p) => p.position === "ARQUERO");
      if (gkIdx >= 0) {
        slots[i].player = remaining.splice(gkIdx, 1)[0];
      }
      continue;
    }

    // Para puestos de campo, tomar cualquier jugador NO arquero primero
    let pickIdx = remaining.findIndex((p) => p.position && p.position !== "ARQUERO");
    if (pickIdx < 0) {
      // Si solo quedan arqueros, permite colocarlos en puestos de campo para completar
      pickIdx = remaining.findIndex(() => true);
    }
    if (pickIdx >= 0) {
      slots[i].player = remaining.splice(pickIdx, 1)[0];
    }
  }

  // 3) Los que sobren van a la banca
  return { slots, bench: remaining };
}

