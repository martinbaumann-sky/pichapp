import { PrismaClient } from "@prisma/client";

const shouldSkipValidation =
  process.env.SKIP_PRISMA_ENV_VALIDATION === "1" ||
  process.env.npm_lifecycle_event === "build";
const defaultSqliteUrl = "file:./prisma/dev.db";
const isProd = process.env.NODE_ENV === "production";

const ensureDatabaseEnv = () => {
  if (!process.env.DATABASE_URL) {
    const fallback = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    if (fallback) {
      process.env.DATABASE_URL = fallback;
    } else if (!isProd) {
      process.env.DATABASE_URL = defaultSqliteUrl;
    }
  }
  if (!process.env.DIRECT_URL) {
    const direct = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    if (direct) {
      process.env.DIRECT_URL = direct;
    } else if (!isProd && process.env.DATABASE_URL?.startsWith("file:")) {
      process.env.DIRECT_URL = process.env.DATABASE_URL;
    }
  }
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
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
      console.warn(
        "No se pudo ejecutar el script ensure-email-verified-column:",
        e?.message || e,
      );
    }
  } catch (err) {
    console.warn(
      "Error comprobando/ejecutando ensure-email-verified-column:",
      err?.message || err,
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
    globalAny.__prisma__ = new PrismaClient();
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
