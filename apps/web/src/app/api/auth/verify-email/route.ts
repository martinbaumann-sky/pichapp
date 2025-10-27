import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { validateVerificationCode, markVerificationAsConsumed, isEmailVerificationEnabled } from "@/lib/email-verification";
import { createSession, attachSessionCookie } from "@/lib/auth-core";
import { toAuthUser } from "@/lib/auth-user";

const rl = createRateLimiter({ name: "auth_verify_email", limit: 6, windowSec: 300 });

const userSelect = {
  id: true,
  email: true,
  emailVerifiedAt: true,
  disabledAt: true,
  isAdmin: true,
  role: true,
  profile: { select: { name: true, comuna: true, position: true } },
} as const;

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos. Intenta mas tarde." },
        { status: 429 },
      );
    }

    if (!isEmailVerificationEnabled()) {
      return NextResponse.json(
        { ok: false, error: "La verificacion de correo no esta disponible." },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();

    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: "Correo y codigo requeridos" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email }, select: userSelect });
    if (!user || !user.email) {
      return NextResponse.json(
        { ok: false, error: "Correo o codigo invalido" },
        { status: 400 },
      );
    }

    if (user.disabledAt) {
      return NextResponse.json(
        { ok: false, error: "Tu cuenta esta bloqueada." },
        { status: 403 },
      );
    }

    if (user.emailVerifiedAt) {
      const token = await createSession(user.id);
      const res = NextResponse.json({ ok: true, user: toAuthUser(user) });
      attachSessionCookie(res, token);
      return res;
    }

    const verification = await validateVerificationCode(user.id, code);
    if (!verification) {
      return NextResponse.json(
        { ok: false, error: "Codigo invalido o expirado" },
        { status: 400 },
      );
    }

    await markVerificationAsConsumed(verification.id);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
      select: userSelect,
    });

    const token = await createSession(updated.id);
    const res = NextResponse.json({ ok: true, user: toAuthUser(updated) });
    attachSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "No se pudo verificar el correo" },
      { status: 500 },
    );
  }
}

