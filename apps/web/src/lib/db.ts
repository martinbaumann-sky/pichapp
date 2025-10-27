import type { PrismaClient } from "@prisma/client";
import { getLogger } from "@/lib/logger";
import { getPrisma as getLazyPrisma } from "./prisma";

const logger = getLogger({ module: "db" });

const shouldSkipValidation =
  process.env.SKIP_PRISMA_ENV_VALIDATION === "1" ||
  process.env.npm_lifecycle_event === "build";

const pickFirst = <T extends string | undefined>(...candidates: T[]) =>
  candidates.find((value): value is Exclude<T, undefined> =>
    typeof value === "string" && value.trim().length > 0,
  );

type SupabaseDatabaseUrls = {
  pooled?: string;
  direct?: string;
};

const normalizePostgresUrl = (candidate?: string | null) => {
  if (!candidate) {
    return undefined;
  }

  let value = candidate.trim();
  if (!value) {
    return undefined;
  }

  if (value.startsWith("postgres://")) {
    value = `postgresql://${value.slice("postgres://".length)}`;
  }

  try {
    const parsed = new URL(value);

    const isSupabaseHost = /\.supabase\.(co|in)$/.test(parsed.hostname) ||
      parsed.hostname.includes("supabase.co");
    const isPoolerHost = parsed.hostname.includes("pooler.supabase") ||
      parsed.searchParams.get("pgbouncer") === "true";

    if (isSupabaseHost && !parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    if (isPoolerHost) {
      if (!parsed.searchParams.has("pgbouncer")) {
        parsed.searchParams.set("pgbouncer", "true");
      }
      if (!parsed.searchParams.has("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }
    }

    return parsed.toString();
  } catch (_err) {
    return value;
  }
};

const buildSupabaseUrlFromParts = (options: {
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
}) => {
  const { host, user, password } = options;
  if (!host || !user || !password) {
    return undefined;
  }

  const port = options.port && options.port.trim().length > 0 ? options.port : "5432";
  const database =
    options.database && options.database.trim().length > 0 ? options.database : "postgres";

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}`;
};

const resolveSupabaseDatabaseUrls = (): SupabaseDatabaseUrls => {
  const directCandidate = pickFirst(
    process.env.SUPABASE_DIRECT_URL,
    process.env.SUPABASE_DB_DIRECT_URL,
    process.env.SUPABASE_DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.SUPABASE_DB_CONNECTION_STRING,
    process.env.SUPABASE_CONNECTION_STRING,
    buildSupabaseUrlFromParts({
      host: pickFirst(process.env.SUPABASE_DB_HOST, process.env.SUPABASE_HOST),
      port: pickFirst(process.env.SUPABASE_DB_PORT, process.env.SUPABASE_PORT),
      database: pickFirst(
        process.env.SUPABASE_DB_DATABASE,
        process.env.SUPABASE_DB_NAME,
        process.env.SUPABASE_DATABASE,
      ),
      user: pickFirst(process.env.SUPABASE_DB_USER, process.env.SUPABASE_USER),
      password: pickFirst(process.env.SUPABASE_DB_PASSWORD, process.env.SUPABASE_PASSWORD),
    }),
  );

  const pooledCandidate = pickFirst(
    process.env.SUPABASE_DB_POOLER_URL,
    process.env.SUPABASE_DB_POOL_URL,
    process.env.SUPABASE_POOLER_URL,
    process.env.SUPABASE_POOLING_URL,
    buildSupabaseUrlFromParts({
      host: pickFirst(
        process.env.SUPABASE_DB_POOLER_HOST,
        process.env.SUPABASE_POOLER_HOST,
      ),
      port: pickFirst(
        process.env.SUPABASE_DB_POOLER_PORT,
        process.env.SUPABASE_POOLER_PORT,
        process.env.SUPABASE_DB_PORT,
        process.env.SUPABASE_PORT,
      ),
      database: pickFirst(
        process.env.SUPABASE_DB_DATABASE,
        process.env.SUPABASE_DB_NAME,
        process.env.SUPABASE_DATABASE,
      ),
      user: pickFirst(process.env.SUPABASE_DB_USER, process.env.SUPABASE_USER),
      password: pickFirst(process.env.SUPABASE_DB_PASSWORD, process.env.SUPABASE_PASSWORD),
    }),
  );

  const direct = normalizePostgresUrl(directCandidate);
  const pooled = normalizePostgresUrl(pooledCandidate);

  return { pooled, direct };
};

const ensureDatabaseEnv = () => {
  const supabase = resolveSupabaseDatabaseUrls();

  if (!process.env.DATABASE_URL) {
    const prismaDb = process.env.PRISMA_DATABASE_URL;
    const fallback = pickFirst(
      supabase.pooled,
      supabase.direct,
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
      supabase.direct,
      supabase.pooled,
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
