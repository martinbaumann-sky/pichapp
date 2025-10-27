const { execSync } = require('node:child_process');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd });

const isCi = [process.env.CI, process.env.VERCEL, process.env.VERCEL_ENV]
  .map((value) => String(value || '').toLowerCase())
  .some((value) => value === '1' || value === 'true' || value === 'production');

const ensureDatabaseEnv = () => {
  const pickFirst = (...candidates) =>
    candidates.find((value) => typeof value === 'string' && value.trim().length > 0);

  const originalDb = process.env.DATABASE_URL;

  if (!originalDb) {
    if (isCi) {
      const prismaDb = process.env.PRISMA_DATABASE_URL;
      const vercelDb = pickFirst(
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
        console.log('DATABASE_URL not provided. Using Postgres URL from Vercel environment.');
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
      process.env.POSTGRES_URL_NON_POOLING,
      process.env.POSTGRES_DIRECT_URL,
      process.env.POSTGRES_URL,
      process.env.POSTGRES_DATABASE_URL,
      process.env.POSTGRES_URL_POSTGRES,
      process.env.DATABASE_URL,
    );
    if (direct) {
      process.env.DIRECT_URL = direct;
      console.log('DIRECT_URL not provided. Using non-pooling Postgres URL fallback.');
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


