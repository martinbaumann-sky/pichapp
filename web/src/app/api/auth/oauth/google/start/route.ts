import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { shouldUseSecureCookies } from "@/lib/auth-core";

const GOOGLE_AUTH_COOKIE = "google_oauth_state";

function base64UrlEncode(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "Falta GOOGLE_OAUTH_CLIENT_ID" },
      { status: 500 }
    );
  }

  const url = req.nextUrl;
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : null;

  const state = base64UrlEncode(crypto.randomBytes(32));
  const codeVerifier = base64UrlEncode(crypto.randomBytes(64));
  const codeChallenge = base64UrlEncode(crypto.createHash("sha256").update(codeVerifier).digest());

  const redirectUri = new URL("/api/auth/oauth/google/callback", url.origin).toString();

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("prompt", "select_account");
  authorizeUrl.searchParams.set("access_type", "offline");

  const res = NextResponse.redirect(authorizeUrl.toString());
  res.cookies.set(GOOGLE_AUTH_COOKIE, JSON.stringify({ state, codeVerifier, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 600,
  });
  return res;
}
