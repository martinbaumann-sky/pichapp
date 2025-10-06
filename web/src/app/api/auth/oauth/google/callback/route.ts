import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/db";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import {
  PROFILE_PLACEHOLDER_COMUNA,
  PROFILE_PLACEHOLDER_PHONE,
  isProfileIncomplete,
} from "@/lib/profileCompletion";

const GOOGLE_AUTH_COOKIE = "google_oauth_state";

function buildErrorRedirect(origin: string, code: string, message?: string) {
  const url = new URL("/auth/error", origin);
  url.searchParams.set("provider", "google");
  url.searchParams.set("code", code);
  if (message) {
    url.searchParams.set("message", message);
  }
  return NextResponse.redirect(url.toString());
}

function parseStateCookie(raw: string | undefined) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const state = typeof parsed.state === "string" ? parsed.state : null;
    const codeVerifier = typeof parsed.codeVerifier === "string" ? parsed.codeVerifier : null;
    const next = typeof parsed.next === "string" ? parsed.next : null;
    if (!state || !codeVerifier) return null;
    return { state, codeVerifier, next };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const origin = url.origin;
  const error = url.searchParams.get("error");
  if (error) {
    return buildErrorRedirect(origin, error, url.searchParams.get("error_description") || undefined);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const stored = parseStateCookie(req.cookies.get(GOOGLE_AUTH_COOKIE)?.value);
  const clearCookie = (response: NextResponse) => {
    response.cookies.set(GOOGLE_AUTH_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!stored || !state || stored.state !== state) {
    return clearCookie(buildErrorRedirect(origin, "invalid_state"));
  }

  if (!code) {
    return clearCookie(buildErrorRedirect(origin, "missing_code"));
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return clearCookie(buildErrorRedirect(origin, "config", "Faltan credenciales de Google"));
  }

  const redirectUri = new URL("/api/auth/oauth/google/callback", origin).toString();
  const oauthClient = new OAuth2Client(clientId, clientSecret, redirectUri);

  let tokens;
  try {
    const result = await oauthClient.getToken({ code, codeVerifier: stored.codeVerifier, redirect_uri: redirectUri });
    tokens = result.tokens;
    oauthClient.setCredentials(tokens);
  } catch (err: any) {
    return clearCookie(
      buildErrorRedirect(origin, "exchange_failed", err?.message || "No se pudo validar la respuesta de Google")
    );
  }

  const idToken = tokens.id_token;
  if (!idToken) {
    return clearCookie(buildErrorRedirect(origin, "missing_id_token"));
  }

  let payload;
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: clientId });
    payload = ticket.getPayload();
  } catch (err: any) {
    return clearCookie(
      buildErrorRedirect(origin, "invalid_id_token", err?.message || "Token de Google invalido")
    );
  }

  if (!payload || !payload.sub || !payload.email) {
    return clearCookie(buildErrorRedirect(origin, "incomplete_profile"));
  }

  const googleId = payload.sub;
  const email = String(payload.email).toLowerCase();
  const emailVerified = !!payload.email_verified;
  const displayName = payload.name || null;
  const givenName = payload.given_name || null;
  const familyName = payload.family_name || null;
  const now = new Date();
  const defaultPhone = PROFILE_PLACEHOLDER_PHONE;

  const userSelect = {
    id: true,
    email: true,
    isAdmin: true,
    role: true,
    emailVerifiedAt: true,
    disabledAt: true,
    profile: { select: { name: true, comuna: true, position: true, phone: true } },
  } as const;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingAccount = await tx.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: googleId } },
        select: { id: true, userId: true, refreshToken: true },
      });

      const updateAccountTokens = async (accountId: string, refreshToken?: string | null) => {
        const data: Record<string, any> = {
          email,
          accessToken: tokens.access_token ?? null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        };
        if (tokens.refresh_token) {
          data.refreshToken = tokens.refresh_token;
        } else if (refreshToken) {
          data.refreshToken = refreshToken;
        }
        await tx.oAuthAccount.update({ where: { id: accountId }, data });
      };

      const ensureProfile = async (userId: string) => {
        const composedName =
          displayName ||
          (givenName ? `${givenName}${familyName ? ` ${familyName}` : ""}` : email.split("@")[0]);
        const profile = await tx.profile.findUnique({ where: { userId } });
        if (!profile) {
          await tx.profile.create({
            data: {
              userId,
              name: composedName,
              phone: defaultPhone,
              comuna: PROFILE_PLACEHOLDER_COMUNA,
            },
          });
        } else if (!profile.name && composedName) {
          await tx.profile.update({ where: { userId }, data: { name: composedName } });
        }
        return tx.user.findUnique({ where: { id: userId }, select: userSelect });
      };

      if (existingAccount) {
        let user = await tx.user.findUnique({ where: { id: existingAccount.userId }, select: userSelect });
        if (!user) {
          await tx.oAuthAccount.delete({ where: { id: existingAccount.id } });
        } else {
          await updateAccountTokens(existingAccount.id, existingAccount.refreshToken);
          const needsVerification = emailVerified && !user.emailVerifiedAt;
          if (needsVerification) {
            user = await tx.user.update({
              where: { id: user.id },
              data: { emailVerifiedAt: now },
              select: userSelect,
            });
          }
          const refreshed = await ensureProfile(user.id);
          return { user: refreshed ?? user, next: stored.next ?? null };
        }
      }

      const existingUser = await tx.user.findUnique({ where: { email }, select: userSelect });
      if (existingUser) {
        let user = existingUser;
        const updates: Record<string, any> = {};
        if (emailVerified && !user.emailVerifiedAt) {
          updates.emailVerifiedAt = now;
        }
        if (Object.keys(updates).length > 0) {
          user = await tx.user.update({ where: { id: user.id }, data: updates, select: userSelect });
        }
        user = (await ensureProfile(user.id)) ?? user;
        await tx.oAuthAccount.upsert({
          where: { provider_providerAccountId: { provider: "google", providerAccountId: googleId } },
          create: {
            provider: "google",
            providerAccountId: googleId,
            email,
            accessToken: tokens.access_token ?? null,
            refreshToken: tokens.refresh_token ?? null,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            userId: user.id,
          },
          update: {
            email,
            accessToken: tokens.access_token ?? null,
            expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
          },
        });
        return { user, next: stored.next ?? null };
      }

      const user = await tx.user.create({
        data: {
          email,
          emailVerifiedAt: emailVerified ? now : null,
          role: "PLAYER",
          profile: {
            create: {
              name:
                displayName || (givenName ? `${givenName}${familyName ? ` ${familyName}` : ""}` : email.split("@")[0]),
              phone: defaultPhone,
              comuna: PROFILE_PLACEHOLDER_COMUNA,
            },
          },
        },
        select: userSelect,
      });

      await tx.oAuthAccount.create({
        data: {
          provider: "google",
          providerAccountId: googleId,
          email,
          accessToken: tokens.access_token ?? null,
          refreshToken: tokens.refresh_token ?? null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          userId: user.id,
        },
      });

      return { user, next: stored.next ?? null };
    });

    if (!result?.user) {
      return clearCookie(buildErrorRedirect(origin, "user_not_found"));
    }

    if (result.user.disabledAt) {
      return clearCookie(buildErrorRedirect(origin, "account_disabled"));
    }

    const sessionToken = await createSession(result.user.id);
    const profileIncomplete = isProfileIncomplete(result.user.profile);
    const redirectTo = result.next ?? (profileIncomplete ? "/perfil" : "/");
    const response = NextResponse.redirect(new URL(redirectTo, origin).toString());
    attachSessionCookie(response, sessionToken);
    clearCookie(response);
    return response;
  } catch (err: any) {
    return clearCookie(buildErrorRedirect(origin, "internal", err?.message));
  }
}
