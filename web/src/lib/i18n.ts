export const nivelES = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
} as const;

export const posicionES = {
  ARQUERO: "Arquero",
  DEFENSA: "Defensa",
  LATERAL: "Lateral",
  VOLANTE: "Volante",
  DELANTERO: "Delantero",
} as const;

export type NivelKey = keyof typeof nivelES;
export type PosicionKey = keyof typeof posicionES;


