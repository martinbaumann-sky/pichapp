import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { getPasswordHash, setPasswordHash } from "@/lib/auth-password";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";
import { createVerificationCode, sendVerificationEmail, isEmailVerificationEnabled } from "@/lib/email-verification";
import { buildEmailLookupWhere } from "@/lib/email-normalization";
import { toAuthUser } from "@/lib/auth-user";
import { verifySupabasePassword } from "@/lib/supabase-admin";

function secureCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  try {
    return timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

const rl = createRateLimiter({ name: "auth_login", limit: 10, windowSec: 60 });

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  isAdmin: true,
  role: true,
  emailVerifiedAt: true,
  disabledAt: true,
  passwordHash: true,
  profile: { select: { name: true, comuna: true, position: true } },
  oauthAccounts: { select: { provider: true } },
} as const;

const ADMIN_OVERRIDE_EMAIL = "contacto.pichapp@gmail.com";
const ADMIN_OVERRIDE_PASSWORD = process.env.ADMIN_OVERRIDE_PASSWORD ?? "Babolat3008";
const ADMIN_OVERRIDE_PROFILE = {
  name: "Equipo Pichapp",
  phone: "+56900000000",
  comuna: "Santiago",
};

async function ensureAdminOverrideUser() {
  const passwordHash = await bcrypt.hash(ADMIN_OVERRIDE_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: ADMIN_OVERRIDE_EMAIL },
    update: {
      isAdmin: true,
      role: "SUPERADMIN",
      emailVerifiedAt: new Date(),
      disabledAt: null,
      passwordHash,
      profile: {
        upsert: {
          create: {
            name: ADMIN_OVERRIDE_PROFILE.name,
            phone: ADMIN_OVERRIDE_PROFILE.phone,
            comuna: ADMIN_OVERRIDE_PROFILE.comuna,
          },
          update: {
            name: ADMIN_OVERRIDE_PROFILE.name,
            phone: ADMIN_OVERRIDE_PROFILE.phone,
            comuna: ADMIN_OVERRIDE_PROFILE.comuna,
          },
        },
      },
    },
    create: {
      email: ADMIN_OVERRIDE_EMAIL,
      isAdmin: true,
      role: "SUPERADMIN",
      passwordHash,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          name: ADMIN_OVERRIDE_PROFILE.name,
          phone: ADMIN_OVERRIDE_PROFILE.phone,
          comuna: ADMIN_OVERRIDE_PROFILE.comuna,
        },
      },
    },
    select: AUTH_USER_SELECT,
  });

  try {
    await setPasswordHash(user.id, passwordHash);
  } catch {
    // ignore persistence fallback
  }

  return user;
}

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

    const envAdminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminPassword = String(process.env.ADMIN_PASSWORD || "");
    const isEnvAdmin = Boolean(envAdminEmail) && email === envAdminEmail;

    const isAdminOverrideAttempt = secureCompare(email, ADMIN_OVERRIDE_EMAIL);
    if (isAdminOverrideAttempt && !secureCompare(password, ADMIN_OVERRIDE_PASSWORD)) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }
    if (isAdminOverrideAttempt) {
      const adminUser = await ensureAdminOverrideUser();
      if (adminUser.disabledAt) {
        return NextResponse.json({ ok: false, error: "Tu cuenta esta bloqueada." }, { status: 403 });
      }
      const token = await createSession(adminUser.id);
      const res = NextResponse.json({ ok: true, user: toAuthUser(adminUser) });
      attachSessionCookie(res, token);
      return res;
    }

    const emailWhere = buildEmailLookupWhere(email);
    const primaryUser = await prisma.user.findFirst({
      where: {
        AND: [
          emailWhere,
          {
            OR: [
              { passwordHash: { not: null } },
              { localPassword: { isNot: null } },
            ],
          },
        ],
      },
      select: AUTH_USER_SELECT,
      orderBy: { createdAt: "asc" },
    });

    const fallbackUser =
      primaryUser ??
      (await prisma.user.findFirst({
        where: emailWhere,
        select: AUTH_USER_SELECT,
        orderBy: { createdAt: "asc" },
      }));

    let user = fallbackUser;
    let hash: string | null = null;

    if (!user && isEnvAdmin) {
      if (!envAdminPassword || !secureCompare(envAdminPassword, password)) {
        return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
      }

      const adminHash = await bcrypt.hash(envAdminPassword, 10);
      user = await prisma.user.create({
        data: {
          email: envAdminEmail,
          passwordHash: adminHash,
          isAdmin: true,
          role: "SUPERADMIN",
          emailVerifiedAt: new Date(),
        },
        select: AUTH_USER_SELECT,
      });

      try {
        await setPasswordHash(user.id, adminHash);
      } catch (error) {
        console.warn("[auth/login] Failed to persist admin password", error);
      }

      hash = adminHash;
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
    }

    if (user.disabledAt) {
      return NextResponse.json({ ok: false, error: "Tu cuenta esta bloqueada." }, { status: 403 });
    }

    if (isEnvAdmin) {
      if (!envAdminPassword || !secureCompare(envAdminPassword, password)) {
        return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
      }

      const adminHash = hash ?? user.passwordHash ?? null;
      const isHashValid = adminHash ? await bcrypt.compare(envAdminPassword, adminHash) : false;
      const nextHash = isHashValid ? adminHash : await bcrypt.hash(envAdminPassword, 10);

      if (!isHashValid || !user.isAdmin || String(user.role).toUpperCase() !== "SUPERADMIN") {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: nextHash,
            isAdmin: true,
            role: "SUPERADMIN",
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          },
          select: AUTH_USER_SELECT,
        });
        user = updated;
      }

      try {
        await setPasswordHash(user.id, nextHash);
      } catch (error) {
        console.warn("[auth/login] Failed to persist admin password", error);
      }

      hash = nextHash;
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

    const oauthProviders = new Set(
      (user.oauthAccounts ?? [])
        .map((account) => (account?.provider || "").toLowerCase())
        .filter(Boolean)
    );
    const providerLabels = Array.from(oauthProviders).map((provider) => {
      switch (provider) {
        case "google":
          return "Google";
        default:
          return provider.charAt(0).toUpperCase() + provider.slice(1);
      }
    });
    const buildOAuthOnlyResponse = () => {
      if (oauthProviders.size === 0) return null;
      const formattedProviders = providerLabels.join(" o ");
      return NextResponse.json(
        {
          ok: false,
          error: `Tu cuenta fue creada usando ${formattedProviders}. Inicia sesión con ${
            providerLabels.length === 1 ? "ese método" : "uno de esos métodos"
          }.`,
          requiresOAuth: true,
          providers: Array.from(oauthProviders),
        },
        { status: 409 }
      );
    };

    if (!hash) {
      try {
        hash = await getPasswordHash(user.id);
      } catch {
        // ignore
      }
    }

    if (!hash && user.passwordHash) {
      hash = user.passwordHash;
    }

    if (!hash && !isEnvAdmin) {
      if (!user.passwordHash && oauthProviders.size > 0) {
        const response = buildOAuthOnlyResponse();
        if (response) return response;
      }

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

        const refreshed = await prisma.user.findUnique({ where: { id: user.id }, select: AUTH_USER_SELECT });
        if (refreshed) {
          user = refreshed;
        } else if (!user.emailVerifiedAt && supabaseResult.emailVerifiedAt) {
          user = { ...user, emailVerifiedAt: supabaseResult.emailVerifiedAt };
        }
      } else if (supabaseResult.reason === "invalid_credentials") {
        if (oauthProviders.size > 0) {
          const response =
            buildOAuthOnlyResponse() ??
            NextResponse.json(
              {
                ok: false,
                error: "Tu cuenta fue creada con un acceso social. Inicia sesión con Google.",
                requiresOAuth: true,
                providers: Array.from(oauthProviders),
              },
              { status: 409 }
            );
          return response;
        }
        return NextResponse.json({ ok: false, error: "Credenciales invalidas" }, { status: 401 });
      }
    }

    if (!hash) {
      if (oauthProviders.size > 0) {
        const response = buildOAuthOnlyResponse();
        if (response) return response;
      }
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
            select: AUTH_USER_SELECT,
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
