import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import * as jose from "jose";

const SESSION_COOKIE = "session_token";

function shouldUseSecureCookie(): boolean {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    if (base) {
      const u = new URL(base);
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return false;
      return u.protocol === "https:";
    }
  } catch {}
  // Fallback: disable Secure on localhost/dev
  if (process.env.NODE_ENV !== "production") return false;
  return true;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, days = 30) {
  const secret = getSecret();
  const token = await new jose.SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret);
  return token;
}

export async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value || null;
    if (!token) return null;
    const { payload } = await jose.jwtVerify(token, getSecret());
    const uid = (payload as any)?.uid as string | undefined;
    if (!uid) return null;
    return uid;
  } catch {
    return null;
  }
}

export function attachSessionCookie(res: NextResponse, token: string, days = 30) {
  const maxAge = days * 24 * 60 * 60; // seconds
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: shouldUseSecureCookie(), path: "/", maxAge: 0 });
}
