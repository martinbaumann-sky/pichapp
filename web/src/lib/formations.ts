import { POSITION_KEYS, type PositionKey } from "@/lib/teams";

export type FormationPreset = {
  code: string;
  name: string;
  slots: PositionKey[];
};

const PRESETS: Record<number, FormationPreset> = {
  4: { code: "1-1-1", name: "1-1-1", slots: ["ARQUERO", "DEFENSA", "VOLANTE", "DELANTERO"] },
  5: { code: "2-1-1", name: "2-1-1", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "VOLANTE", "DELANTERO"] },
  6: { code: "2-2-1", name: "2-2-1", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"] },
  7: { code: "3-2-1", name: "3-2-1", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "DELANTERO"] },
  8: { code: "3-3-1", name: "3-3-1", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO"] },
  9: { code: "3-3-2", name: "3-3-2", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO"] },
  10: { code: "3-4-2", name: "3-4-2", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO"] },
  11: { code: "4-3-3", name: "4-3-3", slots: ["ARQUERO", "DEFENSA", "DEFENSA", "LATERAL", "LATERAL", "VOLANTE", "VOLANTE", "VOLANTE", "DELANTERO", "DELANTERO", "DELANTERO"] },
};

const FALLBACK: FormationPreset = {
  code: "flex",
  name: "Formacion flexible",
  slots: Array.from(POSITION_KEYS) as PositionKey[],
};

export function getFormationPreset(teamSize: number): FormationPreset {
  const normalizedSize = Number.isFinite(teamSize) ? Math.max(1, Math.floor(teamSize)) : 1;
  if (PRESETS[normalizedSize]) return PRESETS[normalizedSize];
  if (normalizedSize < 4) {
    return {
      code: "basico",
      name: "Basica",
      slots: Array.from({ length: normalizedSize }).map((_, idx) => {
        if (idx === 0) return "ARQUERO";
        if (idx === normalizedSize - 1) return "DELANTERO";
        return "VOLANTE";
      }) as PositionKey[],
    };
  }
  return {
    ...FALLBACK,
    slots: repeatAndTrim(POSITION_KEYS, normalizedSize),
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

export type FormationAssignment<TPlayer extends { position?: PositionKey | null }> = {
  slots: Array<{
    index: number;
    position: PositionKey;
    player: TPlayer | null;
  }>;
  bench: TPlayer[];
};

export function assignPlayersToFormation<TPlayer extends { position?: PositionKey | null }>(players: TPlayer[], preset: FormationPreset): FormationAssignment<TPlayer> {
  const remaining = [...players];
  const slots = preset.slots.map((slotPosition, index) => {
    const exactIndex = remaining.findIndex((player) => player.position === slotPosition);
    const pickIndex = exactIndex >= 0 ? exactIndex : remaining.findIndex(() => true);
    const player = pickIndex >= 0 ? remaining.splice(pickIndex, 1)[0] : null;
    return { index, position: slotPosition, player };
  });
  return { slots, bench: remaining };
}

