const { execSync } = require('node:child_process');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd });

const ensureDatabaseEnv = () => {
  if (!process.env.DATABASE_URL) {
    const fallback = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
    if (fallback) {
      process.env.DATABASE_URL = fallback;
      console.log('DATABASE_URL not provided. Using Postgres URL from Vercel env.');
    }
  }
  if (!process.env.DIRECT_URL) {
    const direct = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    if (direct) {
      process.env.DIRECT_URL = direct;
      console.log('DIRECT_URL not provided. Using non-pooling Postgres URL from Vercel env.');
    }
  }
  if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
    process.env.DIRECT_URL = process.env.DATABASE_URL;
    console.log('DIRECT_URL not provided. Reusing DATABASE_URL for Prisma direct connection.');
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required for Prisma.');
    process.exit(1);
  }
};

ensureDatabaseEnv();

try {
  run('npx prisma generate');
} catch (e) {
  console.error('prisma generate failed');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || '';
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


