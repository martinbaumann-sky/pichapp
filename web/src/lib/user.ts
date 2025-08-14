import { prisma } from "./db";

function getAdminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function ensureUserInDatabase(params: { id: string; email: string | null | undefined }) {
  const { id, email } = params;
  const adminEmails = getAdminEmailsFromEnv();
  const isAdmin = email ? adminEmails.includes(email.toLowerCase()) : false;

  return prisma.user.upsert({
    where: { id },
    update: { email: email ?? null, ...(isAdmin ? { isAdmin: true } : {}) },
    create: { id, email: email ?? null, isAdmin },
  });
}


