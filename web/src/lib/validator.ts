import { z } from "zod";

export const levelEnum = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);

export const createMatchSchema = z.object({
  title: z.string().min(3).max(80),
  // Permitir que venga vacio y derivarlo en el backend desde la direccion
  comuna: z.string().min(2, { message: "Comuna requerida" }).optional(),
  startsAt: z
    .string()
    .transform((v) => new Date(v))
    .refine((d) => !isNaN(d.getTime()), { message: "Fecha invalida" }),
  // Coercer numeros que pueden venir como string desde el form
  durationMins: z.coerce.number().int().min(30).max(180),
  pricePerSpot: z
    .coerce
    .number()
    .int()
    .min(0, { message: "El precio por cupo debe ser 0 o mayor" })
    .max(50000),
  totalSpots: z.coerce.number().int().min(1).max(30),
  minSpotsToConfirm: z.coerce.number().int().min(1).max(30),
  level: levelEnum,
  // Hacer opcionales para permitir texto libre; el backend normaliza
  venueName: z.string().optional().default(""),
  venueAddress: z.string().optional().default(""),
  venueId: z.string().uuid().optional(),
  // Hacer opcionales lat/lng para no bloquear si el proveedor no los devuelve
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  // Datos opcionales para jugadores ocupados (flexible)
  occupiedPlayers: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(6).optional().nullable(),
        email: z.string().email().optional().nullable(),
        position: z.string().optional().nullable(),
        team: z.string().optional().nullable(),
      })
    )
    .optional(),
  coverImageUrl: z.string().url().optional(),
  public: z.boolean().default(true),
  applyNoShowFee: z.boolean().optional(),
  occupiedSpots: z.coerce.number().int().min(0).optional(),
})
  .refine((data) => (data.occupiedSpots ?? 0) <= data.totalSpots, {
    message: "Los cupos ocupados no pueden exceder el total de cupos",
    path: ["occupiedSpots"],
  })
  .refine((data) => data.minSpotsToConfirm <= data.totalSpots, {
    message: "El mínimo de cupos debe ser menor o igual al total de cupos",
    path: ["minSpotsToConfirm"],
  });

export type CreateMatchInput = z.infer<typeof createMatchSchema>;

export const listMatchesSchema = z
  .object({
    comuna: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    level: levelEnum.optional(),
  })
  .passthrough();

export type ListMatchesQuery = z.infer<typeof listMatchesSchema>;
