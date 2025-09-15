const { execSync } = require('node:child_process');
const path = require('node:path');

const cwd = path.resolve(__dirname, '..');
const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd });

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

