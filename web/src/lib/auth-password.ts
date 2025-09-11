import { prisma } from "./db";

async function ensureTable() {
  try {
    await (prisma as any).$executeRawUnsafe(
      'CREATE TABLE IF NOT EXISTS "LocalPassword" ("userId" TEXT PRIMARY KEY, "hash" TEXT NOT NULL)'
    );
  } catch (e) {
    // ignore
  }
}

export async function setPasswordHash(userId: string, hash: string) {
  await ensureTable();
  try {
    await (prisma as any).$executeRawUnsafe(
      'INSERT INTO "LocalPassword" ("userId", "hash") VALUES ($1, $2) ON CONFLICT("userId") DO UPDATE SET "hash"=excluded."hash"',
      userId,
      hash
    );
  } catch (e) {
    // ignore
  }
}

export async function getPasswordHash(userId: string): Promise<string | null> {
  await ensureTable();
  try {
    const rows = (await (prisma as any).$queryRawUnsafe(
      'SELECT "hash" FROM "LocalPassword" WHERE "userId" = $1 LIMIT 1',
      userId
    )) as Array<{ hash: string }>;
    if (rows && rows.length > 0) return rows[0].hash;
    return null;
  } catch (e) {
    return null;
  }
}

