import { PrismaClient } from "@prisma/client";

let _prisma: PrismaClient | undefined;

export function getPrisma() {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}
