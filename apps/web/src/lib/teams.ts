export const TEAM_KEYS = ["CLARO", "OSCURO"] as const;
export type TeamKey = typeof TEAM_KEYS[number];

export const TEAM_LABELS: Record<TeamKey, string> = {
  CLARO: "Equipo claro",
  OSCURO: "Equipo oscuro",
};

export const POSITION_KEYS = ["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"] as const;
export type PositionKey = typeof POSITION_KEYS[number];

const POSITION_SET = new Set(POSITION_KEYS);

const TEAM_MAP: Record<string, TeamKey> = {
  CLARO: "CLARO",
  LIGHT: "CLARO",
  OSCURO: "OSCURO",
  OSCURA: "OSCURO",
  DARK: "OSCURO",
  CLARA: "CLARO",
};

export function normalizeTeam(input: unknown): TeamKey | null {
  if (!input && input !== 0) return null;
  const value = String(input).trim().toUpperCase();
  return TEAM_MAP[value] ?? null;
}

export function normalizePosition(input: unknown): PositionKey | null {
  if (!input && input !== 0) return null;
  const value = String(input).trim().toUpperCase();
  return POSITION_SET.has(value as PositionKey) ? (value as PositionKey) : null;
}

export function computeTeamCapacities(totalSpots: number) {
  const total = Number.isFinite(totalSpots) ? Math.max(0, Math.floor(totalSpots)) : 0;
  const claro = Math.ceil(total / 2);
  const oscuro = Math.max(0, total - claro);
  return { claro, oscuro };
}

export function isPositionKey(value: unknown): value is PositionKey {
  return POSITION_SET.has(value as PositionKey);
}

export function ensurePosition(value: unknown): PositionKey | null {
  const normalized = normalizePosition(value);
  return normalized ?? null;
}
