import { NextRequest, NextResponse } from "next/server";
import { decryptSecret, encryptSecret } from "@/lib/encryption";
import {
  deriveMpAccountHolder,
  deriveMpAccountType,
  deriveMpTaxId,
  exchangeMpAuthorizationCode,
  fetchMpUserProfile,
} from "@/lib/mp/marketplace";
import { prisma } from "@/lib/db";

const STATE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  let mode: "popup" | "redirect" = "redirect";
  let venueId: string | null = null;
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

    mode = payload?.mode === "popup" ? "popup" : "redirect";
    venueId = payload.venueId;
    const redirectUriFromState =
      typeof payload?.redirectUri === "string" && payload.redirectUri.trim().length > 0 ? payload.redirectUri : null;
    const resolvedRedirectUri = (() => {
      if (!redirectUriFromState) {
        return process.env.MP_REDIRECT_URI;
      }
      try {
        const stateHost = new URL(redirectUriFromState).host;
        const callbackHost = new URL(req.nextUrl.origin).host;
        if (stateHost !== callbackHost) {
          return process.env.MP_REDIRECT_URI ?? null;
        }
      } catch {
        return process.env.MP_REDIRECT_URI ?? null;
      }
      return redirectUriFromState;
    })();

    if (payload?.ts && Date.now() - Number(payload.ts) > STATE_TTL_MS) {
      return NextResponse.json({ error: "El enlace de autorización expiró" }, { status: 400 });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: payload.venueId },
      select: {
        id: true,
        mpCollectorId: true,
        mpAccountType: true,
        accountHolder: true,
        payoutEmail: true,
        taxId: true,
        paymentProvider: true,
      },
    });
    if (!venue) {
      return NextResponse.json({ error: "Cancha no encontrada" }, { status: 404 });
    }

    venueId = venue.id;

    const tokenResponse = await exchangeMpAuthorizationCode(code, {
      redirectUri: resolvedRedirectUri ?? undefined,
    });
    const expiresAt = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : null;

    let collectorIdFromProfile: string | null = null;
    let accountTypeFromProfile: string | null = null;
    let accountHolderFromProfile: string | null = null;
    let payoutEmailFromProfile: string | null = null;
    let taxIdFromProfile: string | null = null;

    try {
      const profile = await fetchMpUserProfile(tokenResponse.access_token);
      if (profile) {
        collectorIdFromProfile = profile.id ? String(profile.id) : null;
        accountTypeFromProfile = deriveMpAccountType(profile);
        accountHolderFromProfile = deriveMpAccountHolder(profile);
        payoutEmailFromProfile = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : null;
        taxIdFromProfile = deriveMpTaxId(profile);
      }
    } catch (err) {
      console.warn(`[mp/oauth/callback] no se pudo obtener el perfil de MP para la cancha ${venue.id}`, err);
    }

    const context = `venue:${venue.id}`;
    const dataToPersist: any = {
      where: { id: venue.id },
      data: {
        mpAccessToken: encryptSecret(tokenResponse.access_token, { context }),
        mpRefreshToken: tokenResponse.refresh_token ? encryptSecret(tokenResponse.refresh_token, { context }) : null,
        mpTokenExpiresAt: expiresAt,
        mpUserId: collectorIdFromProfile ?? (tokenResponse.user_id ? String(tokenResponse.user_id) : undefined),
      },
    } as const;

    const updates: Record<string, unknown> = {};

    const resolvedCollectorId =
      collectorIdFromProfile ?? (tokenResponse.user_id ? String(tokenResponse.user_id) : null);
    if (resolvedCollectorId) {
      const existing = await prisma.venue.findFirst({
        where: { mpUserId: resolvedCollectorId, NOT: { id: venue.id } },
        select: { id: true, name: true },
      });
      if (existing) {
        throw new Error(
          existing.name
            ? `Esta cuenta de Mercado Pago ya está conectada a la cancha ${existing.name}.`
            : "Esta cuenta de Mercado Pago ya está conectada a otra cancha.",
        );
      }
      updates.mpAccountId = resolvedCollectorId;
      if (venue.mpCollectorId !== resolvedCollectorId) {
        updates.mpCollectorId = resolvedCollectorId;
      }
    }
    if (!venue.mpAccountType && accountTypeFromProfile) {
      updates.mpAccountType = accountTypeFromProfile;
    }
    if (!venue.accountHolder && accountHolderFromProfile) {
      updates.accountHolder = accountHolderFromProfile;
    }
    if (!venue.payoutEmail && payoutEmailFromProfile) {
      updates.payoutEmail = payoutEmailFromProfile;
    }
    if (!venue.taxId && taxIdFromProfile) {
      updates.taxId = taxIdFromProfile;
    }
    if (venue.paymentProvider !== "MP") {
      updates.paymentProvider = "MP";
    }

    await prisma.venue.update({
      where: dataToPersist.where,
      data: { ...dataToPersist.data, ...updates },
    });

    const isPopup = mode === "popup";
    if (isPopup) {
      const popupSuccess = process.env.MP_POPUP_SUCCESS_URL || "/panel/cancha/mp/complete";
      const target = new URL(popupSuccess, url.origin);
      target.searchParams.set("status", "connected");
      target.searchParams.set("venueId", venue.id);
      return NextResponse.redirect(target);
    }

    const redirect = process.env.MP_REDIRECT_SUCCESS_URL || "/panel/cancha?mp=connected";
    return NextResponse.redirect(new URL(redirect, url.origin));
  } catch (err: any) {
    console.error("[mp/oauth/callback]", err);
    const url = new URL(req.url);
    const message = err?.message ?? "unknown";

    if (mode === "popup") {
      const popupError = process.env.MP_POPUP_ERROR_URL || "/panel/cancha/mp/complete";
      const target = new URL(popupError, url.origin);
      target.searchParams.set("status", "error");
      if (venueId) {
        target.searchParams.set("venueId", venueId);
      }
      if (message) {
        target.searchParams.set("reason", message);
      }
      return NextResponse.redirect(target);
    }

    const failure = process.env.MP_REDIRECT_ERROR_URL || "/panel/cancha?mp=error";
    const target = new URL(failure, url.origin);
    if (message) {
      target.searchParams.set("reason", message);
    }
    return NextResponse.redirect(target);
  }
}
