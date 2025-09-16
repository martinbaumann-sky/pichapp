import { PrismaClient } from "@prisma/client";

const ensureDatabaseEnv = () => {
  if (!process.env.DATABASE_URL) {
    const fallback = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    if (fallback) {
      process.env.DATABASE_URL = fallback;
    }
  }
  if (!process.env.DIRECT_URL) {
    const direct = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    if (direct) {
      process.env.DIRECT_URL = direct;
    }
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required for Prisma.");
  }
};

ensureDatabaseEnv();

// Evitar pasar opciones al constructor para que no haya validaci�n
// sobre "datasources" (que dispara P2022 si alguien sobrecarga mal).
// Usamos singleton para entornos con HMR.
const globalAny = globalThis as any;
export const prisma: PrismaClient = globalAny.__prisma__ || new PrismaClient();
if (!globalAny.__prisma__) globalAny.__prisma__ = prisma;
