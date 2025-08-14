import { PrismaClient } from "../generated/prisma";

export const prisma: PrismaClient = new PrismaClient({
  log: ["warn", "error"],
});
