const { execSync } = require('node:child_process');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd });

const isCi = [process.env.CI, process.env.VERCEL, process.env.VERCEL_ENV]
  .map((value) => String(value || '').toLowerCase())
  .some((value) => value === '1' || value === 'true' || value === 'production');

const pickFirst = (...candidates) =>
  candidates.find((value) => typeof value === 'string' && value.trim().length > 0);

const normalizePostgresUrl = (candidate) => {
  if (!candidate) return undefined;

  let value = candidate.trim();
  if (!value) return undefined;

  if (value.startsWith('postgres://')) {
    value = `postgresql://${value.slice('postgres://'.length)}`;
  }

  try {
    const parsed = new URL(value);
    const isSupabaseHost = /\.supabase\.(co|in)$/.test(parsed.hostname) ||
      parsed.hostname.includes('supabase.co');
    const isPoolerHost = parsed.hostname.includes('pooler.supabase') ||
      parsed.searchParams.get('pgbouncer') === 'true';

    if (isSupabaseHost && !parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }

    if (isPoolerHost) {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true');
      }
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '1');
      }
    }

    return parsed.toString();
  } catch (err) {
    return value;
  }
};

const buildSupabaseUrlFromParts = ({ host, port, database, user, password }) => {
  if (!host || !user || !password) return undefined;

  const resolvedPort = port && port.trim().length > 0 ? port : '5432';
  const resolvedDatabase = database && database.trim().length > 0 ? database : 'postgres';

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);

  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${resolvedPort}/${resolvedDatabase}`;
};

const resolveSupabaseDatabaseUrls = () => {
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

  return {
    pooled: normalizePostgresUrl(pooledCandidate),
    direct: normalizePostgresUrl(directCandidate),
  };
};

const ensureDatabaseEnv = () => {
  const supabase = resolveSupabaseDatabaseUrls();

  const originalDb = process.env.DATABASE_URL;

  if (!originalDb) {
    if (isCi) {
      const prismaDb = process.env.PRISMA_DATABASE_URL;
      const vercelDb = pickFirst(
        supabase.pooled,
        supabase.direct,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
        process.env.POSTGRES_DATABASE_URL,
        process.env.POSTGRES_URL_POSTGRES,
        process.env.POSTGRES_URL_NON_POOLING,
        // Prisma Accelerate URLs use prisma://, avoid them for direct connections.
        prismaDb && prismaDb.startsWith('postgres') ? prismaDb : undefined,
        process.env.DIRECT_URL,
      );
      if (vercelDb) {
        process.env.DATABASE_URL = vercelDb;
        if (vercelDb === supabase.pooled || vercelDb === supabase.direct) {
          console.log('DATABASE_URL not provided. Using Supabase connection string from environment.');
        } else {
          console.log('DATABASE_URL not provided. Using Postgres URL from Vercel environment.');
        }
      } else {
        console.warn('DATABASE_URL not provided and no Vercel Postgres fallback found. Prisma migrate will be skipped.');
      }
    } else {
      const sqliteUrl = 'file:./dev.db';
      process.env.DATABASE_URL = sqliteUrl;
      process.env.DIRECT_URL = sqliteUrl;
      console.log('DATABASE_URL not provided. Using local SQLite fallback at prisma/dev.db.');
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
      if (direct === supabase.direct) {
        console.log('DIRECT_URL not provided. Using Supabase direct connection string.');
      } else if (direct === supabase.pooled) {
        console.log('DIRECT_URL not provided. Reusing Supabase pooled connection string.');
      } else {
        console.log('DIRECT_URL not provided. Using non-pooling Postgres URL fallback.');
      }
    }
  }

  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
    console.log('DIRECT_URL not provided. Reusing DATABASE_URL for Prisma direct connection.');
  }

  const dbUrl = process.env.DATABASE_URL || '';
  return { dbUrl };
};

const { dbUrl } = ensureDatabaseEnv();

try {
  run('npx prisma generate');
} catch (e) {
  console.error('prisma generate failed');
  process.exit(1);
}

if (dbUrl && !dbUrl.startsWith('file:')) {
  try {
    run('npx prisma migrate deploy');
  } catch (e) {
    console.error('prisma migrate deploy failed');
    process.exit(1);
  }
} else {
  console.log('Skipping prisma migrate deploy (no DATABASE_URL or sqlite).');
}

run('npx next build');


