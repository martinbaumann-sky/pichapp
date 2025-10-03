import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { getPasswordHash, setPasswordHash } from "@/lib/auth-password";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { createVerificationCode, sendVerificationEmail, isEmailVerificationEnabled } from "@/lib/email-verification";
import { toAuthUser } from "@/lib/auth-user";
import { verifySupabasePassword } from "@/lib/supabase-admin";

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

    const userSelect = {
      id: true,
      email: true,
      isAdmin: true,
      role: true,
      emailVerifiedAt: true,
      disabledAt: true,
      passwordHash: true,
      profile: { select: { name: true, comuna: true, position: true } },
    } as const;

    const foundUser = await prisma.user.findUnique({ where: { email }, select: userSelect });
    if (!foundUser) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }

    let user = foundUser;

    if (user.disabledAt) {
      return NextResponse.json({ ok: false, error: "Tu cuenta esta bloqueada." }, { status: 403 });
    }

    const normalizedRole = String(user.role ?? (user.isAdmin ? "SUPERADMIN" : "PLAYER")).toUpperCase();
    if (normalizedRole === "VENUE_ADMIN") {
      return NextResponse.json(
        {
          ok: false,
          error: "Inicia sesion como cancha desde /cancha/ingresar.",
        },
        { status: 403 }
      );
    }

    let hash: string | null = null;
    try {
      hash = await getPasswordHash(user.id);
    } catch {
      // ignore
    }
    if (!hash && user.passwordHash) {
      hash = user.passwordHash;
    }

    if (!hash) {
      const supabaseResult = await verifySupabasePassword(email, password);
      if (supabaseResult.ok) {
        const newHash = await bcrypt.hash(password, 10);
        hash = newHash;

        try {
          const data: { passwordHash: string; emailVerifiedAt?: Date } = { passwordHash: newHash };
          if (!user.emailVerifiedAt && supabaseResult.emailVerifiedAt) {
            data.emailVerifiedAt = supabaseResult.emailVerifiedAt;
          }
          await prisma.user.update({ where: { id: user.id }, data });
        } catch (error) {
          console.error("[auth/login] Failed to persist Supabase password to user", error);
        }

        try {
          await setPasswordHash(user.id, newHash);
        } catch (error) {
          console.warn("[auth/login] Failed to persist Supabase password to LocalPassword", error);
        }

        const refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: userSelect });
        if (refreshed) {
          user = refreshed;
        } else if (!user.emailVerifiedAt && supabaseResult.emailVerifiedAt) {
          user = { ...user, emailVerifiedAt: supabaseResult.emailVerifiedAt };
        }
      } else if (supabaseResult.reason === "invalid_credentials") {
        return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
      }
    }

    if (!hash) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      const verificationEnabled = isEmailVerificationEnabled();
      if (!verificationEnabled) {
        const verifiedAt = new Date();
        try {
          const refreshed = await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: verifiedAt },
            select: userSelect,
          });
          if (refreshed) {
            user = refreshed;
          } else {
            user = { ...user, emailVerifiedAt: verifiedAt };
          }
        } catch (err) {
          console.error("[auth/login] Failed to auto-verify email during login", err);
          return NextResponse.json(
            {
              ok: false,
              error: "No se pudo verificar tu cuenta automaticamente. Intenta mas tarde.",
            },
            { status: 500 }
          );
        }
      } else {
        try {
          if (!user.email) {
            throw new Error("Falta correo electronico asociado a la cuenta");
          }
          const verification = await createVerificationCode(user.id);
          await sendVerificationEmail(user.email, verification.code, { name: user.profile?.name ?? null });
          return NextResponse.json(
            {
              ok: false,
              error: "Debes verificar tu correo para continuar.",
              requiresVerification: true,
              email: user.email,
              expiresAt: verification.expiresAt.toISOString(),
            },
            { status: 403 }
          );
        } catch (err: any) {
          const message = err instanceof Error ? err.message : err?.message;
          return NextResponse.json(
            {
              ok: false,
              error: message || "No se pudo reenviar el codigo de verificacion",
              requiresVerification: true,
              email: user.email,
            },
            { status: 500 }
          );
        }
      }
    }

    const token = await createSession(user.id);
    const res = NextResponse.json({ ok: true, user: toAuthUser(user) });
    attachSessionCookie(res, token);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error al iniciar sesion" },
      { status: 500 }
    );
  }
}
