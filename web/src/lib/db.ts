import { PrismaClient } from "@prisma/client";

// Evitar pasar opciones al constructor para que no haya validación
// sobre "datasources" (que dispara P2022 si alguien sobrecarga mal).
// Usamos singleton para entornos con HMR.
const globalAny = globalThis as any;
export const prisma: PrismaClient = globalAny.__prisma__ || new PrismaClient();
if (!globalAny.__prisma__) globalAny.__prisma__ = prisma;
