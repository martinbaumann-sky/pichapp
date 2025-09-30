import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { getPasswordHash } from "@/lib/auth-password";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";

const rl = createRateLimiter({ name: "auth_login", limit: 10, windowSec: 60 });

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
    const password = String(body?.password || "");
    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email y contrasena requeridos" },
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
        passwordHash: true,
        profile: { select: { name: true, comuna: true, position: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }
    if (user.disabledAt) {
      return NextResponse.json({ ok: false, error: "Tu cuenta está bloqueada." }, { status: 403 });
    }
    let hash: string | null = null;
    try {
      hash = await getPasswordHash(user.id);
    } catch {}
    if (!hash && user.passwordHash) {
      hash = user.passwordHash;
    }
    if (!hash) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }

    // Temporal: omitimos bloqueo por verificación de email hasta que la columna exista.

    const token = await createSession(user.id);
    const res = NextResponse.json({ ok: true, user: sanitizeUser(user) });
    attachSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error al iniciar sesion" },
      { status: 500 }
    );
  }
}

function sanitizeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    emailVerified: !!u.emailVerifiedAt,
    isAdmin: !!u.isAdmin,
    role: (u.role ?? "PLAYER").toLowerCase(),
    name: u.profile?.name || null,
    comuna: u.profile?.comuna || null,
    position: u.profile?.position || null,
  };
}
