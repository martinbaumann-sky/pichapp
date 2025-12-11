import { getDbClient, prisma } from "./db";

export function getPrisma() {
  return getDbClient();
}

export { prisma };
