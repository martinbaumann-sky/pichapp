import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMpOauthUrl } from "@/lib/mp/marketplace";
import { encryptSecret } from "@/lib/encryption";

function resolveMpRedirectUri(req: NextRequest): string {
  const envRedirect = process.env.MP_REDIRECT_URI?.trim();
  const originFromHeader = req.headers.get("origin") ?? undefined;
  const origin = originFromHeader ?? req.nextUrl?.origin ?? undefined;

  const parseHost = (value: string | undefined) => {
    if (!value) return null;
    try {
      return new URL(value).hostname;
    } catch {
      return null;
    }
  };

  const isLocalHost = (host: string | null) => {
    if (!host) return false;
    return (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host.endsWith(".internal")
    );
  };

  const shouldUseOriginFallback = (() => {
    if (!origin) {
      return false;
    }
    if (!envRedirect) {
      return true;
    }
    try {
      const envHost = parseHost(envRedirect);
      const originHost = parseHost(origin);
      if (!envHost || !originHost) {
        return false;
      }
      const envIsLocalhost = isLocalHost(envHost);
      const originIsLocalhost = isLocalHost(originHost);
      return envIsLocalhost && !originIsLocalhost;
    } catch {
      return true;
    }
  })();

  if (shouldUseOriginFallback && origin) {
    try {
      return new URL("/api/mp/oauth/callback", origin).toString();
    } catch {
      // fall through to envRedirect
    }
  }

  if (envRedirect) {
    return envRedirect;
  }

  if (origin) {
    const originHost = parseHost(origin);
    if (isLocalHost(originHost)) {
      try {
        return new URL("/api/mp/oauth/callback", origin).toString();
      } catch {
        // fall through to error
      }
    }
    // Guard: avoid generating OAuth redirects that are not registered in Mercado Pago.
    throw new Error(
      "MP_REDIRECT_URI no esta configurado. Configura esta variable con la URL registrada en Mercado Pago antes de volver a intentar.",
    );
  }
  throw new Error("No se pudo resolver la URL de retorno de Mercado Pago");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const requestedVenueId = typeof body?.venueId === "string" ? body.venueId : null;
    const mode = body?.mode === "popup" ? "popup" : "redirect";

    const venue = await prisma.venue.findFirst({
      where: requestedVenueId ? { id: requestedVenueId, ownerId: userId } : { ownerId: userId },
      select: { id: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "No encontramos una cancha asociada" }, { status: 404 });
    }

    const nonce = randomBytes(8).toString("hex");
    const redirectUri = resolveMpRedirectUri(req);
    const statePayload = JSON.stringify({ venueId: venue.id, nonce, ts: Date.now(), mode, redirectUri });
    const state = encryptSecret(statePayload);

    const url = buildMpOauthUrl({ state, redirectUri });
    return NextResponse.json({ url });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[mp/oauth/init]", err);
    return NextResponse.json({ error: err?.message ?? "No se pudo iniciar la conexión" }, { status: 500 });
  }
}
