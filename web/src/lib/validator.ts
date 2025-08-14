import { z } from "zod";

export const levelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const createMatchSchema = z.object({
  title: z.string().min(3).max(80),
  // Permitir que venga vacío y derivarlo en el backend desde la dirección
  comuna: z.string().min(2, { message: "Comuna requerida" }).optional(),
  startsAt: z
    .string()
    .transform((v) => new Date(v))
    .refine((d) => !isNaN(d.getTime()), { message: "Fecha inválida" }),
  // Coercer números que pueden venir como string desde el form
  durationMins: z.coerce.number().int().min(30).max(180),
  pricePerSpot: z
    .coerce
    .number()
    .int()
    .min(500, { message: "El precio mínimo por cupo es 500 CLP" })
    .max(50000),
  totalSpots: z.coerce.number().int().min(1).max(30),
  level: levelEnum,
  // Hacer opcionales para permitir texto libre; el backend normaliza
  venueName: z.string().optional().default(""),
  venueAddress: z.string().optional().default(""),
  // Hacer opcionales lat/lng para no bloquear si el proveedor no los devuelve
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  coverImageUrl: z.string().url().optional(),
  public: z.boolean().default(true),
  applyNoShowFee: z.boolean().optional(),
  occupiedSpots: z.coerce.number().int().min(0).optional(),
})
  .refine((data) => (data.occupiedSpots ?? 0) <= data.totalSpots, {
    message: "Los cupos ocupados no pueden exceder el total de cupos",
    path: ["occupiedSpots"],
  });

export type CreateMatchInput = z.infer<typeof createMatchSchema>;

export const listMatchesSchema = z.object({
  comuna: z.string().optional(),
  from: z.string().optional(),
  level: levelEnum.optional(),
  maxPrice: z.coerce.number().optional(),
});

export type ListMatchesQuery = z.infer<typeof listMatchesSchema>;
