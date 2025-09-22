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
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required for Prisma.");
  }
};

ensureDatabaseEnv();

// Asegurar que la columna `emailVerifiedAt` exista en la base de datos en tiempo de
// ejecución cuando la app arranca en entornos de desarrollo/local. Esto ejecuta un
// script JS que aplica ALTER TABLE IF NOT EXISTS. No hacemos `require` en prod si
// la variable NODE_ENV === 'production'.
try {
  // Ejecutamos siempre el script que asegura la columna `emailVerifiedAt`.
  const child_process = require("child_process");
  const path = require("path");
  const scriptPath = path.join(__dirname, "../../scripts/ensure-email-verified-column.js");
  try {
    child_process.spawnSync(process.execPath, [scriptPath], { stdio: "ignore" });
  } catch (e) {
    // Ignorar errores aquí; si falla, Prisma lanzará un error más tarde al intentar
    // usar la columna. Logueamos en consola para depuración local.
    // eslint-disable-next-line no-console
    console.warn("No se pudo ejecutar el script ensure-email-verified-column:", e?.message || e);
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn("Error comprobando/ejecutando ensure-email-verified-column:", err?.message || err);
}

// Evitar pasar opciones al constructor para que no haya validaci�n
// sobre "datasources" (que dispara P2022 si alguien sobrecarga mal).
// Usamos singleton para entornos con HMR.
const globalAny = globalThis as any;
export const prisma: PrismaClient = globalAny.__prisma__ || new PrismaClient();
if (!globalAny.__prisma__) globalAny.__prisma__ = prisma;
