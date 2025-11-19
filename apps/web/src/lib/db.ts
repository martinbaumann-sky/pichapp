import type { PrismaClient } from "@prisma/client";
import { getLogger } from "@/lib/logger";
import { getPrisma as getLazyPrisma } from "./prisma";

const logger = getLogger({ module: "db" });

const shouldSkipValidation =
  process.env.SKIP_PRISMA_ENV_VALIDATION === "1" ||
  process.env.npm_lifecycle_event === "build";

const ensureDatabaseEnv = () => {
  const pickFirst = (...candidates: (string | undefined)[]) =>
    candidates.find((value) => typeof value === "string" && value.trim().length > 0);

  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'db-debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] Checking env. DATABASE_URL present: ${!!process.env.DATABASE_URL}\n`);
    if (process.env.DATABASE_URL) {
      fs.appendFileSync(logPath, `[${new Date().toISOString()}] DATABASE_URL length: ${process.env.DATABASE_URL.length}\n`);
    }
  } catch (e) { }

  if (!process.env.DATABASE_URL) {
    const prismaDb = process.env.PRISMA_DATABASE_URL;
    const fallback = pickFirst(
      process.env.POSTGRES_PRISMA_URL,
      process.env.POSTGRES_URL,
      process.env.POSTGRES_DATABASE_URL,
      process.env.POSTGRES_URL_POSTGRES,
      process.env.POSTGRES_URL_NON_POOLING,
      // Explicit Prisma Accelerate connection strings start with prisma:// so avoid using them for direct connections.
      prismaDb && prismaDb.startsWith("postgres") ? prismaDb : undefined,
      process.env.DIRECT_URL,
    );
    if (fallback) {
      process.env.DATABASE_URL = fallback;
    }
  }

  if (!process.env.DIRECT_URL) {
    const direct = pickFirst(
      process.env.POSTGRES_URL_NON_POOLING,
      process.env.POSTGRES_DIRECT_URL,
      process.env.POSTGRES_URL,
      process.env.POSTGRES_DATABASE_URL,
      process.env.POSTGRES_URL_POSTGRES,
      process.env.DATABASE_URL,
    );
    if (direct) {
      process.env.DIRECT_URL = direct;
    }
  }

  if (!process.env.DATABASE_URL && !shouldSkipValidation) {
    throw new Error("DATABASE_URL environment variable is required for Prisma.");
  }
};

let ensureColumnScriptExecuted = false;
const runEnsureColumnScript = () => {
  if (ensureColumnScriptExecuted) {
    return;
  }

  ensureColumnScriptExecuted = true;

  try {
    const child_process = require("child_process");
    const path = require("path");
    const scriptPath = path.join(
      __dirname,
      "../../scripts/ensure-email-verified-column.js",
    );
    try {
      child_process.spawnSync(process.execPath, [scriptPath], { stdio: "ignore" });
    } catch (e) {
      // Ignorar errores aquí; si falla, Prisma lanzará un error más tarde al intentar
      // usar la columna. Logueamos en consola para depuración local.
      logger.warn(
        { error: e },
        "No se pudo ejecutar el script ensure-email-verified-column",
      );
    }
  } catch (err) {
    logger.warn(
      { error: err },
      "Error comprobando/ejecutando ensure-email-verified-column",
    );
  }
};

const globalAny = globalThis as typeof globalThis & {
  __prisma__?: PrismaClient;
};

const getPrismaClient = () => {
  if (shouldSkipValidation) {
    throw new Error("Prisma Client no está disponible durante el proceso de build.");
  }

  ensureDatabaseEnv();
  runEnsureColumnScript();

  if (!globalAny.__prisma__) {
    globalAny.__prisma__ = getLazyPrisma();
  }

  return globalAny.__prisma__;
};

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (prop === "then") {
      return undefined;
    }

    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);

    if (typeof value === "function") {
      return value.bind(client);
    }

    return value;
  },
});

export const getPrisma = getPrismaClient;
