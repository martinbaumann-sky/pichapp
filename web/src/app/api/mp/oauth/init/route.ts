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

  const shouldUseOriginFallback = (() => {
    if (!origin) {
      return false;
    }
    if (!envRedirect) {
      return true;
    }
    try {
      const envHost = new URL(envRedirect).hostname;
      const originHost = new URL(origin).hostname;
      if (!envHost || !originHost) {
        return false;
      }
      const envIsLocalhost = envHost === "localhost" || envHost.endsWith(".localhost");
      const originIsLocalhost = originHost === "localhost" || originHost.endsWith(".localhost");
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
    return new URL("/api/mp/oauth/callback", origin).toString();
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
