import { prisma } from "@/lib/db";
import { assertResend, resend } from "@/lib/email";

const CODE_TTL_MINUTES = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? "15");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "PichangApp <no-reply@pichangapp.cl>";
const DISABLE_EMAIL_VERIFICATION = process.env.DISABLE_EMAIL_VERIFICATION === "1";
const FORCE_EMAIL_VERIFICATION = process.env.ENABLE_EMAIL_VERIFICATION === "1";

function now() {
  return new Date();
}

function generateCode(): string {
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export function isEmailVerificationEnabled() {
  if (DISABLE_EMAIL_VERIFICATION) {
    return false;
  }
  if (FORCE_EMAIL_VERIFICATION) {
    return true;
  }
  return Boolean(resend);
}

export async function createVerificationCode(userId: string) {
  const expiresAt = new Date(now().getTime() + CODE_TTL_MINUTES * 60 * 1000);
  await prisma.emailVerification.deleteMany({ where: { userId } });
  const code = generateCode();
  return prisma.emailVerification.create({
    data: { userId, code, expiresAt },
    select: { id: true, code: true, expiresAt: true },
  });
}

export async function sendVerificationEmail(to: string, code: string, opts?: { name?: string | null }) {
  if (!isEmailVerificationEnabled()) {
    console.warn("[email-verification] Email verification disabled; skipping send for %s", to);
    return;
  }
  const resendClient = assertResend();
  const previewCode = code.split("").join(" ");
  const greeting = opts?.name ? `Hola ${opts.name}` : "Hola";
  await resendClient.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Confirma tu correo en PichangApp",
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="font-size: 20px; font-weight: 600;">${greeting}!</h1>
        <p>Tu codigo de verificacion es:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px;">${previewCode}</p>
        <p>Ingresa este codigo en PichangApp durante los proximos ${CODE_TTL_MINUTES} minutos para confirmar que este correo es tuyo.</p>
        <p style="font-size: 13px; color: #64748b;">Si no fuiste tu, ignora este mensaje.</p>
      </div>
    `,
    text:
      `${greeting}` +
      "\n\n" +
      `Tu codigo de verificacion es ${code}. Ingresa este codigo en PichangApp durante los proximos ${CODE_TTL_MINUTES} minutos.` +
      "\n\nSi no fuiste tu, puedes ignorar este mensaje.",
  });
}

export async function validateVerificationCode(userId: string, code: string) {
  return prisma.emailVerification.findFirst({
    where: {
      userId,
      code,
      consumedAt: null,
      expiresAt: { gt: now() },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markVerificationAsConsumed(id: string) {
  await prisma.emailVerification.update({ where: { id }, data: { consumedAt: now() } });
}


