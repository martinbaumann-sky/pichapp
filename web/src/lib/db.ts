import path from "path";
import fs from "fs";
import { PrismaClient } from "../generated/prisma";

// Construir DATABASE_URL absoluto hacia web/prisma/dev.db en desarrollo si no está definido
const envUrl = process.env.DATABASE_URL;
let datasourceUrl = envUrl;
if (!envUrl) {
  // Preferir ruta dentro del paquete `web/prisma/dev.db`
  const candidate = path.resolve(process.cwd(), "web", "prisma", "dev.db");
  // Normalizar separadores a '/' para compatibilidad con URLs en Windows
  const normalized = candidate.replace(/\\/g, "/");
  // Asegurar encoding si la ruta tiene espacios
  const encoded = encodeURI(normalized);
  datasourceUrl = `file:${encoded}`;

  // Log para debugging si la DB no puede abrirse
  try {
    if (!fs.existsSync(candidate)) {
      console.warn("Prisma DB not found at:", candidate);
    }
  } catch (e) {
    console.warn("Error checking DB file existence:", e);
  }
}

export const prisma: PrismaClient = new PrismaClient({
  log: ["warn", "error"],
  datasources: { db: { url: datasourceUrl } } as any,
});
