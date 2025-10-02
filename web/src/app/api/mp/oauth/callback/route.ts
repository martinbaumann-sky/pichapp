import { NextRequest, NextResponse } from "next/server";
import { decryptSecret, encryptSecret } from "@/lib/encryption";
import { exchangeMpAuthorizationCode } from "@/lib/mp/marketplace";
import { prisma } from "@/lib/db";

const STATE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");

    if (!code || !stateRaw) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    let payload: any;
    try {
      const decoded = decodeURIComponent(stateRaw);
      const json = decryptSecret(decoded);
      payload = json ? JSON.parse(json) : null;
    } catch (err) {
      console.error("[mp/oauth/callback] invalid state", err);
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    if (!payload?.venueId || typeof payload.venueId !== "string") {
      return NextResponse.json({ error: "Falta información de la cancha" }, { status: 400 });
    }

    if (payload?.ts && Date.now() - Number(payload.ts) > STATE_TTL_MS) {
      return NextResponse.json({ error: "El enlace de autorización expiró" }, { status: 400 });
    }

    const venue = await prisma.venue.findUnique({ where: { id: payload.venueId }, select: { id: true } });
    if (!venue) {
      return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
    }

    const tokenResponse = await exchangeMpAuthorizationCode(code);
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : null;

    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        mpAccessToken: encryptSecret(tokenResponse.access_token),
        mpRefreshToken: tokenResponse.refresh_token ? encryptSecret(tokenResponse.refresh_token) : null,
        mpTokenExpiresAt: expiresAt,
        mpUserId: tokenResponse.user_id ? String(tokenResponse.user_id) : undefined,
      },
    });

    const redirect = process.env.MP_REDIRECT_SUCCESS_URL || "/panel/cancha?mp=connected";
    return NextResponse.redirect(new URL(redirect, url.origin));
  } catch (err: any) {
    console.error("[mp/oauth/callback]", err);
    const url = new URL(req.url);
    const failure = process.env.MP_REDIRECT_ERROR_URL || "/panel/cancha?mp=error";
    const target = new URL(failure, url.origin);
    target.searchParams.set("reason", err?.message ?? "unknown");
    return NextResponse.redirect(target);
  }
}
