
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { toAuthUser } from "@/lib/auth-user";

const rl = createRateLimiter({ name: "auth_verify_email", limit: 5, windowSec: 300 });

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos. Intenta mas tarde." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();
    if (!email || !code) {
      return NextResponse.json(
        { ok: false, error: "Correo y codigo requeridos" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        role: true,
        emailVerifiedAt: true,
        disabledAt: true,
        profile: { select: { name: true, comuna: true, position: true } },
      },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No encontramos una cuenta con ese correo" },
        { status: 404 }
      );
    }

    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        code,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) {
      return NextResponse.json(
        { ok: false, error: "Codigo invalido o expirado" },
        { status: 400 }
      );
    }

    const now = new Date();

    const updatedUser = await prisma.$transaction(async (tx) => {
      const active = await tx.emailVerification.findUnique({
        where: { id: verification.id },
        select: { id: true, consumedAt: true, expiresAt: true },
      });
      if (!active || active.consumedAt || active.expiresAt <= now) {
        throw new Error("Codigo expirado");
      }

      await tx.emailVerification.update({
        where: { id: verification.id },
        data: { consumedAt: now },
      });

      return tx.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: now },
        select: {
          id: true,
          email: true,
          isAdmin: true,
          role: true,
          emailVerifiedAt: true,
          disabledAt: true,
          profile: { select: { name: true, comuna: true, position: true } },
        },
      });
    });

    if (updatedUser.disabledAt) {
      return NextResponse.json(
        { ok: false, error: "Tu cuenta esta bloqueada." },
        { status: 403 }
      );
    }

    const token = await createSession(updatedUser.id);
    const res = NextResponse.json({ ok: true, user: toAuthUser(updatedUser) });
    attachSessionCookie(res, token);
    return res;
  } catch (err: any) {
    const message = err instanceof Error ? err.message : err?.message;
    if (message === "Codigo expirado") {
      return NextResponse.json(
        { ok: false, error: "Codigo expirado" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { ok: false, error: message || "No se pudo verificar el correo" },
      { status: 500 }
    );
  }
}
