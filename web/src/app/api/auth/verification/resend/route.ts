import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { createVerificationCode, sendVerificationEmail } from "@/lib/email-verification";

const rl = createRateLimiter({ name: "auth_verification_resend", limit: 5, windowSec: 300 });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { ok: false, error: "Has solicitado demasiados codigos. Intenta mas tarde." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Correo requerido" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        profile: { select: { name: true } },
      },
    });

    if (!user) {
      // No revelamos si el correo existe
      return NextResponse.json({ ok: true });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { ok: false, error: "Este correo ya esta verificado" },
        { status: 400 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { ok: false, error: "No encontramos una direccion de correo valida" },
        { status: 400 }
      );
    }

    const verification = await createVerificationCode(user.id);
    await sendVerificationEmail(user.email, verification.code, { name: user.profile?.name ?? null });

    return NextResponse.json({ ok: true, expiresAt: verification.expiresAt.toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "No se pudo enviar el codigo" },
      { status: 500 }
    );
  }
}
