import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMpOauthUrl } from "@/lib/mp/marketplace";
import { encryptSecret } from "@/lib/encryption";

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
    const statePayload = JSON.stringify({ venueId: venue.id, nonce, ts: Date.now(), mode });
    const state = encodeURIComponent(encryptSecret(statePayload));

    const url = buildMpOauthUrl({ state });
    return NextResponse.json({ url });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[mp/oauth/init]", err);
    return NextResponse.json({ error: err?.message ?? "No se pudo iniciar la conexión" }, { status: 500 });
  }
}
