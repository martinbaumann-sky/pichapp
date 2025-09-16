import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { createVerificationCode, sendVerificationEmail } from "@/lib/email-verification";

const rl = createRateLimiter({ name: "auth_resend_verification", limit: 3, windowSec: 180 });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiados reintentos. Intenta mas tarde." },
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
      return NextResponse.json(
        { ok: false, error: "No encontramos una cuenta con ese correo" },
        { status: 404 }
      );
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { ok: false, error: "Este correo ya esta verificado" },
        { status: 400 }
      );
    }

    const verification = await createVerificationCode(user.id);
    try {
      await sendVerificationEmail(user.email!, verification.code, { name: user.profile?.name });
    } catch (err: any) {
      return NextResponse.json(
        { ok: false, error: err?.message || "No se pudo enviar el correo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      email,
      expiresAt: verification.expiresAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "No se pudo reenviar el codigo" },
      { status: 500 }
    );
  }
}
